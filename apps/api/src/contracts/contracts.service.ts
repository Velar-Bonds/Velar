import { Injectable } from '@nestjs/common';
import {
  contractSummaryFixture,
  type ContractReaderResponse,
  type ContractSummary,
  type GlossaryTerm,
  type ReaderLocale,
} from '@velar/types';
import { SupabaseService } from '../common/supabase/supabase.service';
import { buildContractReaderResponse } from './plain-language';

interface GlossaryRow {
  id: string;
  term: string;
  definition: string;
  locale: string;
  aliases: string[] | null;
}

/**
 * Backend service for the contract reading & comprehension experience (#39).
 * Reads the glossary via Supabase (mocked in tests) and derives the typed reader
 * response using the pure functions in `plain-language.ts`.
 */
@Injectable()
export class ContractsService {
  constructor(private readonly supabase: SupabaseService) {}

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

  /**
   * Source of the structured contract for a bond.
   *
   * The canonical structured-contract model + storage is owned by the "Contract
   * intelligence & document assembly" epic (#38), which is not merged yet. Until
   * then this returns the shared fixture shape with the requested `bondId`, so
   * the reader endpoint is exercisable end-to-end with no VELAR database, secrets
   * or external APIs.
   *
   * @todo Replace with the real structured-contract source when #38 lands.
   */
  private async getContractSummary(bondId: string): Promise<ContractSummary> {
    return { ...contractSummaryFixture, bondId };
  }
}
