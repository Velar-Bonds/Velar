import { z } from 'zod';
import { Role } from '../roles';

export const requiredStringSchema = z.string({ required_error: 'validation.required' }).trim().min(1, 'validation.required');
export const idSchema = requiredStringSchema;
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.date');
export const optionalIsoDateSchema = isoDateSchema.optional();
export const positiveNumberSchema = z.coerce.number({ invalid_type_error: 'validation.positive' }).finite().positive('validation.positive');
export const paymentMethodSchema = z.enum(['sinpe', 'transferencia', 'wallet'], { errorMap: () => ({ message: 'validation.enum' }) });
export const roleSchema = z.nativeEnum(Role, { errorMap: () => ({ message: 'validation.enum' }) });
export const paramsIdSchema = z.object({ id: idSchema });
export const paramsTokenIdSchema = z.object({ tokenId: idSchema });
export const paramsBondTokenIdSchema = z.object({ bondTokenId: idSchema });
export const emptyObjectSchema = z.object({}).strict();
export const okSchema = z.object({ ok: z.literal(true) }).passthrough();
export const successSchema = z.object({ success: z.literal(true) }).passthrough();
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
}).passthrough();

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
  });
}
