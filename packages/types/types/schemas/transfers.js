"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseResponseSchema = exports.transactionResponseSchema = exports.xdrResponseSchema = exports.transferRowSchema = exports.returnDecisionRequestSchema = exports.requestReturnRequestSchema = exports.submitXdrRequestSchema = exports.registerPaymentRequestSchema = exports.counterOfferRequestSchema = exports.createTransferRequestSchema = exports.transferStatusSchema = void 0;
const zod_1 = require("zod");
const transfer_1 = require("../transfer");
const common_1 = require("./common");
exports.transferStatusSchema = zod_1.z.nativeEnum(transfer_1.TransferStatus);
exports.createTransferRequestSchema = zod_1.z.object({
    bondTokenId: common_1.idSchema,
    toOwner: common_1.idSchema.optional(),
    paymentMethod: common_1.paymentMethodSchema.optional(),
    amount: common_1.positiveNumberSchema.optional(),
    message: zod_1.z.string().trim().max(1000).optional(),
    counterOfferAmount: common_1.positiveNumberSchema.optional(),
}).strict();
exports.counterOfferRequestSchema = zod_1.z.object({
    amount: common_1.positiveNumberSchema,
    message: zod_1.z.string().trim().max(1000).optional(),
}).strict();
exports.registerPaymentRequestSchema = zod_1.z.object({
    evidence: zod_1.z.string().trim().optional(),
    evidenceContent: zod_1.z.string().trim().optional(),
}).strict().refine((value) => Boolean(value.evidence || value.evidenceContent), {
    path: ['evidence'],
    message: 'validation.paymentEvidence',
});
exports.submitXdrRequestSchema = zod_1.z.object({ signedXdr: common_1.requiredStringSchema }).strict();
exports.requestReturnRequestSchema = zod_1.z.object({ reason: zod_1.z.string().trim().max(1000).optional() }).strict();
exports.returnDecisionRequestSchema = zod_1.z.object({ notes: zod_1.z.string().trim().max(2000).optional() }).strict();
exports.transferRowSchema = zod_1.z.object({
    id: common_1.idSchema,
    bond_token_id: common_1.idSchema,
    from_owner: common_1.idSchema,
    to_owner: common_1.idSchema,
    status: exports.transferStatusSchema,
    escrow_contract_id: zod_1.z.string().nullable(),
    payment_evidence_hash: zod_1.z.string().nullable(),
    validated_by: common_1.idSchema.nullable(),
    amount: zod_1.z.coerce.number().nullable(),
    counter_offer_amount: zod_1.z.coerce.number().nullable().optional(),
    seller_message: zod_1.z.string().nullable().optional(),
    buyer_message: zod_1.z.string().nullable().optional(),
    return_requested_at: zod_1.z.string().nullable().optional(),
    return_requested_by: common_1.idSchema.nullable().optional(),
    return_reason: zod_1.z.string().nullable().optional(),
    return_approved_at: zod_1.z.string().nullable().optional(),
    return_approved_by: common_1.idSchema.nullable().optional(),
    return_rejected_at: zod_1.z.string().nullable().optional(),
    return_rejected_by: common_1.idSchema.nullable().optional(),
    return_tse_notes: zod_1.z.string().nullable().optional(),
    created_at: common_1.requiredStringSchema,
    updated_at: common_1.requiredStringSchema,
}).passthrough();
exports.xdrResponseSchema = zod_1.z.object({
    xdr: common_1.requiredStringSchema,
    networkPassphrase: common_1.requiredStringSchema,
}).passthrough();
exports.transactionResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(true),
    txHash: zod_1.z.string().optional(),
}).passthrough();
exports.releaseResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(true),
    newOwner: common_1.idSchema,
}).passthrough();
