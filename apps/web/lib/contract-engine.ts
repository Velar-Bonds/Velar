import type {
  AssembledContractDocument,
  ContractAmount,
  ContractAttentionSeverity,
  ContractClauseLibraryEntry,
  ContractStatus,
  ContractSummary,
  ContractTemplate,
  ContractVersionDetail,
  ContractVersionDiff,
  ContractVersionSummary,
} from '@velar/types';
import { formatMoney } from '@velar/types';

/**
 * Client + pure helpers for the contract intelligence & document assembly
 * engine management UI (issue #38). Pure and framework-free (mirrors
 * `lib/provenance.ts`/`lib/contract-reader.ts`) so they're unit-testable in
 * node with fixtures, no backend or credentials required.
 */

// ─── Client ─────────────────────────────────────────────────────────────

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface ContractEngineClientOptions {
  baseUrl: string;
  fetch?: FetchLike;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

async function getJson<T>(opts: ContractEngineClientOptions, path: string): Promise<T> {
  const doFetch = opts.fetch ?? fetch;
  const res = await doFetch(joinUrl(opts.baseUrl, path), { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = (await res.json()) as { message?: unknown; error?: unknown };
      const detail = body?.message ?? body?.error;
      if (typeof detail === 'string' && detail.trim()) message = detail;
    } catch {
      /* keep the status-based message */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export interface ContractEngineClient {
  getSummary(tokenId: string): Promise<ContractSummary>;
  getDocument(bondId: string, versionId?: string): Promise<AssembledContractDocument>;
  listTemplates(country?: string): Promise<ContractTemplate[]>;
  listVersions(templateId: string): Promise<ContractVersionSummary[]>;
  getVersion(versionId: string): Promise<ContractVersionDetail>;
  diffVersions(from: string, to: string): Promise<ContractVersionDiff>;
  listClauses(category?: string): Promise<ContractClauseLibraryEntry[]>;
}

export function createContractEngineClient(opts: ContractEngineClientOptions): ContractEngineClient {
  return {
    getSummary: (tokenId) => getJson(opts, `/bonds/${encodeURIComponent(tokenId)}/summary`),
    getDocument: (bondId, versionId) =>
      getJson(
        opts,
        `/contracts/${encodeURIComponent(bondId)}/document${versionId ? `?versionId=${encodeURIComponent(versionId)}` : ''}`,
      ),
    listTemplates: (country) => getJson(opts, `/contracts/templates${country ? `?country=${encodeURIComponent(country)}` : ''}`),
    listVersions: (templateId) => getJson(opts, `/contracts/templates/${encodeURIComponent(templateId)}/versions`),
    getVersion: (versionId) => getJson(opts, `/contracts/versions/${encodeURIComponent(versionId)}`),
    diffVersions: (from, to) =>
      getJson(opts, `/contracts/versions/diff?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
    listClauses: (category) => getJson(opts, `/contracts/clauses${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  };
}

// ─── Status / severity presentation ────────────────────────────────────

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

const STATUS_LABELS: Record<ContractStatus, string> = {
  borrador: 'Borrador',
  vigente: 'Vigente',
  en_negociacion: 'En negociación',
  en_escrow: 'En escrow',
  liberado: 'Liberado',
  cancelado: 'Cancelado',
  congelado: 'Congelado',
};

const STATUS_TONES: Record<ContractStatus, Tone> = {
  borrador: 'neutral',
  vigente: 'primary',
  en_negociacion: 'info',
  en_escrow: 'warning',
  liberado: 'success',
  cancelado: 'neutral',
  congelado: 'error',
};

export function statusLabel(status: ContractStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusTone(status: ContractStatus): Tone {
  return STATUS_TONES[status] ?? 'neutral';
}

type AlertTone = 'info' | 'success' | 'warning' | 'error';

const SEVERITY_TONES: Record<ContractAttentionSeverity, AlertTone> = {
  info: 'info',
  warning: 'warning',
  critical: 'error',
};

export function attentionSeverityTone(severity: ContractAttentionSeverity): AlertTone {
  return SEVERITY_TONES[severity] ?? 'info';
}

/** Formats a `ContractAmount`, honoring `unknown` instead of showing "$0". */
export function formatContractAmount(amount: ContractAmount, country?: string | null): string {
  if (amount.unknown || amount.value == null) return 'No disponible';
  return formatMoney(amount.value, country ?? undefined);
}

// ─── Version diff ───────────────────────────────────────────────────────

/** One-line human summary of a structured version diff, e.g. "+1 agregada · -2 eliminadas · 1 modificada". */
export function buildDiffSummary(diff: ContractVersionDiff): string {
  const parts: string[] = [];
  if (diff.added.length) parts.push(`+${diff.added.length} agregada${diff.added.length === 1 ? '' : 's'}`);
  if (diff.removed.length) parts.push(`-${diff.removed.length} eliminada${diff.removed.length === 1 ? '' : 's'}`);
  if (diff.changed.length) parts.push(`${diff.changed.length} modificada${diff.changed.length === 1 ? '' : 's'}`);
  if (parts.length === 0) return 'Sin cambios entre las versiones seleccionadas.';
  return parts.join(' · ');
}

// ─── Document export ────────────────────────────────────────────────────

/** Plain-text export/print version of an assembled document. */
export function buildDocumentExportText(doc: AssembledContractDocument): string {
  const lines: string[] = [doc.title, '='.repeat(doc.title.length), ''];
  for (const section of doc.sections) {
    lines.push(`${section.order}. ${section.title}`);
    lines.push(section.text);
    if (section.missingParameters.length > 0) {
      lines.push(`(Datos pendientes: ${section.missingParameters.join(', ')})`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}
