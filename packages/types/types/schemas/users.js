"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryWalletResponseSchema = exports.retryWalletRequestSchema = exports.walletResponseSchema = exports.recipientRowSchema = exports.profileRowSchema = exports.setRoleRequestSchema = exports.updateWalletRequestSchema = exports.updateProfileRequestSchema = exports.userAuditEventSchema = exports.bulkSetRoleResponseSchema = exports.bulkSetRoleRequestSchema = exports.usersQuerySchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
/** GET /users — paginación + filtros por rol y búsqueda (nombre/email). */
exports.usersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    role: common_1.roleSchema.optional(),
    search: zod_1.z.string().trim().min(1).optional(),
}).passthrough();
/** Asignación de rol en lote — solo admin. */
exports.bulkSetRoleRequestSchema = zod_1.z.object({
    userIds: zod_1.z.array(common_1.idSchema).min(1),
    role: common_1.roleSchema,
}).strict();
exports.bulkSetRoleResponseSchema = zod_1.z.object({
    ok: zod_1.z.literal(true),
    updated: zod_1.z.array(common_1.idSchema),
}).passthrough();
/** Eventos mostrados en la trazabilidad de administración por usuario. */
exports.userAuditEventSchema = zod_1.z.object({
    id: common_1.idSchema,
    bondTokenId: common_1.idSchema.nullable(),
    transferId: common_1.idSchema.nullable(),
    type: zod_1.z.string().min(1),
    actorId: common_1.idSchema.nullable(),
    payload: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
    txHash: zod_1.z.string().nullable().optional(),
    createdAt: common_1.requiredStringSchema,
}).passthrough();
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
    stellar_wallet_status: zod_1.z.string().nullable().optional(),
    stellar_wallet_error: zod_1.z.string().nullable().optional(),
    stellar_network: zod_1.z.string().nullable().optional(),
    stellar_created_at: zod_1.z.string().nullable().optional(),
    stellar_wallet_retry_count: zod_1.z.number().int().nullable().optional(),
    stellar_wallet_last_retry_at: zod_1.z.string().nullable().optional(),
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
/** POST /users/:id/wallet/retry — Express may send `{}`; do not use z.undefined(). */
exports.retryWalletRequestSchema = zod_1.z.object({}).strict();
exports.retryWalletResponseSchema = zod_1.z.object({
    ok: zod_1.z.literal(true),
    stellar_wallet: zod_1.z.string().nullable().optional(),
    stellar_wallet_status: zod_1.z.string().nullable().optional(),
    stellar_wallet_error: zod_1.z.string().nullable().optional(),
    stellar_network: zod_1.z.string().nullable().optional(),
    stellar_wallet_retry_count: zod_1.z.number().int().nullable().optional(),
    stellar_wallet_last_retry_at: zod_1.z.string().nullable().optional(),
}).passthrough();
