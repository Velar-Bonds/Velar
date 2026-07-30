import type { CountryCode } from './country';

/**
 * Canonical structured-contract model (issue #38: "Contract intelligence &
 * document assembly engine").
 *
 * `ContractClause` and the original five `ContractSummary` fields
 * (`bondId, contractId, title, version, clauses, generatedAt`) are unchanged
 * from the provisional shape issue #39 (the contract reading & comprehension
 * experience) was built against — that reader keeps working without changes.
 * Everything else on `ContractSummary` below is additive: the rich summary
 * (amount, conditions, obligations, key dates, status, attention flags) this
 * epic derives from real bond/transfer data via pure functions in
 * `apps/api/src/contracts/domain/`.
 */

/** Domain category of a contract clause. */
export const ClauseCategory = {
  PARTES: 'partes',
  OBJETO: 'objeto',
  PAGO: 'pago',
  TRANSFERENCIA: 'transferencia',
  GARANTIA: 'garantia',
  PLAZO: 'plazo',
  INCUMPLIMIENTO: 'incumplimiento',
  JURISDICCION: 'jurisdiccion',
  FIRMAS: 'firmas',
  OTRO: 'otro',
} as const;

export type ClauseCategory = (typeof ClauseCategory)[keyof typeof ClauseCategory];

/** A single structured clause of a contract. */
export interface ContractClause {
  id: string;
  /** 1-based position within the contract. */
  order: number;
  title: string;
  category: ClauseCategory;
  /** Original legal text of the clause. Source of truth — never rewritten in place. */
  legalText: string;
  /** Keys of structured contract/bond fields this clause references (data anchors). */
  references?: string[];
}

/**
 * Semantic party role within a contract, independent of the system `Role`
 * enum: "vendedor" may be `emisor`, `comprador`, or `recomprador` depending on
 * lifecycle stage. Kept separate so summary derivation stays a pure function
 * (no profile lookups needed to know "who is selling").
 */
export type ContractPartyRole = 'tse' | 'vendedor' | 'comprador';

/** A monetary amount derived from bond/transfer data. Never fabricated. */
export interface ContractAmount {
  value: number | null;
  currency: string | null;
  /** True when neither the active transfer amount nor the bond face value is on file. */
  unknown: boolean;
}

/** A condition of the contract, always traced back to the clause it came from. */
export interface ContractCondition {
  id: string;
  description: string;
  sourceClauseId: string;
}

/** An obligation/responsibility of one party, traced back to its source clause. */
export interface ContractObligation {
  id: string;
  role: ContractPartyRole;
  description: string;
  sourceClauseId: string;
}

/** Kind of key date surfaced in the summary. */
export type ContractKeyDateKind =
  | 'issue_date'
  | 'maturity_date'
  | 'transfer_requested'
  | 'transfer_last_update'
  | 'released'
  | 'version_published';

/** A date relevant to the contract's lifecycle. `unknown: true` when the source field is null. */
export interface ContractKeyDate {
  id: string;
  kind: ContractKeyDateKind;
  label: string;
  date: string | null;
  unknown: boolean;
}

/**
 * Current status of the contract, derived purely from `BondStatus` +
 * the latest `TransferStatus` per the state machine in `docs/AGENTS.md` §4.
 */
export const ContractStatus = {
  BORRADOR: 'borrador',
  VIGENTE: 'vigente',
  EN_NEGOCIACION: 'en_negociacion',
  EN_ESCROW: 'en_escrow',
  LIBERADO: 'liberado',
  CANCELADO: 'cancelado',
  CONGELADO: 'congelado',
} as const;

export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];

/** Severity of an attention/risk flag. */
export type ContractAttentionSeverity = 'info' | 'warning' | 'critical';

/** An attention/risk flag raised by a deterministic rule (e.g. an approaching deadline). */
export interface ContractAttentionFlag {
  id: string;
  severity: ContractAttentionSeverity;
  /** Stable machine-readable kind, e.g. 'approaching_maturity', 'stalled_escrow'. */
  kind: string;
  message: string;
  sourceClauseId?: string;
}

/** The assembled structured contract for a bond. */
export interface ContractSummary {
  bondId: string;
  contractId: string;
  title: string;
  /** Contract template/version identifier. */
  version: string;
  clauses: ContractClause[];
  /** ISO-8601 timestamp when the structured contract was assembled. */
  generatedAt: string;

  /** Jurisdiction the applicable template belongs to. */
  country: CountryCode;
  amount: ContractAmount;
  conditions: ContractCondition[];
  obligations: ContractObligation[];
  keyDates: ContractKeyDate[];
  status: ContractStatus;
  attentionFlags: ContractAttentionFlag[];
}
