/**
 * Eventos de auditoría inmutables (append-only).
 * Cada acción crítica genera un evento consultable por el TSE.
 */
export const AuditEventType = {
  BOND_EMITIDO: 'bond_emitido',
  BOND_ASIGNADO: 'bond_asignado',
  TRANSFER_SOLICITADA: 'transfer_solicitada',
  TRANSFER_ACEPTADA: 'transfer_aceptada',
  ESCROW_BLOQUEADO: 'escrow_bloqueado',
  PAGO_REGISTRADO: 'pago_registrado',
  PAGO_VALIDADO: 'pago_validado',
  TOKEN_LIBERADO: 'token_liberado',
  TRANSFER_RECHAZADA: 'transfer_rechazada',
  TRANSFER_CANCELADA: 'transfer_cancelada',
  BOND_CONGELADO: 'bond_congelado',
  BOND_DESCONGELADO: 'bond_descongelado',
  BOND_CANCELADO: 'bond_cancelado',
  DOCUMENTO_SUBIDO: 'documento_subido',
  PARTY_CREATED: 'party_created',
  WALLET_PROVISIONED: 'wallet_provisioned',
  BOND_PUBLISHED: 'bond_published',
  COUNTER_OFFER_SENT: 'counter_offer_sent',
} as const;

export type AuditEventType =
  (typeof AuditEventType)[keyof typeof AuditEventType];

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
