import { z } from 'zod';
import { requiredStringSchema } from './common';

export const perspectiveSchema = z.enum(['usuario', 'partido'], { errorMap: () => ({ message: 'validation.enum' }) });

export const loginRequestSchema = z.object({
  email: requiredStringSchema.email('validation.email'),
  password: requiredStringSchema,
}).strict();

export const registerRequestSchema = z.object({
  email: requiredStringSchema.email('validation.email'),
  password: requiredStringSchema.min(8, 'validation.password'),
  perspectiva: perspectiveSchema,
  nombres: z.string().trim().optional(),
  apellidos: z.string().trim().optional(),
  identificacion: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  direccion: z.string().trim().optional(),
  nombrePartido: z.string().trim().optional(),
  codigo: z.string().trim().optional(),
  representanteLegal: z.string().trim().optional(),
  cedulaJuridica: z.string().trim().optional(),
}).strict().superRefine((value, context) => {
  if (value.perspectiva === 'usuario') {
    if (!value.nombres) context.addIssue({ code: z.ZodIssueCode.custom, path: ['nombres'], message: 'validation.required' });
    if (!value.apellidos) context.addIssue({ code: z.ZodIssueCode.custom, path: ['apellidos'], message: 'validation.required' });
    if (!value.identificacion) context.addIssue({ code: z.ZodIssueCode.custom, path: ['identificacion'], message: 'validation.required' });
  }
  if (value.perspectiva === 'partido') {
    if (!value.nombrePartido) context.addIssue({ code: z.ZodIssueCode.custom, path: ['nombrePartido'], message: 'validation.partyFields' });
    if (!value.codigo) context.addIssue({ code: z.ZodIssueCode.custom, path: ['codigo'], message: 'validation.partyFields' });
  }
});

export const registerResponseSchema = z.object({
  id: requiredStringSchema,
  email: requiredStringSchema.email(),
  role: z.enum(['comprador', 'emisor']),
  perspectiva: perspectiveSchema,
  partyId: z.string().nullable(),
  wallet: z.string().nullable(),
}).passthrough();

export const loginResponseSchema = z.object({
  access_token: requiredStringSchema,
  refresh_token: requiredStringSchema,
  expires_in: z.number().positive(),
  token_type: requiredStringSchema,
  user: z.unknown(),
}).passthrough();

export type LoginRequest = z.input<typeof loginRequestSchema>;
export type RegisterRequest = z.input<typeof registerRequestSchema>;
export type RegisterResponse = z.output<typeof registerResponseSchema>;
