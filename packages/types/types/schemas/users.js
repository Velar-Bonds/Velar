"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletResponseSchema = exports.recipientRowSchema = exports.profileRowSchema = exports.setRoleRequestSchema = exports.updateWalletRequestSchema = exports.updateProfileRequestSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.updateProfileRequestSchema = zod_1.z.object({
    full_name: common_1.requiredStringSchema.max(200).optional(),
}).strict().refine((value) => value.full_name !== undefined, { path: ['full_name'], message: 'validation.required' });
exports.updateWalletRequestSchema = zod_1.z.object({
    publicKey: zod_1.z.string().regex(/^G[A-Z2-7]{55}$/, 'validation.stellarKey'),
}).strict();
exports.setRoleRequestSchema = zod_1.z.object({ role: common_1.roleSchema }).strict();
exports.profileRowSchema = zod_1.z.object({
    id: common_1.idSchema,
    email: zod_1.z.string().email(),
    full_name: zod_1.z.string().nullable(),
    role: common_1.roleSchema,
    party_id: common_1.idSchema.nullable(),
    stellar_wallet: zod_1.z.string().nullable(),
    stellar_public_key: zod_1.z.string().nullable().optional(),
    country: zod_1.z.string().min(2).max(2).optional(),
    created_at: common_1.requiredStringSchema,
    updated_at: common_1.requiredStringSchema,
}).passthrough();
exports.recipientRowSchema = zod_1.z.object({
    id: common_1.idSchema,
    full_name: zod_1.z.string().nullable().optional(),
    email: zod_1.z.string().email().nullable().optional(),
    role: common_1.roleSchema,
}).passthrough();
exports.walletResponseSchema = zod_1.z.object({
    ok: zod_1.z.literal(true),
    stellar_public_key: zod_1.z.string().regex(/^G[A-Z2-7]{55}$/),
}).passthrough();
