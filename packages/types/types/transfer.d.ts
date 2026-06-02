/**
 * Estados de una solicitud de transferencia / recompra.
 * Modela el flujo 3 de la especificación (transferencia con escrow).
 */
export declare const TransferStatus: {
    /** Dueño actual inició la solicitud hacia un recomprador. */
    readonly SOLICITADA: "solicitada";
    /** Recomprador aceptó la intención de compra. */
    readonly ACEPTADA: "aceptada";
    /** Token bloqueado en canasta/escrow on-chain. */
    readonly EN_ESCROW: "en_escrow";
    /** Pago físico registrado, pendiente de validación. */
    readonly PAGO_REGISTRADO: "pago_registrado";
    /** Validador confirmó el pago; escrow liberable. */
    readonly PAGO_VALIDADO: "pago_validado";
    /** Token liberado al recomprador; transferencia completa. */
    readonly LIBERADA: "liberada";
    /** Recomprador o sistema rechazó la transferencia. */
    readonly RECHAZADA: "rechazada";
    /** Cancelada antes de la validación final; token vuelve al dueño anterior. */
    readonly CANCELADA: "cancelada";
};
export type TransferStatus = (typeof TransferStatus)[keyof typeof TransferStatus];
export interface Transfer {
    id: string;
    bondTokenId: string;
    fromOwner: string;
    toOwner: string;
    status: TransferStatus;
    /** Contrato/engagement de escrow en Trustless Work (Stellar). */
    escrowContractId?: string | null;
    /** Hash de la evidencia del pago físico (no el archivo en sí). */
    paymentEvidenceHash?: string | null;
    /** Validador que confirmó el pago. */
    validatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface RequestTransferInput {
    bondTokenId: string;
    toOwner: string;
    /** Monto acordado de la recompra (off-chain). */
    amount?: number;
}
export interface RegisterPaymentInput {
    transferId: string;
    paymentEvidenceHash: string;
}
