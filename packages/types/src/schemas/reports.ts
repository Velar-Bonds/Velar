import { z } from 'zod';
import { idSchema, isoDateSchema, positiveNumberSchema, requiredStringSchema } from './common';

export const reportStatusSchema = z.enum(['enviado', 'revisado', 'observado', 'aprobado']);

export const createReportRequestSchema = z.object({
  title: requiredStringSchema.max(200),
  description: requiredStringSchema.max(5000),
  period_start: isoDateSchema.optional(),
  period_end: isoDateSchema.optional(),
  bond_token_ids: z.array(idSchema).min(1).optional(),
  total_amount: positiveNumberSchema.optional(),
}).strict().refine(
  (value) => !value.period_start || !value.period_end || value.period_end >= value.period_start,
  { path: ['period_end'], message: 'validation.date' },
);

export const reviewReportRequestSchema = z.object({
  status: z.enum(['revisado', 'observado', 'aprobado'], { error: 'validation.enum' }),
  notes: z.string().trim().max(2000).optional(),
}).strict();

export const reportRowSchema = z.object({
  id: idSchema,
  party_id: idSchema,
  submitted_by: idSchema,
  title: requiredStringSchema,
  description: requiredStringSchema,
  period_start: isoDateSchema.nullable(),
  period_end: isoDateSchema.nullable(),
  bond_token_ids: z.array(idSchema).nullable(),
  total_amount: z.coerce.number().nullable(),
  status: reportStatusSchema,
  reviewed_by: idSchema.nullable(),
  reviewed_at: z.string().nullable(),
  tse_notes: z.string().nullable(),
  created_at: requiredStringSchema,
  updated_at: requiredStringSchema,
}).passthrough();

export type CreateReportRequest = z.input<typeof createReportRequestSchema>;
export type ReportRow = z.output<typeof reportRowSchema>;
