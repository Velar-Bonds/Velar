import { z } from 'zod';
import { idSchema, requiredStringSchema, roleSchema } from './common';

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
