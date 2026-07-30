"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationQuerySchema = exports.successSchema = exports.okSchema = exports.emptyObjectSchema = exports.paramsBondTokenIdSchema = exports.paramsTokenIdSchema = exports.paramsIdSchema = exports.roleSchema = exports.paymentMethodSchema = exports.positiveNumberSchema = exports.optionalIsoDateSchema = exports.isoDateSchema = exports.idSchema = exports.requiredStringSchema = void 0;
exports.paginatedSchema = paginatedSchema;
const zod_1 = require("zod");
const roles_1 = require("../roles");
exports.requiredStringSchema = zod_1.z.string({ error: 'validation.required' }).trim().min(1, 'validation.required');
exports.idSchema = exports.requiredStringSchema;
exports.isoDateSchema = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.date');
exports.optionalIsoDateSchema = exports.isoDateSchema.optional();
exports.positiveNumberSchema = zod_1.z.coerce.number({ error: 'validation.positive' }).finite().positive('validation.positive');
exports.paymentMethodSchema = zod_1.z.enum(['sinpe', 'transferencia', 'wallet'], { error: 'validation.enum' });
exports.roleSchema = zod_1.z.nativeEnum(roles_1.Role, { error: 'validation.enum' });
exports.paramsIdSchema = zod_1.z.object({ id: exports.idSchema });
exports.paramsTokenIdSchema = zod_1.z.object({ tokenId: exports.idSchema });
exports.paramsBondTokenIdSchema = zod_1.z.object({ bondTokenId: exports.idSchema });
exports.emptyObjectSchema = zod_1.z.object({}).strict();
exports.okSchema = zod_1.z.object({ ok: zod_1.z.literal(true) }).passthrough();
exports.successSchema = zod_1.z.object({ success: zod_1.z.literal(true) }).passthrough();
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
}).passthrough();
function paginatedSchema(item) {
    return zod_1.z.object({
        data: zod_1.z.array(item),
        total: zod_1.z.number().int().nonnegative(),
        page: zod_1.z.number().int().positive(),
        limit: zod_1.z.number().int().positive(),
    });
}
