import { z } from 'zod';
import { BondStatus } from '../bond';
import {
  idSchema,
  isoDateSchema,
  optionalIsoDateSchema,
  paymentMethodSchema,
  positiveNumberSchema,
  requiredStringSchema,
} from './common';

export const bondStatusSchema = z.nativeEnum(BondStatus);

export const createBondRequestSchema = z.object({
  bondId: requiredStringSchema,
  issuerPartyId: idSchema,
  documentHash: requiredStringSchema,
  metadataUri: z.string().url('validation.url').optional(),
  faceValue: positiveNumberSchema.optional(),
  initialOwner: idSchema.optional(),
  certificateNumber: z.string().trim().optional(),
  currency: z.string().trim().min(3, 'validation.required').max(3).optional(),
  interestRate: z.coerce.number().finite().min(0).max(100).optional(),
  series: z.string().trim().optional(),
  issueDate: optionalIsoDateSchema,
  maturityDate: optionalIsoDateSchema,
}).strict().refine(
  (value) => !value.issueDate || !value.maturityDate || value.maturityDate >= value.issueDate,
  { path: ['maturityDate'], message: 'validation.date' },
);

export const createBondRequestRequestSchema = z.object({
  faceValue: positiveNumberSchema,
  currency: z.string().trim().min(3).max(3).optional(),
  interestRate: z.coerce.number().finite().min(0).max(100).optional(),
  series: z.string().trim().optional(),
  issueDate: optionalIsoDateSchema,
  maturityDate: optionalIsoDateSchema,
  notes: z.string().trim().max(2000).optional(),
  certificateNumber: z.string().trim().optional(),
}).strict().refine(
  (value) => !value.issueDate || !value.maturityDate || value.maturityDate >= value.issueDate,
  { path: ['maturityDate'], message: 'validation.date' },
);

export const publishBondRequestSchema = z.object({
  paymentMethods: z.array(paymentMethodSchema).min(1).optional(),
}).strict();

export const rejectBondRequestSchema = z.object({ reason: z.string().trim().max(1000).optional() }).strict();
export const hashDocumentRequestSchema = z.object({ content: requiredStringSchema }).strict();

export const bondRowSchema = z.object({
  token_id: idSchema,
  bond_id: requiredStringSchema,
  issuer_party_id: idSchema,
  current_owner: idSchema.nullable(),
  status: bondStatusSchema,
  document_hash: requiredStringSchema,
  metadata_uri: z.string().nullable(),
  face_value: z.coerce.number().nullable(),
  certificate_number: z.string().nullable().optional(),
  currency: z.string().min(3).max(3).optional(),
  interest_rate: z.coerce.number().nullable().optional(),
  series: z.string().nullable().optional(),
  issue_date: isoDateSchema.nullable().optional(),
  maturity_date: isoDateSchema.nullable().optional(),
  country: z.string().min(2).max(2).optional(),
  payment_methods: z.array(paymentMethodSchema).optional(),
  stellar_status: z.string().optional(),
  stellar_transaction_hash: z.string().nullable().optional(),
  stellar_ledger: z.coerce.number().nullable().optional(),
  stellar_asset_code: z.string().nullable().optional(),
  stellar_issuer_public_key: z.string().nullable().optional(),
  stellar_owner_public_key: z.string().nullable().optional(),
  stellar_registered_at: z.string().nullable().optional(),
  stellar_error: z.string().nullable().optional(),
  created_at: requiredStringSchema,
  updated_at: requiredStringSchema,
}).passthrough();

export const bondRequestRowSchema = z.object({
  id: idSchema,
  party_id: idSchema,
  requested_by: idSchema,
  status: z.enum(['pendiente', 'aprobado', 'rechazado']),
  face_value: z.coerce.number(),
  currency: z.string().min(3).max(3),
  interest_rate: z.coerce.number().nullable(),
  issue_date: isoDateSchema.nullable(),
  maturity_date: isoDateSchema.nullable(),
  bond_token_id: idSchema.nullable(),
  rejection_reason: z.string().nullable(),
  created_at: requiredStringSchema,
  updated_at: requiredStringSchema,
}).passthrough();

export const bondsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  country: z.string().trim().min(2).max(2).optional(),
}).passthrough();

export const availableBondsQuerySchema = z.object({ country: z.string().trim().min(2).max(2).optional() }).passthrough();

export const onchainBondResponseSchema = z.object({ enabled: z.boolean() }).passthrough();
export const sorobanBondResponseSchema = z.object({
  source: z.enum(['soroban', 'database_snapshot']),
  contract_id: requiredStringSchema,
}).passthrough();
export const issueOnchainResponseSchema = z.object({
  ok: z.literal(true),
  txHash: z.string().optional(),
  alreadyIssued: z.boolean().optional(),
}).passthrough();
export const documentUploadResponseSchema = z.object({
  documentHash: z.string().regex(/^[a-f0-9]{64}$/i),
  sorobanTxHash: z.string().optional(),
}).passthrough();
export const documentHashResponseSchema = z.object({ hash: z.string().regex(/^[a-f0-9]{64}$/i) });

export type CreateBondRequest = z.input<typeof createBondRequestSchema>;
export type BondRequestRequest = z.input<typeof createBondRequestRequestSchema>;
export type BondRow = z.output<typeof bondRowSchema>;
