"use strict";
/**
 * PROVISIONAL structured-contract model.
 *
 * The canonical structured-contract/clause model is owned by the
 * "Contract intelligence & document assembly engine" epic (issue #38), which is
 * not merged yet. The contract reading & comprehension experience (issue #39) is
 * built against a FIXTURE of this shape, per that issue's instructions.
 *
 * When #38 lands, replace these types with the canonical ones and re-point the
 * reader/derivation at them. Keep the field names stable in the meantime so the
 * swap is mechanical.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClauseCategory = void 0;
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
