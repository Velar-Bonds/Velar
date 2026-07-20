import { z } from 'zod';
import { idSchema, positiveNumberSchema, requiredStringSchema } from './common';

export const escrowOperationSchema = z.object({
  transferId: idSchema,
  bondTokenId: idSchema,
  seller: requiredStringSchema,
  buyer: requiredStringSchema,
  approver: requiredStringSchema,
  amount: positiveNumberSchema,
  title: requiredStringSchema,
}).strict();

export const escrowStateSchema = z.object({
  contractId: z.string().optional(),
  status: z.enum(['initialized', 'funded', 'approved', 'released', 'refunded', 'disputed']).optional(),
}).passthrough();
