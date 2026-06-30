/**
 * Estados de una solicitud de transferencia / recompra.
 * Modela el flujo 3 de la especificación (transferencia con escrow).
 */
export const TransferStatus = {
  /** Dueño actual inició la solicitud hacia un recomprador. */
  SOLICITADA: 'solicitada',
  /** Recomprador aceptó la intención de compra. */
  ACEPTADA: 'aceptada',
  CONTRAOFERTA: 'contraoferta',
  /** Token bloqueado en canasta/escrow on-chain. */
  EN_ESCROW: 'en_escrow',
  /** Pago físico registrado, pendiente de validación. */
  PAGO_REGISTRADO: 'pago_registrado',
  /** Validador confirmó el pago; escrow liberable. */
  PAGO_VALIDADO: 'pago_validado',
  /** Token liberado al recomprador; transferencia completa. */
  LIBERADA: 'liberada',
  /** Recomprador o sistema rechazó la transferencia. */
  RECHAZADA: 'rechazada',
  /** Cancelada antes de la validación final; token vuelve al dueño anterior. */
  CANCELADA: 'cancelada',
} as const;

export type TransferStatus = (typeof TransferStatus)[keyof typeof TransferStatus];

export interface Transfer {
  id: string;
  bondTokenId: string;
  fromOwner: string; // profile id del dueño actual
  toOwner: string; // profile id del recomprador
  status: TransferStatus;
  /** Contrato/engagement de escrow en Trustless Work (Stellar). */
  escrowContractId?: string | null;
  /** Hash de la evidencia del pago físico (no el archivo en sí). */
  paymentEvidenceHash?: string | null;
  /** Validador que confirmó el pago. */
  validatedBy?: string | null;
  amount?: number | null;
  counterOfferAmount?: number | null;
  sellerMessage?: string | null;
  buyerMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequestTransferInput {
  bondTokenId: string;
  /** Opcional: el comprador es siempre el usuario autenticado (actorId). */
  toOwner?: string;
  /** Cómo pagará si el vendedor acepta: sinpe | transferencia | wallet. */
  paymentMethod?: 'sinpe' | 'transferencia' | 'wallet';
  /** Monto acordado de la recompra (off-chain). */
  amount?: number;
  message?: string;
  counterOfferAmount?: number;
}

export interface RegisterPaymentInput {
  transferId: string;
  paymentEvidenceHash: string;
}
