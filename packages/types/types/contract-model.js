"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractStatus = exports.ClauseCategory = void 0;
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
exports.ClauseCategory = {
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
};
/**
 * Current status of the contract, derived purely from `BondStatus` +
 * the latest `TransferStatus` per the state machine in `docs/AGENTS.md` §4.
 */
exports.ContractStatus = {
    BORRADOR: 'borrador',
    VIGENTE: 'vigente',
    EN_NEGOCIACION: 'en_negociacion',
    EN_ESCROW: 'en_escrow',
    LIBERADO: 'liberado',
    CANCELADO: 'cancelado',
    CONGELADO: 'congelado',
};
