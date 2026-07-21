"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginResponseSchema = exports.registerResponseSchema = exports.registerRequestSchema = exports.loginRequestSchema = exports.perspectiveSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.perspectiveSchema = zod_1.z.enum(['usuario', 'partido'], { error: 'validation.enum' });
exports.loginRequestSchema = zod_1.z.object({
    email: common_1.requiredStringSchema.email('validation.email'),
    password: common_1.requiredStringSchema,
}).strict();
exports.registerRequestSchema = zod_1.z.object({
    email: common_1.requiredStringSchema.email('validation.email'),
    password: common_1.requiredStringSchema.min(8, 'validation.password'),
    perspectiva: exports.perspectiveSchema,
    nombres: zod_1.z.string().trim().optional(),
    apellidos: zod_1.z.string().trim().optional(),
    identificacion: zod_1.z.string().trim().optional(),
    telefono: zod_1.z.string().trim().optional(),
    direccion: zod_1.z.string().trim().optional(),
    nombrePartido: zod_1.z.string().trim().optional(),
    codigo: zod_1.z.string().trim().optional(),
    representanteLegal: zod_1.z.string().trim().optional(),
    cedulaJuridica: zod_1.z.string().trim().optional(),
}).strict().superRefine((value, context) => {
    if (value.perspectiva === 'usuario') {
        if (!value.nombres)
            context.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['nombres'], message: 'validation.required' });
        if (!value.apellidos)
            context.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['apellidos'], message: 'validation.required' });
        if (!value.identificacion)
            context.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['identificacion'], message: 'validation.required' });
    }
    if (value.perspectiva === 'partido') {
        if (!value.nombrePartido)
            context.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['nombrePartido'], message: 'validation.partyFields' });
        if (!value.codigo)
            context.addIssue({ code: zod_1.z.ZodIssueCode.custom, path: ['codigo'], message: 'validation.partyFields' });
    }
});
exports.registerResponseSchema = zod_1.z.object({
    id: common_1.requiredStringSchema,
    email: common_1.requiredStringSchema.email(),
    role: zod_1.z.enum(['comprador', 'emisor']),
    perspectiva: exports.perspectiveSchema,
    partyId: zod_1.z.string().nullable(),
    wallet: zod_1.z.string().nullable(),
}).passthrough();
exports.loginResponseSchema = zod_1.z.object({
    access_token: common_1.requiredStringSchema,
    refresh_token: common_1.requiredStringSchema,
    expires_in: zod_1.z.number().positive(),
    token_type: common_1.requiredStringSchema,
    user: zod_1.z.unknown(),
}).passthrough();
