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
