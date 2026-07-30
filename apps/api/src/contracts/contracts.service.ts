import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DEFAULT_COUNTRY,
  getCountryProfile,
  isCountryCode,
  type AssembledContractDocument,
  type ContractClauseLibraryEntry,
  type ContractReaderResponse,
  type ContractSummary,
  type ContractTemplate,
  type ContractVersionDetail,
  type ContractVersionDiff,
  type ContractVersionSummary,
  type CountryCode,
  type CreateContractTemplateRequest,
  type CreateContractVersionRequest,
  type GlossaryTerm,
  type ReaderLocale,
  type Transfer,
  type UpsertContractClauseRequest,
} from '@velar/types';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { buildContractReaderResponse } from './plain-language';
import { deriveContractSummary } from './domain/summary';
import { assembleContractDocument } from './domain/assembly';
import { diffContractVersions } from './domain/diff';

interface GlossaryRow {
  id: string;
  term: string;
  definition: string;
  locale: string;
  aliases: string[] | null;
}

/**
 * Backend service for the contract intelligence & document assembly engine
 * (#38) and the contract reading & comprehension experience (#39). Only does
 * I/O (Supabase reads) and delegates all derivation/assembly/diff logic to
 * the pure functions in `domain/`.
 */
@Injectable()
export class ContractsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  // ── #39: glossary + reader (unchanged) ──────────────────────────────────

  /** Returns the glossary terms for a locale (`GET /contracts/glossary`). */
  async getGlossary(locale: ReaderLocale = 'es'): Promise<GlossaryTerm[]> {
    const { data, error } = await this.supabase.admin
      .from('glossary_terms')
      .select('id, term, definition, locale, aliases')
      .eq('locale', locale);

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: GlossaryRow) => ({
      id: row.id,
      term: row.term,
      definition: row.definition,
      locale: (row.locale as ReaderLocale) ?? 'es',
      aliases: row.aliases ?? undefined,
    }));
  }

  /** Returns the typed reader response for a bond (`GET /contracts/:bondId/reader`). */
  async getReader(bondId: string, locale: ReaderLocale = 'es'): Promise<ContractReaderResponse> {
    const [summary, glossary] = await Promise.all([
      this.getContractSummary(bondId),
      this.getGlossary(locale),
    ]);
    return buildContractReaderResponse(summary, glossary, locale);
  }

  // ── #38: structured contract summary + document assembly + versioning ──

  /**
   * Returns the derived `ContractSummary` for a bond. Accepts either its
   * `token_id` (uuid) or human-readable `bond_id`. Used by both the public
   * reader (#39) and the authenticated `GET /bonds/:tokenId/summary`.
   */
  async getContractSummary(bondIdOrToken: string): Promise<ContractSummary> {
    const tokenId = await this.audit.resolveTokenId(bondIdOrToken);
    const { bond, transfers } = await this.audit.getProvenanceInput(tokenId);
    const country = await this.resolveBondCountry(tokenId);
    const template = await this.resolveTemplateForCountry(country);
    const version = await this.resolvePublishedVersion(template.id);
    const params = await this.buildParams(bond.bondId, bond.issuerPartyId, transfers, country, bond);

    return deriveContractSummary({
      bond,
      transfers,
      template,
      version,
      params,
      now: new Date().toISOString(),
    });
  }

  /** Assembles the full legal document for a bond (`GET /contracts/:bondId/document`). */
  async getDocument(bondIdOrToken: string, versionId?: string): Promise<AssembledContractDocument> {
    const tokenId = await this.audit.resolveTokenId(bondIdOrToken);
    const { bond, transfers } = await this.audit.getProvenanceInput(tokenId);
    const country = await this.resolveBondCountry(tokenId);

    const version = versionId
      ? await this.getVersionDetail(versionId)
      : await (async () => {
          const template = await this.resolveTemplateForCountry(country);
          return this.resolvePublishedVersion(template.id);
        })();

    const params = await this.buildParams(bond.bondId, bond.issuerPartyId, transfers, country, bond);
    return assembleContractDocument({ bond, version, params, now: new Date().toISOString() });
  }

  async listTemplates(country?: string): Promise<ContractTemplate[]> {
    let query = this.supabase.admin.from('contract_templates').select('*').order('country');
    if (country) query = query.eq('country', country);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => this.mapTemplateRow(row));
  }

  async createTemplate(input: CreateContractTemplateRequest): Promise<ContractTemplate> {
    const { data, error } = await this.supabase.admin
      .from('contract_templates')
      .insert({ key: input.key, country: input.country, name: input.name, description: input.description ?? null })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return this.mapTemplateRow(data);
  }

  async listVersions(templateId: string): Promise<ContractVersionSummary[]> {
    const { data, error } = await this.supabase.admin
      .from('contract_versions')
      .select('*')
      .eq('template_id', templateId)
      .order('version_number', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => this.mapVersionSummaryRow(row));
  }

  async createVersion(
    templateId: string,
    input: CreateContractVersionRequest,
    actorId?: string,
  ): Promise<ContractVersionSummary> {
    const { data: existing, error: existingError } = await this.supabase.admin
      .from('contract_versions')
      .select('version_number')
      .eq('template_id', templateId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    const nextVersion = (existing?.version_number ?? 0) + 1;

    const { data, error } = await this.supabase.admin
      .from('contract_versions')
      .insert({
        template_id: templateId,
        version_number: nextVersion,
        status: 'draft',
        clause_keys: input.clauseKeys,
        notes: input.notes ?? null,
        created_by: actorId ?? null,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return this.mapVersionSummaryRow(data);
  }

  async publishVersion(versionId: string): Promise<ContractVersionSummary> {
    const { data, error } = await this.supabase.admin
      .from('contract_versions')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', versionId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Versión no encontrada');
    return this.mapVersionSummaryRow(data);
  }

  async getVersionDetail(versionId: string): Promise<ContractVersionDetail> {
    const { data, error } = await this.supabase.admin
      .from('contract_versions')
      .select('*')
      .eq('id', versionId)
      .single();
    if (error || !data) throw new NotFoundException('Versión no encontrada');
    const clauses = await this.resolveClausesForKeys(data.clause_keys ?? []);
    return { ...this.mapVersionSummaryRow(data), clauses };
  }

  async diffVersions(fromVersionId: string, toVersionId: string): Promise<ContractVersionDiff> {
    const [from, to] = await Promise.all([
      this.getVersionDetail(fromVersionId),
      this.getVersionDetail(toVersionId),
    ]);
    return diffContractVersions(from, to);
  }

  async listClauses(category?: string): Promise<ContractClauseLibraryEntry[]> {
    let query = this.supabase.admin.from('contract_clauses').select('*').order('clause_key');
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => this.mapClauseRow(row));
  }

  async upsertClause(input: UpsertContractClauseRequest): Promise<ContractClauseLibraryEntry> {
    const { data, error } = await this.supabase.admin
      .from('contract_clauses')
      .upsert(
        {
          clause_key: input.clauseKey,
          category: input.category,
          title: input.title,
          body_template: input.bodyTemplate,
          parameters: input.parameters ?? [],
          locale: input.locale ?? 'es',
        },
        { onConflict: 'clause_key' },
      )
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return this.mapClauseRow(data);
  }

  // ── internal helpers ─────────────────────────────────────────────────

  private async resolveBondCountry(tokenId: string): Promise<CountryCode> {
    const { data } = await this.supabase.admin.from('bonds').select('country').eq('token_id', tokenId).maybeSingle();
    return isCountryCode(data?.country) ? data.country : DEFAULT_COUNTRY;
  }

  private async resolveTemplateForCountry(country: CountryCode): Promise<ContractTemplate> {
    const { data } = await this.supabase.admin
      .from('contract_templates')
      .select('*')
      .eq('country', country)
      .limit(1)
      .maybeSingle();
    if (data) return this.mapTemplateRow(data);

    if (country !== DEFAULT_COUNTRY) {
      const { data: fallback } = await this.supabase.admin
        .from('contract_templates')
        .select('*')
        .eq('country', DEFAULT_COUNTRY)
        .limit(1)
        .maybeSingle();
      if (fallback) return this.mapTemplateRow(fallback);
    }

    throw new NotFoundException('No hay una plantilla de contrato configurada.');
  }

  private async resolvePublishedVersion(templateId: string): Promise<ContractVersionDetail> {
    const { data, error } = await this.supabase.admin
      .from('contract_versions')
      .select('*')
      .eq('template_id', templateId)
      .eq('status', 'published')
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('No hay una versión publicada de la plantilla.');
    const clauses = await this.resolveClausesForKeys(data.clause_keys ?? []);
    return { ...this.mapVersionSummaryRow(data), clauses };
  }

  private async resolveClausesForKeys(clauseKeys: string[]): Promise<ContractClauseLibraryEntry[]> {
    if (clauseKeys.length === 0) return [];
    const { data, error } = await this.supabase.admin.from('contract_clauses').select('*').in('clause_key', clauseKeys);
    if (error) throw new Error(error.message);
    const byKey = new Map((data ?? []).map((row) => [row.clause_key, this.mapClauseRow(row)]));
    // Preserve the version's declared order; drop keys whose clause no longer exists.
    return clauseKeys.map((key) => byKey.get(key)).filter((clause): clause is ContractClauseLibraryEntry => !!clause);
  }

  /**
   * Best-effort display parameters for document assembly/summary rendering.
   * Unresolvable values are simply omitted — `resolveClauseTemplate` (domain
   * layer) turns a missing key into an explicit, non-fabricated placeholder.
   */
  private async buildParams(
    bondId: string,
    issuerPartyId: string,
    transfers: Transfer[],
    country: CountryCode,
    bond: { faceValue?: number | null; currency?: string | null; tokenId: string },
  ): Promise<Record<string, string>> {
    const relevant = transfers
      .filter((t) => t.status !== 'rechazada' && t.status !== 'cancelada')
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];

    const [sellerName, buyerName, partyName] = await Promise.all([
      relevant ? this.resolveProfileName(relevant.fromOwner) : Promise.resolve(undefined),
      relevant ? this.resolveProfileName(relevant.toOwner) : Promise.resolve(undefined),
      this.resolvePartyName(issuerPartyId),
    ]);

    const profile = getCountryProfile(country);
    const amount = relevant?.amount ?? bond.faceValue ?? undefined;

    const params: Record<string, string> = {
      bondId,
      tokenId: bond.tokenId,
      jurisdiction: profile.name,
      authority: profile.authority.name,
    };
    if (sellerName ?? partyName) params.sellerName = sellerName ?? partyName!;
    if (buyerName) params.buyerName = buyerName;
    if (amount != null) params.amount = String(amount);
    if (bond.currency) params.currency = bond.currency;
    return params;
  }

  private async resolveProfileName(profileId: string | null | undefined): Promise<string | undefined> {
    if (!profileId) return undefined;
    const { data } = await this.supabase.admin.from('profiles').select('full_name').eq('id', profileId).maybeSingle();
    return data?.full_name ?? undefined;
  }

  private async resolvePartyName(partyId: string | null | undefined): Promise<string | undefined> {
    if (!partyId) return undefined;
    const { data } = await this.supabase.admin.from('parties').select('name').eq('id', partyId).maybeSingle();
    return data?.name ?? undefined;
  }

  private mapTemplateRow(row: any): ContractTemplate {
    return {
      id: row.id,
      key: row.key,
      country: row.country,
      name: row.name,
      description: row.description ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapVersionSummaryRow(row: any): ContractVersionSummary {
    return {
      id: row.id,
      templateId: row.template_id,
      versionNumber: row.version_number,
      status: row.status,
      clauseKeys: row.clause_keys ?? [],
      notes: row.notes ?? null,
      createdBy: row.created_by ?? null,
      createdAt: row.created_at,
      publishedAt: row.published_at ?? null,
    };
  }

  private mapClauseRow(row: any): ContractClauseLibraryEntry {
    return {
      id: row.id,
      clauseKey: row.clause_key,
      category: row.category,
      title: row.title,
      bodyTemplate: row.body_template,
      parameters: row.parameters ?? [],
      locale: row.locale ?? 'es',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
