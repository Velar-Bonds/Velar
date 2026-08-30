/**
 * Eventos de auditoría inmutables (append-only).
 * Cada acción crítica genera un evento consultable por el TSE.
 */
export declare const AuditEventType: {
    readonly BOND_EMITIDO: "bond_emitido";
    readonly BOND_ASIGNADO: "bond_asignado";
    readonly TRANSFER_SOLICITADA: "transfer_solicitada";
    readonly TRANSFER_ACEPTADA: "transfer_aceptada";
    readonly ESCROW_BLOQUEADO: "escrow_bloqueado";
    readonly PAGO_REGISTRADO: "pago_registrado";
    readonly PAGO_VALIDADO: "pago_validado";
    readonly TOKEN_LIBERADO: "token_liberado";
    readonly TRANSFER_RECHAZADA: "transfer_rechazada";
    readonly TRANSFER_CANCELADA: "transfer_cancelada";
    readonly BOND_CONGELADO: "bond_congelado";
    readonly BOND_DESCONGELADO: "bond_descongelado";
    readonly BOND_CANCELADO: "bond_cancelado";
    readonly DOCUMENTO_SUBIDO: "documento_subido";
    readonly PARTY_CREATED: "party_created";
    readonly WALLET_PROVISIONED: "wallet_provisioned";
    readonly BOND_PUBLISHED: "bond_published";
    readonly COUNTER_OFFER_SENT: "counter_offer_sent";
    readonly REPORT_SUBMITTED: "report_submitted";
    readonly REPORT_RESUBMITTED: "report_resubmitted";
    readonly REPORT_VERSION_CREATED: "report_version_created";
    readonly REPORT_OBSERVED: "report_observed";
    readonly REPORT_APPROVED: "report_approved";
    readonly REPORT_FILE_UPLOADED: "report_file_uploaded";
    readonly REPORT_REJECTED: "report_rejected";
    readonly REPORT_ASSIGNED: "report_assigned";
    readonly REPORT_PENDING_SECOND_APPROVAL: "report_pending_second_approval";
    readonly REPORT_SECOND_APPROVED: "report_second_approved";
    readonly REPORT_SLA_ESCALATED: "report_sla_escalated";
    readonly REPORT_EXPORTED: "report_exported";
    readonly REPORT_MARKED_REVIEWED: "report_marked_reviewed";
    readonly AUTH_PASSWORD_RESET_REQUESTED: "auth_password_reset_requested";
    readonly AUTH_PASSWORD_RESET_COMPLETED: "auth_password_reset_completed";
    readonly AUTH_EMAIL_CHANGE_REQUESTED: "auth_email_change_requested";
    readonly AUTH_ACCOUNT_DEACTIVATED: "auth_account_deactivated";
    readonly AUTH_ACCOUNT_REACTIVATED: "auth_account_reactivated";
    readonly WALLET_RETRY_REQUESTED: "wallet_retry_requested";
    readonly USER_ROLE_CHANGED: "user_role_changed";
};
export type AuditEventType = (typeof AuditEventType)[keyof typeof AuditEventType];
export interface AuditEvent {
    id: string;
    bondTokenId: string | null;
    transferId: string | null;
    type: AuditEventType;
    /** Profile id del actor que originó el evento. */
    actorId: string | null;
    /** Datos arbitrarios del evento (estados previos, montos, etc.). */
    payload: Record<string, unknown>;
    /** Hash de la transacción Stellar si aplica. */
    txHash?: string | null;
    createdAt: string;
}
/** Línea de tiempo completa de un bono para auditoría del TSE. */
export interface BondTimeline {
    bond: import('./bond').BondToken;
    /** Cadena de propietarios en orden cronológico. */
    ownershipChain: Array<{
        ownerId: string;
        from: string;
        to: string | null;
        transferId: string | null;
    }>;
    events: AuditEvent[];
}
/** Una entrada en la cadena de propietarios derivada cronológicamente. */
export interface OwnerEntry {
    ownerId: string;
    name: string;
    since: string;
    until: string | null;
    paid: boolean;
    current: boolean;
}
/** Respuesta consolidada del endpoint de trazabilidad. */
export interface TraceabilityResponse {
    bond: import('./bond').BondToken;
    events: AuditEvent[];
    transfers: import('./transfer').Transfer[];
    owners: OwnerEntry[];
}
/** Un evento de auditoría con sus campos de cadena de hashes poblados. */
export interface ChainedAuditEvent extends AuditEvent {
    chainSeq: number | null;
    prevHash: string | null;
    hash: string | null;
}
/** Un problema detectado al verificar la cadena de auditoría. */
export interface ChainIntegrityIssue {
    type: 'hash_mismatch' | 'gap' | 'broken_link';
    chainSeq: number | null;
    message: string;
}
/** Resultado de verificar la integridad de la cadena de auditoría. */
export interface ChainVerificationResult {
    valid: boolean;
    checkedCount: number;
    issues: ChainIntegrityIssue[];
}
