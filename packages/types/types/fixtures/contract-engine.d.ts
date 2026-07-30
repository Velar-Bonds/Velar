import type { BondToken } from '../bond';
import type { Transfer } from '../transfer';
import type { ContractClauseLibraryEntry, ContractTemplate, ContractVersionDetail } from '../contract-engine';
/**
 * Development/testing fixtures for the contract intelligence & document
 * assembly engine (issue #38). Used by the pure-function tests in
 * `apps/api/src/contracts/domain/` and by the frontend management UI so
 * everything is verifiable locally with no VELAR database, secrets, or
 * external APIs. The clause legal text mirrors `contractSummaryFixture`
 * (`./contract-reader.ts`, issue #39) so the reader's existing behavior
 * doesn't change when it starts consuming real derivation.
 */
export declare const contractClauseLibraryFixture: ContractClauseLibraryEntry[];
export declare const contractTemplateFixture: ContractTemplate;
export declare const contractVersionFixture: ContractVersionDetail;
/** A second, later version — drops "garantia", tweaks "pago", adds "plazo". Used by diff tests. */
export declare const contractVersionFixtureV2: ContractVersionDetail;
export declare const bondFixture: BondToken;
export declare const transferFixtureReleased: Transfer;
export declare const transfersFixture: Transfer[];
