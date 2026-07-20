import { z } from 'zod';
export declare const bondStatusSchema: z.ZodNativeEnum<{
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
export declare const createBondRequestSchema: z.ZodEffects<z.ZodObject<{
    bondId: z.ZodString;
    issuerPartyId: z.ZodString;
    documentHash: z.ZodString;
    metadataUri: z.ZodOptional<z.ZodString>;
    faceValue: z.ZodOptional<z.ZodNumber>;
    initialOwner: z.ZodOptional<z.ZodString>;
    certificateNumber: z.ZodOptional<z.ZodString>;
    currency: z.ZodOptional<z.ZodString>;
    interestRate: z.ZodOptional<z.ZodNumber>;
    series: z.ZodOptional<z.ZodString>;
    issueDate: z.ZodOptional<z.ZodString>;
    maturityDate: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    bondId: string;
    issuerPartyId: string;
    documentHash: string;
    metadataUri?: string | undefined;
    faceValue?: number | undefined;
    initialOwner?: string | undefined;
    certificateNumber?: string | undefined;
    currency?: string | undefined;
    interestRate?: number | undefined;
    series?: string | undefined;
    issueDate?: string | undefined;
    maturityDate?: string | undefined;
}, {
    bondId: string;
    issuerPartyId: string;
    documentHash: string;
    metadataUri?: string | undefined;
    faceValue?: number | undefined;
    initialOwner?: string | undefined;
    certificateNumber?: string | undefined;
    currency?: string | undefined;
    interestRate?: number | undefined;
    series?: string | undefined;
    issueDate?: string | undefined;
    maturityDate?: string | undefined;
}>, {
    bondId: string;
    issuerPartyId: string;
    documentHash: string;
    metadataUri?: string | undefined;
    faceValue?: number | undefined;
    initialOwner?: string | undefined;
    certificateNumber?: string | undefined;
    currency?: string | undefined;
    interestRate?: number | undefined;
    series?: string | undefined;
    issueDate?: string | undefined;
    maturityDate?: string | undefined;
}, {
    bondId: string;
    issuerPartyId: string;
    documentHash: string;
    metadataUri?: string | undefined;
    faceValue?: number | undefined;
    initialOwner?: string | undefined;
    certificateNumber?: string | undefined;
    currency?: string | undefined;
    interestRate?: number | undefined;
    series?: string | undefined;
    issueDate?: string | undefined;
    maturityDate?: string | undefined;
}>;
export declare const createBondRequestRequestSchema: z.ZodEffects<z.ZodObject<{
    faceValue: z.ZodNumber;
    currency: z.ZodOptional<z.ZodString>;
    interestRate: z.ZodOptional<z.ZodNumber>;
    series: z.ZodOptional<z.ZodString>;
    issueDate: z.ZodOptional<z.ZodString>;
    maturityDate: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    certificateNumber: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    faceValue: number;
    certificateNumber?: string | undefined;
    currency?: string | undefined;
    interestRate?: number | undefined;
    series?: string | undefined;
    issueDate?: string | undefined;
    maturityDate?: string | undefined;
    notes?: string | undefined;
}, {
    faceValue: number;
    certificateNumber?: string | undefined;
    currency?: string | undefined;
    interestRate?: number | undefined;
    series?: string | undefined;
    issueDate?: string | undefined;
    maturityDate?: string | undefined;
    notes?: string | undefined;
}>, {
    faceValue: number;
    certificateNumber?: string | undefined;
    currency?: string | undefined;
    interestRate?: number | undefined;
    series?: string | undefined;
    issueDate?: string | undefined;
    maturityDate?: string | undefined;
    notes?: string | undefined;
}, {
    faceValue: number;
    certificateNumber?: string | undefined;
    currency?: string | undefined;
    interestRate?: number | undefined;
    series?: string | undefined;
    issueDate?: string | undefined;
    maturityDate?: string | undefined;
    notes?: string | undefined;
}>;
export declare const publishBondRequestSchema: z.ZodObject<{
    paymentMethods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
}, "strict", z.ZodTypeAny, {
    paymentMethods?: ("sinpe" | "transferencia" | "wallet")[] | undefined;
}, {
    paymentMethods?: ("sinpe" | "transferencia" | "wallet")[] | undefined;
}>;
export declare const rejectBondRequestSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
export declare const hashDocumentRequestSchema: z.ZodObject<{
    content: z.ZodString;
}, "strict", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>;
export declare const bondRowSchema: z.ZodObject<{
    token_id: z.ZodString;
    bond_id: z.ZodString;
    issuer_party_id: z.ZodString;
    current_owner: z.ZodNullable<z.ZodString>;
    status: z.ZodNativeEnum<{
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
    face_value: z.ZodNullable<z.ZodNumber>;
    certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    currency: z.ZodOptional<z.ZodString>;
    interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    country: z.ZodOptional<z.ZodString>;
    payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
    stellar_status: z.ZodOptional<z.ZodString>;
    stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    token_id: z.ZodString;
    bond_id: z.ZodString;
    issuer_party_id: z.ZodString;
    current_owner: z.ZodNullable<z.ZodString>;
    status: z.ZodNativeEnum<{
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
    face_value: z.ZodNullable<z.ZodNumber>;
    certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    currency: z.ZodOptional<z.ZodString>;
    interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    country: z.ZodOptional<z.ZodString>;
    payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
    stellar_status: z.ZodOptional<z.ZodString>;
    stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    token_id: z.ZodString;
    bond_id: z.ZodString;
    issuer_party_id: z.ZodString;
    current_owner: z.ZodNullable<z.ZodString>;
    status: z.ZodNativeEnum<{
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
    face_value: z.ZodNullable<z.ZodNumber>;
    certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    currency: z.ZodOptional<z.ZodString>;
    interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    country: z.ZodOptional<z.ZodString>;
    payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
    stellar_status: z.ZodOptional<z.ZodString>;
    stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const bondRequestRowSchema: z.ZodObject<{
    id: z.ZodString;
    party_id: z.ZodString;
    requested_by: z.ZodString;
    status: z.ZodEnum<["pendiente", "aprobado", "rechazado"]>;
    face_value: z.ZodNumber;
    currency: z.ZodString;
    interest_rate: z.ZodNullable<z.ZodNumber>;
    issue_date: z.ZodNullable<z.ZodString>;
    maturity_date: z.ZodNullable<z.ZodString>;
    bond_token_id: z.ZodNullable<z.ZodString>;
    rejection_reason: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    party_id: z.ZodString;
    requested_by: z.ZodString;
    status: z.ZodEnum<["pendiente", "aprobado", "rechazado"]>;
    face_value: z.ZodNumber;
    currency: z.ZodString;
    interest_rate: z.ZodNullable<z.ZodNumber>;
    issue_date: z.ZodNullable<z.ZodString>;
    maturity_date: z.ZodNullable<z.ZodString>;
    bond_token_id: z.ZodNullable<z.ZodString>;
    rejection_reason: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    party_id: z.ZodString;
    requested_by: z.ZodString;
    status: z.ZodEnum<["pendiente", "aprobado", "rechazado"]>;
    face_value: z.ZodNumber;
    currency: z.ZodString;
    interest_rate: z.ZodNullable<z.ZodNumber>;
    issue_date: z.ZodNullable<z.ZodString>;
    maturity_date: z.ZodNullable<z.ZodString>;
    bond_token_id: z.ZodNullable<z.ZodString>;
    rejection_reason: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const bondsQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    country: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    country: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    country: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const availableBondsQuerySchema: z.ZodObject<{
    country: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    country: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    country: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const onchainBondResponseSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    enabled: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    enabled: z.ZodBoolean;
}, z.ZodTypeAny, "passthrough">>;
export declare const sorobanBondResponseSchema: z.ZodObject<{
    source: z.ZodEnum<["soroban", "database_snapshot"]>;
    contract_id: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    source: z.ZodEnum<["soroban", "database_snapshot"]>;
    contract_id: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    source: z.ZodEnum<["soroban", "database_snapshot"]>;
    contract_id: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const issueOnchainResponseSchema: z.ZodObject<{
    ok: z.ZodLiteral<true>;
    txHash: z.ZodOptional<z.ZodString>;
    alreadyIssued: z.ZodOptional<z.ZodBoolean>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    ok: z.ZodLiteral<true>;
    txHash: z.ZodOptional<z.ZodString>;
    alreadyIssued: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    ok: z.ZodLiteral<true>;
    txHash: z.ZodOptional<z.ZodString>;
    alreadyIssued: z.ZodOptional<z.ZodBoolean>;
}, z.ZodTypeAny, "passthrough">>;
export declare const documentUploadResponseSchema: z.ZodObject<{
    documentHash: z.ZodString;
    sorobanTxHash: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    documentHash: z.ZodString;
    sorobanTxHash: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    documentHash: z.ZodString;
    sorobanTxHash: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const documentHashResponseSchema: z.ZodObject<{
    hash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    hash: string;
}, {
    hash: string;
}>;
export type CreateBondRequest = z.input<typeof createBondRequestSchema>;
export type BondRequestRequest = z.input<typeof createBondRequestRequestSchema>;
export type BondRow = z.output<typeof bondRowSchema>;
