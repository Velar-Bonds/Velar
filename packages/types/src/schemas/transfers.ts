import { z } from 'zod';
import { TransferStatus } from '../transfer';
import { idSchema, paymentMethodSchema, positiveNumberSchema, requiredStringSchema } from './common';

export const transferStatusSchema = z.nativeEnum(TransferStatus);

export const createTransferRequestSchema = z.object({
  bondTokenId: idSchema,
  toOwner: idSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
  amount: positiveNumberSchema.optional(),
  message: z.string().trim().max(1000).optional(),
  counterOfferAmount: positiveNumberSchema.optional(),
}).strict();

export const counterOfferRequestSchema = z.object({
  amount: positiveNumberSchema,
  message: z.string().trim().max(1000).optional(),
}).strict();

export const registerPaymentRequestSchema = z.object({
  evidence: z.string().trim().optional(),
  evidenceContent: z.string().trim().optional(),
}).strict().refine((value) => Boolean(value.evidence || value.evidenceContent), {
  path: ['evidence'],
  message: 'validation.paymentEvidence',
});

export const submitXdrRequestSchema = z.object({ signedXdr: requiredStringSchema }).strict();
export const requestReturnRequestSchema = z.object({ reason: z.string().trim().max(1000).optional() }).strict();
export const returnDecisionRequestSchema = z.object({ notes: z.string().trim().max(2000).optional() }).strict();

export const transferRowSchema = z.object({
  id: idSchema,
  bond_token_id: idSchema,
  from_owner: idSchema,
  to_owner: idSchema,
  status: transferStatusSchema,
  escrow_contract_id: z.string().nullable(),
  payment_evidence_hash: z.string().nullable(),
  validated_by: idSchema.nullable(),
  amount: z.coerce.number().nullable(),
  counter_offer_amount: z.coerce.number().nullable().optional(),
  seller_message: z.string().nullable().optional(),
  buyer_message: z.string().nullable().optional(),
  return_requested_at: z.string().nullable().optional(),
  return_requested_by: idSchema.nullable().optional(),
  return_reason: z.string().nullable().optional(),
  return_approved_at: z.string().nullable().optional(),
  return_approved_by: idSchema.nullable().optional(),
  return_rejected_at: z.string().nullable().optional(),
  return_rejected_by: idSchema.nullable().optional(),
  return_tse_notes: z.string().nullable().optional(),
  created_at: requiredStringSchema,
  updated_at: requiredStringSchema,
}).passthrough();

export const xdrResponseSchema = z.object({
  xdr: requiredStringSchema,
  networkPassphrase: requiredStringSchema,
}).passthrough();

export const transactionResponseSchema = z.object({
  success: z.literal(true),
  txHash: z.string().optional(),
}).passthrough();

export const releaseResponseSchema = z.object({
  success: z.literal(true),
  newOwner: idSchema,
}).passthrough();

export type CreateTransferRequest = z.input<typeof createTransferRequestSchema>;
export type TransferRow = z.output<typeof transferRowSchema>;
