"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRowSchema = exports.reviewReportRequestSchema = exports.createReportRequestSchema = exports.reportStatusSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.reportStatusSchema = zod_1.z.enum(['enviado', 'revisado', 'observado', 'aprobado']);
exports.createReportRequestSchema = zod_1.z.object({
    title: common_1.requiredStringSchema.max(200),
    description: common_1.requiredStringSchema.max(5000),
    period_start: common_1.isoDateSchema.optional(),
    period_end: common_1.isoDateSchema.optional(),
    bond_token_ids: zod_1.z.array(common_1.idSchema).min(1).optional(),
    total_amount: common_1.positiveNumberSchema.optional(),
}).strict().refine((value) => !value.period_start || !value.period_end || value.period_end >= value.period_start, { path: ['period_end'], message: 'validation.date' });
exports.reviewReportRequestSchema = zod_1.z.object({
    status: zod_1.z.enum(['revisado', 'observado', 'aprobado'], { error: 'validation.enum' }),
    notes: zod_1.z.string().trim().max(2000).optional(),
}).strict();
exports.reportRowSchema = zod_1.z.object({
    id: common_1.idSchema,
    party_id: common_1.idSchema,
    submitted_by: common_1.idSchema,
    title: common_1.requiredStringSchema,
    description: common_1.requiredStringSchema,
    period_start: common_1.isoDateSchema.nullable(),
    period_end: common_1.isoDateSchema.nullable(),
    bond_token_ids: zod_1.z.array(common_1.idSchema).nullable(),
    total_amount: zod_1.z.coerce.number().nullable(),
    status: exports.reportStatusSchema,
    reviewed_by: common_1.idSchema.nullable(),
    reviewed_at: zod_1.z.string().nullable(),
    tse_notes: zod_1.z.string().nullable(),
    created_at: common_1.requiredStringSchema,
    updated_at: common_1.requiredStringSchema,
}).passthrough();
