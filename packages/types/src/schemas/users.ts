import { z } from 'zod';
import { idSchema, requiredStringSchema, roleSchema } from './common';

/** GET /users — paginación + filtros por rol y búsqueda (nombre/email). */
export const usersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  role: roleSchema.optional(),
  search: z.string().trim().min(1).optional(),
}).passthrough();

/** Asignación de rol en lote — solo admin. */
export const bulkSetRoleRequestSchema = z.object({
  userIds: z.array(idSchema).min(1),
  role: roleSchema,
}).strict();

export const bulkSetRoleResponseSchema = z.object({
  ok: z.literal(true),
  updated: z.array(idSchema),
}).passthrough();

/** Eventos mostrados en la trazabilidad de administración por usuario. */
export const userAuditEventSchema = z.object({
  id: idSchema,
  bondTokenId: idSchema.nullable(),
  transferId: idSchema.nullable(),
  type: z.string().min(1),
  actorId: idSchema.nullable(),
  payload: z.record(z.string(), z.unknown()),
  txHash: z.string().nullable().optional(),
  createdAt: requiredStringSchema,
}).passthrough();

export const updateProfileRequestSchema = z.object({
  full_name: requiredStringSchema.max(200).optional(),
}).strict().refine((value) => value.full_name !== undefined, { path: ['full_name'], message: 'validation.required' });

export const updateWalletRequestSchema = z.object({
  publicKey: z.string().regex(/^G[A-Z2-7]{55}$/, 'validation.stellarKey'),
}).strict();

export const setRoleRequestSchema = z.object({ role: roleSchema }).strict();

export const profileRowSchema = z.object({
  id: idSchema,
  email: z.string().email(),
  full_name: z.string().nullable(),
  role: roleSchema,
  party_id: idSchema.nullable(),
  stellar_wallet: z.string().nullable(),
  stellar_public_key: z.string().nullable().optional(),
  stellar_wallet_status: z.string().nullable().optional(),
  stellar_wallet_error: z.string().nullable().optional(),
  stellar_network: z.string().nullable().optional(),
  stellar_created_at: z.string().nullable().optional(),
  stellar_wallet_retry_count: z.number().int().nullable().optional(),
  stellar_wallet_last_retry_at: z.string().nullable().optional(),
  country: z.string().min(2).max(2).optional(),
  created_at: requiredStringSchema,
  updated_at: requiredStringSchema,
}).passthrough();
export const recipientRowSchema = z.object({
  id: idSchema,
  full_name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  role: roleSchema,
}).passthrough();

export const walletResponseSchema = z.object({
  ok: z.literal(true),
  stellar_public_key: z.string().regex(/^G[A-Z2-7]{55}$/),
}).passthrough();

/** POST /users/:id/wallet/retry — Express may send `{}`; do not use z.undefined(). */
export const retryWalletRequestSchema = z.object({}).strict();

export const retryWalletResponseSchema = z.object({
  ok: z.literal(true),
  stellar_wallet: z.string().nullable().optional(),
  stellar_wallet_status: z.string().nullable().optional(),
  stellar_wallet_error: z.string().nullable().optional(),
  stellar_network: z.string().nullable().optional(),
  stellar_wallet_retry_count: z.number().int().nullable().optional(),
  stellar_wallet_last_retry_at: z.string().nullable().optional(),
}).passthrough();
