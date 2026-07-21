import { z } from 'zod';
export declare const bondStatusSchema: z.ZodEnum<{
    readonly EMITIDO: "emitido";
    readonly PENDIENTE: "pendiente";
    readonly APROBADO: "aprobado";
    readonly ACTIVO: "activo";
    readonly EN_VENTA: "en_venta";
    readonly EN_ESCROW: "en_escrow";
    readonly TRANSFERIDO: "transferido";
    readonly CANCELADO: "cancelado";
    readonly RECHAZADO: "rechazado";
    readonly CONGELADO: "congelado";
}>;
export declare const createBondRequestSchema: z.ZodObject<{
    bondId: z.ZodString;
    issuerPartyId: z.ZodString;
    documentHash: z.ZodString;
    metadataUri: z.ZodOptional<z.ZodString>;
    faceValue: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    initialOwner: z.ZodOptional<z.ZodString>;
    certificateNumber: z.ZodOptional<z.ZodString>;
    currency: z.ZodOptional<z.ZodString>;
    interestRate: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    series: z.ZodOptional<z.ZodString>;
    issueDate: z.ZodOptional<z.ZodString>;
    maturityDate: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const createBondRequestRequestSchema: z.ZodObject<{
    faceValue: z.ZodCoercedNumber<unknown>;
    currency: z.ZodOptional<z.ZodString>;
    interestRate: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    series: z.ZodOptional<z.ZodString>;
    issueDate: z.ZodOptional<z.ZodString>;
    maturityDate: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    certificateNumber: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const publishBondRequestSchema: z.ZodObject<{
    paymentMethods: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        sinpe: "sinpe";
        transferencia: "transferencia";
        wallet: "wallet";
    }>>>;
}, z.core.$strict>;
export declare const rejectBondRequestSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const hashDocumentRequestSchema: z.ZodObject<{
    content: z.ZodString;
}, z.core.$strict>;
export declare const bondRowSchema: z.ZodObject<{
    token_id: z.ZodString;
    bond_id: z.ZodString;
    issuer_party_id: z.ZodString;
    current_owner: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        readonly EMITIDO: "emitido";
        readonly PENDIENTE: "pendiente";
        readonly APROBADO: "aprobado";
        readonly ACTIVO: "activo";
        readonly EN_VENTA: "en_venta";
        readonly EN_ESCROW: "en_escrow";
        readonly TRANSFERIDO: "transferido";
        readonly CANCELADO: "cancelado";
        readonly RECHAZADO: "rechazado";
        readonly CONGELADO: "congelado";
    }>;
    document_hash: z.ZodString;
    metadata_uri: z.ZodNullable<z.ZodString>;
    face_value: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
    certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    currency: z.ZodOptional<z.ZodString>;
    interest_rate: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
    series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    country: z.ZodOptional<z.ZodString>;
    payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        sinpe: "sinpe";
        transferencia: "transferencia";
        wallet: "wallet";
    }>>>;
    stellar_status: z.ZodOptional<z.ZodString>;
    stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
    stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$loose>;
export declare const bondRequestRowSchema: z.ZodObject<{
    id: z.ZodString;
    party_id: z.ZodString;
    requested_by: z.ZodString;
    status: z.ZodEnum<{
        pendiente: "pendiente";
        aprobado: "aprobado";
        rechazado: "rechazado";
    }>;
    face_value: z.ZodCoercedNumber<unknown>;
    currency: z.ZodString;
    interest_rate: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
    issue_date: z.ZodNullable<z.ZodString>;
    maturity_date: z.ZodNullable<z.ZodString>;
    bond_token_id: z.ZodNullable<z.ZodString>;
    rejection_reason: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$loose>;
export declare const bondsQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    country: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const availableBondsQuerySchema: z.ZodObject<{
    country: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const onchainBondResponseSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
}, z.core.$loose>;
export declare const sorobanBondResponseSchema: z.ZodObject<{
    source: z.ZodEnum<{
        soroban: "soroban";
        database_snapshot: "database_snapshot";
    }>;
    contract_id: z.ZodString;
}, z.core.$loose>;
export declare const issueOnchainResponseSchema: z.ZodObject<{
    ok: z.ZodLiteral<true>;
    txHash: z.ZodOptional<z.ZodString>;
    alreadyIssued: z.ZodOptional<z.ZodBoolean>;
}, z.core.$loose>;
export declare const documentUploadResponseSchema: z.ZodObject<{
    documentHash: z.ZodString;
    sorobanTxHash: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const documentHashResponseSchema: z.ZodObject<{
    hash: z.ZodString;
}, z.core.$strip>;
export type CreateBondRequest = z.input<typeof createBondRequestSchema>;
export type BondRequestRequest = z.input<typeof createBondRequestRequestSchema>;
export type BondRow = z.output<typeof bondRowSchema>;
