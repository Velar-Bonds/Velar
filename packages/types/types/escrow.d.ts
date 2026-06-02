/**
 * Tipos para la integración con Trustless Work (escrow sobre Stellar).
 * Mapea el ciclo lock -> fund -> approve -> release del escrow.
 */
export declare const EscrowStatus: {
    readonly INITIALIZED: "initialized";
    readonly FUNDED: "funded";
    readonly APPROVED: "approved";
    readonly RELEASED: "released";
    readonly REFUNDED: "refunded";
    readonly DISPUTED: "disputed";
};
export type EscrowStatus = (typeof EscrowStatus)[keyof typeof EscrowStatus];
export interface EscrowMilestone {
    description: string;
    status?: string;
}
/** Resultado de operaciones de escrow que devuelven un XDR para firmar. */
export interface EscrowUnsignedTx {
    /** Transacción Stellar sin firmar (base64 XDR). */
    unsignedTransaction: string;
    /** Identificador del contrato/engagement si ya existe. */
    contractId?: string;
}
export interface InitEscrowParams {
    transferId: string;
    bondTokenId: string;
    /** Stellar address del dueño actual (vendedor). */
    seller: string;
    /** Stellar address del recomprador (comprador). */
    buyer: string;
    /** Stellar address del validador/aprobador del pago. */
    approver: string;
    amount: number;
    title: string;
}
