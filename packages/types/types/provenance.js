"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TERMINAL_TRANSFER_STATUSES = exports.TRANSFER_LIFECYCLE_STEPS = exports.ProvenanceAnomalyType = void 0;
/**
 * Provenance & traceability model (issue #36).
 *
 * A `BondProvenance` is the reconstructed, verified history of a bond: the
 * ordered ownership timeline, every transfer's lifecycle, and an integrity
 * report with typed anomaly flags. It is derived by PURE functions from the
 * append-only audit events, transfers and escrow records — the history is never
 * reordered or mutated (see docs/AGENTS.md §4).
 */
// ─── Anomalies / integrity ────────────────────────────────────────────────────
/** Categories of provenance integrity anomaly. */
exports.ProvenanceAnomalyType = {
    /** Events/transfers are not in chronological order. */
    OUT_OF_ORDER: 'out_of_order',
    /** An owner's end does not match the next owner's start (a gap in the chain). */
    OWNERSHIP_GAP: 'ownership_gap',
    /** A transfer moved between states that the state machine does not allow. */
    ILLEGAL_TRANSITION: 'illegal_transition',
    /** On-chain reference (tx hash / owner) disagrees with the off-chain record. */
    ONCHAIN_OFFCHAIN_MISMATCH: 'onchain_offchain_mismatch',
    /** A lifecycle stage is reached with no supporting audit event. */
    MISSING_EVENT: 'missing_event',
};
// ─── Transfer lifecycle (stepper) ─────────────────────────────────────────────
/** Ordered happy-path steps of a transfer, used by the lifecycle stepper. */
exports.TRANSFER_LIFECYCLE_STEPS = [
    'solicitada',
    'aceptada',
    'en_escrow',
    'pago_registrado',
    'pago_validado',
    'liberada',
];
/** Terminal transfer states that end the flow. */
exports.TERMINAL_TRANSFER_STATUSES = ['liberada', 'rechazada', 'cancelada'];
