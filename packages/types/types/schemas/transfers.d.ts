import { z } from 'zod';
export declare const transferStatusSchema: z.ZodEnum<{
    readonly SOLICITADA: "solicitada";
    readonly ACEPTADA: "aceptada";
    readonly CONTRAOFERTA: "contraoferta";
    readonly EN_ESCROW: "en_escrow";
    readonly PAGO_REGISTRADO: "pago_registrado";
    readonly PAGO_VALIDADO: "pago_validado";
    readonly LIBERADA: "liberada";
    readonly RECHAZADA: "rechazada";
    readonly CANCELADA: "cancelada";
}>;
export declare const createTransferRequestSchema: z.ZodObject<{
    bondTokenId: z.ZodString;
    toOwner: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodOptional<z.ZodEnum<{
        sinpe: "sinpe";
        transferencia: "transferencia";
        wallet: "wallet";
    }>>;
    amount: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    message: z.ZodOptional<z.ZodString>;
    counterOfferAmount: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strict>;
export declare const counterOfferRequestSchema: z.ZodObject<{
    amount: z.ZodCoercedNumber<unknown>;
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const registerPaymentRequestSchema: z.ZodObject<{
    evidence: z.ZodOptional<z.ZodString>;
    evidenceContent: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const submitXdrRequestSchema: z.ZodObject<{
    signedXdr: z.ZodString;
}, z.core.$strict>;
export declare const requestReturnRequestSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const returnDecisionRequestSchema: z.ZodObject<{
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const transferRowSchema: z.ZodObject<{
    id: z.ZodString;
    bond_token_id: z.ZodString;
    from_owner: z.ZodString;
    to_owner: z.ZodString;
    status: z.ZodEnum<{
        readonly SOLICITADA: "solicitada";
        readonly ACEPTADA: "aceptada";
        readonly CONTRAOFERTA: "contraoferta";
        readonly EN_ESCROW: "en_escrow";
        readonly PAGO_REGISTRADO: "pago_registrado";
        readonly PAGO_VALIDADO: "pago_validado";
        readonly LIBERADA: "liberada";
        readonly RECHAZADA: "rechazada";
        readonly CANCELADA: "cancelada";
    }>;
    escrow_contract_id: z.ZodNullable<z.ZodString>;
    payment_evidence_hash: z.ZodNullable<z.ZodString>;
    validated_by: z.ZodNullable<z.ZodString>;
    amount: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
    counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
    seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$loose>;
export declare const xdrResponseSchema: z.ZodObject<{
    xdr: z.ZodString;
    networkPassphrase: z.ZodString;
}, z.core.$loose>;
export declare const transactionResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    txHash: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const releaseResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    newOwner: z.ZodString;
}, z.core.$loose>;
export type CreateTransferRequest = z.input<typeof createTransferRequestSchema>;
export type TransferRow = z.output<typeof transferRowSchema>;
