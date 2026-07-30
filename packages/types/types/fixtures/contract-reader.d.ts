import type { ContractSummary } from '../contract-model';
import type { GlossaryTerm } from '../contract-reader';
/**
 * Development/testing fixtures for the contract reading experience (issue #39).
 *
 * `contractSummaryFixture` stands in for the structured contract that issue #38
 * will produce (see `contract-model.ts`). These are NOT production data — they
 * exist so the derivation, glossary service, and reader UI can be developed and
 * unit-tested locally with no VELAR database, secrets, or external APIs.
 */
export declare const contractSummaryFixture: ContractSummary;
export declare const glossaryFixture: GlossaryTerm[];
