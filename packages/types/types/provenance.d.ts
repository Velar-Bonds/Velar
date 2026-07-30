import type { AuditEvent } from './audit';
import type { BondToken } from './bond';
import type { Transfer, TransferStatus } from './transfer';
/**
 * Provenance & traceability model (issue #36).
 *
 * A `BondProvenance` is the reconstructed, verified history of a bond: the
 * ordered ownership timeline, every transfer's lifecycle, and an integrity
 * report with typed anomaly flags. It is derived by PURE functions from the
 * append-only audit events, transfers and escrow records — the history is never
 * reordered or mutated (see docs/AGENTS.md §4).
 */
/** Categories of provenance integrity anomaly. */
export declare const ProvenanceAnomalyType: {
    /** Events/transfers are not in chronological order. */
    readonly OUT_OF_ORDER: "out_of_order";
    /** An owner's end does not match the next owner's start (a gap in the chain). */
    readonly OWNERSHIP_GAP: "ownership_gap";
    /** A transfer moved between states that the state machine does not allow. */
    readonly ILLEGAL_TRANSITION: "illegal_transition";
    /** On-chain reference (tx hash / owner) disagrees with the off-chain record. */
    readonly ONCHAIN_OFFCHAIN_MISMATCH: "onchain_offchain_mismatch";
    /** A lifecycle stage is reached with no supporting audit event. */
    readonly MISSING_EVENT: "missing_event";
};
export type ProvenanceAnomalyType = (typeof ProvenanceAnomalyType)[keyof typeof ProvenanceAnomalyType];
export type ProvenanceSeverity = 'info' | 'warning' | 'error';
/** A single detected integrity problem, linked to the record that caused it. */
export interface ProvenanceAnomaly {
    type: ProvenanceAnomalyType;
    severity: ProvenanceSeverity;
    /** Human-readable (Spanish) description. */
    message: string;
    transferId?: string | null;
    eventId?: string | null;
    ownerId?: string | null;
    /** ISO-8601 timestamp where the anomaly occurs, when applicable. */
    at?: string | null;
}
/** The result of running every integrity check over a reconstruction. */
export interface IntegrityReport {
    /** True when there are no `error`-severity anomalies. */
    ok: boolean;
    anomalies: ProvenanceAnomaly[];
    /** ISO-8601 timestamp of when the checks ran. */
    checkedAt: string;
}
/** One continuous period during which a single party owned the bond. */
export interface OwnershipSegment {
    ownerId: string;
    /** ISO-8601 start of ownership. */
    from: string;
    /** ISO-8601 end of ownership, or null for the current owner. */
    to: string | null;
    current: boolean;
    /** Transfer that handed ownership to this owner (null for the initial owner). */
    viaTransferId: string | null;
    /** Audit event that established this owner (e.g. bond_emitido / token_liberado). */
    viaEventId: string | null;
}
/** Ordered happy-path steps of a transfer, used by the lifecycle stepper. */
export declare const TRANSFER_LIFECYCLE_STEPS: readonly ["solicitada", "aceptada", "en_escrow", "pago_registrado", "pago_validado", "liberada"];
export type TransferLifecycleStep = (typeof TRANSFER_LIFECYCLE_STEPS)[number];
/** Terminal transfer states that end the flow. */
export declare const TERMINAL_TRANSFER_STATUSES: readonly ["liberada", "rechazada", "cancelada"];
/** A stage the transfer actually reached, timestamped from its audit event. */
export interface TransferLifecycleStage {
    status: TransferStatus;
    /** ISO-8601 time the stage was reached (null if no supporting event). */
    at: string | null;
    eventId: string | null;
}
/** A transfer's reconstructed lifecycle for the stepper UI. */
export interface TransferLifecycle {
    transferId: string;
    fromOwner: string;
    toOwner: string;
    /** Current transfer status. */
    status: TransferStatus;
    /** Index into TRANSFER_LIFECYCLE_STEPS for the current step, or -1 if terminal/off-path. */
    currentStepIndex: number;
    /** True when the transfer is in a terminal state. */
    terminal: boolean;
    /** Ordered history of stages actually reached. */
    stages: TransferLifecycleStage[];
}
/** The full reconstructed, verified provenance record for a bond. */
export interface BondProvenance {
    bond: BondToken;
    /** Chronological ownership timeline. */
    ownership: OwnershipSegment[];
    /** Per-transfer lifecycles. */
    transfers: TransferLifecycle[];
    /** The append-only audit events, in order (never reordered/mutated). */
    events: AuditEvent[];
    integrity: IntegrityReport;
    /** ISO-8601 timestamp of when the record was reconstructed. */
    reconstructedAt: string;
}
/**
 * Raw inputs the reconstruction engine consumes. Sourced from Supabase in
 * production (mocked in tests); shaped here so fixtures and the pure engine
 * share one contract.
 */
export interface ProvenanceInput {
    bond: BondToken;
    events: AuditEvent[];
    transfers: Transfer[];
}
