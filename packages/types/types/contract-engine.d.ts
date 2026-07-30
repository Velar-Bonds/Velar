import type { ClauseCategory } from './contract-model';
import type { CountryCode } from './country';
import type { BondToken } from './bond';
import type { Transfer } from './transfer';
/**
 * Contract template/version/clause-library model + document assembly and
 * version diffing types for the "Contract intelligence & document assembly
 * engine" (issue #38). Persisted via `contract_clauses`, `contract_templates`,
 * `contract_versions` (see `supabase/migrations/20260729000000_contract_engine.sql`).
 */
/** A reusable clause in the clause library. `bodyTemplate` contains `{{parameter}}` tokens. */
export interface ContractClauseLibraryEntry {
    id: string;
    clauseKey: string;
    category: ClauseCategory;
    title: string;
    bodyTemplate: string;
    /** Declared parameter names referenced by `bodyTemplate`. */
    parameters: string[];
    locale: string;
    createdAt: string;
    updatedAt: string;
}
/** A contract type scoped to one jurisdiction (e.g. "bond transfer — Costa Rica"). */
export interface ContractTemplate {
    id: string;
    key: string;
    country: CountryCode;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
}
export type ContractVersionStatus = 'draft' | 'published' | 'archived';
/** A revision of a template: an ordered list of clause keys. */
export interface ContractVersionSummary {
    id: string;
    templateId: string;
    versionNumber: number;
    status: ContractVersionStatus;
    clauseKeys: string[];
    notes?: string | null;
    createdBy?: string | null;
    createdAt: string;
    publishedAt?: string | null;
}
/** A version with its clauses resolved (in `clauseKeys` order). */
export interface ContractVersionDetail extends ContractVersionSummary {
    clauses: ContractClauseLibraryEntry[];
}
export interface ClauseDiffEntry {
    clauseKey: string;
    title: string;
    order: number;
}
export interface ClauseDiffChangedEntry {
    clauseKey: string;
    title: string;
    fromOrder: number;
    toOrder: number;
    /** True when the resolved clause body differs between the two versions. */
    bodyChanged: boolean;
}
/** Structured diff between two contract versions of the same template. */
export interface ContractVersionDiff {
    fromVersionId: string;
    toVersionId: string;
    added: ClauseDiffEntry[];
    removed: ClauseDiffEntry[];
    changed: ClauseDiffChangedEntry[];
    unchanged: ClauseDiffEntry[];
}
/** One rendered clause within an assembled document. */
export interface AssembledDocumentSection {
    clauseKey: string;
    order: number;
    title: string;
    category: ClauseCategory;
    /** Resolved text, with `{{parameter}}` tokens substituted. */
    text: string;
    /** Parameters referenced by this clause with no resolved value. Never fabricated. */
    missingParameters: string[];
}
/** The full legal document assembled deterministically from a version + bond data. */
export interface AssembledContractDocument {
    bondId: string;
    templateId: string;
    versionId: string;
    versionNumber: number;
    title: string;
    sections: AssembledDocumentSection[];
    fullText: string;
    generatedAt: string;
}
/** Input to the pure `deriveContractSummary` function. */
export interface ContractSummaryInput {
    bond: BondToken;
    /** All transfers for this bond, any order — the function sorts them. */
    transfers: Transfer[];
    template: ContractTemplate;
    version: ContractVersionDetail;
    /** Resolved parameter values (party names, amounts, etc.) for rendering `clauses[].legalText`. */
    params: Record<string, string>;
    /** Injected "now" (ISO-8601) so derivation (e.g. attention flags) is deterministic/testable. */
    now: string;
}
/** Input to the pure `assembleContractDocument` function. */
export interface AssembleDocumentInput {
    bond: BondToken;
    version: ContractVersionDetail;
    /** Resolved parameter values (party names, amounts, etc.) — gathered by the service, not the pure function. */
    params: Record<string, string>;
    now: string;
}
