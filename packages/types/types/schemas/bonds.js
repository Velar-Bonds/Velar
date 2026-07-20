"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentHashResponseSchema = exports.documentUploadResponseSchema = exports.issueOnchainResponseSchema = exports.sorobanBondResponseSchema = exports.onchainBondResponseSchema = exports.availableBondsQuerySchema = exports.bondsQuerySchema = exports.bondRequestRowSchema = exports.bondRowSchema = exports.hashDocumentRequestSchema = exports.rejectBondRequestSchema = exports.publishBondRequestSchema = exports.createBondRequestRequestSchema = exports.createBondRequestSchema = exports.bondStatusSchema = void 0;
const zod_1 = require("zod");
const bond_1 = require("../bond");
const common_1 = require("./common");
exports.bondStatusSchema = zod_1.z.nativeEnum(bond_1.BondStatus);
exports.createBondRequestSchema = zod_1.z.object({
    bondId: common_1.requiredStringSchema,
    issuerPartyId: common_1.idSchema,
    documentHash: common_1.requiredStringSchema,
    metadataUri: zod_1.z.string().url('validation.url').optional(),
    faceValue: common_1.positiveNumberSchema.optional(),
    initialOwner: common_1.idSchema.optional(),
    certificateNumber: zod_1.z.string().trim().optional(),
    currency: zod_1.z.string().trim().min(3, 'validation.required').max(3).optional(),
    interestRate: zod_1.z.coerce.number().finite().min(0).max(100).optional(),
    series: zod_1.z.string().trim().optional(),
    issueDate: common_1.optionalIsoDateSchema,
    maturityDate: common_1.optionalIsoDateSchema,
}).strict().refine((value) => !value.issueDate || !value.maturityDate || value.maturityDate >= value.issueDate, { path: ['maturityDate'], message: 'validation.date' });
exports.createBondRequestRequestSchema = zod_1.z.object({
    faceValue: common_1.positiveNumberSchema,
    currency: zod_1.z.string().trim().min(3).max(3).optional(),
    interestRate: zod_1.z.coerce.number().finite().min(0).max(100).optional(),
    series: zod_1.z.string().trim().optional(),
    issueDate: common_1.optionalIsoDateSchema,
    maturityDate: common_1.optionalIsoDateSchema,
    notes: zod_1.z.string().trim().max(2000).optional(),
    certificateNumber: zod_1.z.string().trim().optional(),
}).strict().refine((value) => !value.issueDate || !value.maturityDate || value.maturityDate >= value.issueDate, { path: ['maturityDate'], message: 'validation.date' });
exports.publishBondRequestSchema = zod_1.z.object({
    paymentMethods: zod_1.z.array(common_1.paymentMethodSchema).min(1).optional(),
}).strict();
exports.rejectBondRequestSchema = zod_1.z.object({ reason: zod_1.z.string().trim().max(1000).optional() }).strict();
exports.hashDocumentRequestSchema = zod_1.z.object({ content: common_1.requiredStringSchema }).strict();
exports.bondRowSchema = zod_1.z.object({
    token_id: common_1.idSchema,
    bond_id: common_1.requiredStringSchema,
    issuer_party_id: common_1.idSchema,
    current_owner: common_1.idSchema.nullable(),
    status: exports.bondStatusSchema,
    document_hash: common_1.requiredStringSchema,
    metadata_uri: zod_1.z.string().nullable(),
    face_value: zod_1.z.coerce.number().nullable(),
    certificate_number: zod_1.z.string().nullable().optional(),
    currency: zod_1.z.string().min(3).max(3).optional(),
    interest_rate: zod_1.z.coerce.number().nullable().optional(),
    series: zod_1.z.string().nullable().optional(),
    issue_date: common_1.isoDateSchema.nullable().optional(),
    maturity_date: common_1.isoDateSchema.nullable().optional(),
    country: zod_1.z.string().min(2).max(2).optional(),
    payment_methods: zod_1.z.array(common_1.paymentMethodSchema).optional(),
    stellar_status: zod_1.z.string().optional(),
    stellar_transaction_hash: zod_1.z.string().nullable().optional(),
    stellar_ledger: zod_1.z.coerce.number().nullable().optional(),
    stellar_asset_code: zod_1.z.string().nullable().optional(),
    stellar_issuer_public_key: zod_1.z.string().nullable().optional(),
    stellar_owner_public_key: zod_1.z.string().nullable().optional(),
    stellar_registered_at: zod_1.z.string().nullable().optional(),
    stellar_error: zod_1.z.string().nullable().optional(),
    created_at: common_1.requiredStringSchema,
    updated_at: common_1.requiredStringSchema,
}).passthrough();
exports.bondRequestRowSchema = zod_1.z.object({
    id: common_1.idSchema,
    party_id: common_1.idSchema,
    requested_by: common_1.idSchema,
    status: zod_1.z.enum(['pendiente', 'aprobado', 'rechazado']),
    face_value: zod_1.z.coerce.number(),
    currency: zod_1.z.string().min(3).max(3),
    interest_rate: zod_1.z.coerce.number().nullable(),
    issue_date: common_1.isoDateSchema.nullable(),
    maturity_date: common_1.isoDateSchema.nullable(),
    bond_token_id: common_1.idSchema.nullable(),
    rejection_reason: zod_1.z.string().nullable(),
    created_at: common_1.requiredStringSchema,
    updated_at: common_1.requiredStringSchema,
}).passthrough();
exports.bondsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    country: zod_1.z.string().trim().min(2).max(2).optional(),
}).passthrough();
exports.availableBondsQuerySchema = zod_1.z.object({ country: zod_1.z.string().trim().min(2).max(2).optional() }).passthrough();
exports.onchainBondResponseSchema = zod_1.z.object({ enabled: zod_1.z.boolean() }).passthrough();
exports.sorobanBondResponseSchema = zod_1.z.object({
    source: zod_1.z.enum(['soroban', 'database_snapshot']),
    contract_id: common_1.requiredStringSchema,
}).passthrough();
exports.issueOnchainResponseSchema = zod_1.z.object({
    ok: zod_1.z.literal(true),
    txHash: zod_1.z.string().optional(),
    alreadyIssued: zod_1.z.boolean().optional(),
}).passthrough();
exports.documentUploadResponseSchema = zod_1.z.object({
    documentHash: zod_1.z.string().regex(/^[a-f0-9]{64}$/i),
    sorobanTxHash: zod_1.z.string().optional(),
}).passthrough();
exports.documentHashResponseSchema = zod_1.z.object({ hash: zod_1.z.string().regex(/^[a-f0-9]{64}$/i) });
