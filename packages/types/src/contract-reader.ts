import type { ClauseCategory } from './contract-model';

/**
 * Types for the contract reading & comprehension experience (issue #39):
 * plain-language derivation output, glossary, and the typed reader response.
 *
 * These are owned by #39. They consume the (provisional) structured-contract
 * model in `contract-model.ts`.
 */

/** i18n locale for glossary and reader content. */
export type ReaderLocale = 'es' | 'en';

/** A glossary entry: a term and its plain-language definition. */
export interface GlossaryTerm {
  id: string;
  term: string;
  /** Plain-language definition (no invented legal meaning). */
  definition: string;
  locale: ReaderLocale;
  /** Alternate spellings/synonyms that should also match this term. */
  aliases?: string[];
}

/** A key term found within a clause, linked to a glossary entry for inline tooltips. */
export interface ClauseKeyTerm {
  /** The surface form as it appears in the clause. */
  term: string;
  /** Links to `GlossaryTerm.id`. */
  glossaryId: string;
}

/** A clause presented in plain language alongside its original legal text. */
export interface PlainLanguageClause {
  clauseId: string;
  order: number;
  title: string;
  category: ClauseCategory;
  /** Original legal text, kept for the summary ⇄ full-document toggle/compare. */
  legalText: string;
  /** Plain-language explanation derived from the real clause data. */
  plainLanguage: string;
  /** Key terms in this clause, linked to the glossary. */
  keyTerms: ClauseKeyTerm[];
  /**
   * True when no reliable plain-language derivation exists for this clause. The
   * reader shows a neutral "no simplified explanation available" state; legal
   * meaning is never invented.
   */
  unknown: boolean;
  /** Stable anchor for deep-linking to this clause. */
  anchor: string;
}

/** The typed response backing the contract reader UI. */
export interface ContractReaderResponse {
  bondId: string;
  contractId: string;
  title: string;
  version: string;
  /** Plain-language summary of the whole contract, shown up front. */
  summary: string;
  clauses: PlainLanguageClause[];
  /** Glossary entries referenced by the clauses' key terms. */
  glossary: GlossaryTerm[];
  locale: ReaderLocale;
  generatedAt: string;
}
