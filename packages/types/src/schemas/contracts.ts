import { z } from 'zod';
import { COUNTRY_CODES } from '../country';
import { ContractStatus } from '../contract-model';
import { idSchema, requiredStringSchema } from './common';

/**
 * Zod schemas for the contract intelligence & document assembly engine
 * (issue #38): `GET /bonds/:tokenId/summary` and the `/contracts/...` template,
 * version, clause-library, diff and document-assembly endpoints. Registered in
 * `apiContracts` (`../contracts.ts`) per the shared-contract convention (#43).
 */

export const clauseCategorySchema = z.enum([
  'partes', 'objeto', 'pago', 'transferencia', 'garantia', 'plazo', 'incumplimiento', 'jurisdiccion', 'firmas', 'otro',
]);

export const countryCodeSchema = z.enum(COUNTRY_CODES);

const contractClauseSchema = z.object({
  id: idSchema,
  order: z.number().int().positive(),
  title: requiredStringSchema,
  category: clauseCategorySchema,
  legalText: requiredStringSchema,
  references: z.array(z.string()).optional(),
}).passthrough();

const contractAmountSchema = z.object({
  value: z.number().nullable(),
  currency: z.string().nullable(),
  unknown: z.boolean(),
});

const contractConditionSchema = z.object({
  id: idSchema,
  description: requiredStringSchema,
  sourceClauseId: idSchema,
});

const contractObligationSchema = z.object({
  id: idSchema,
  role: z.enum(['tse', 'vendedor', 'comprador']),
  description: requiredStringSchema,
  sourceClauseId: idSchema,
});

const contractKeyDateSchema = z.object({
  id: idSchema,
  kind: z.enum([
    'issue_date', 'maturity_date', 'transfer_requested', 'transfer_last_update', 'released', 'version_published',
  ]),
  label: requiredStringSchema,
  date: z.string().nullable(),
  unknown: z.boolean(),
});

const contractStatusSchema = z.nativeEnum(ContractStatus);

const contractAttentionFlagSchema = z.object({
  id: idSchema,
  severity: z.enum(['info', 'warning', 'critical']),
  kind: requiredStringSchema,
  message: requiredStringSchema,
  sourceClauseId: idSchema.optional(),
});

export const contractSummaryResponseSchema = z.object({
  bondId: idSchema,
  contractId: idSchema,
  title: requiredStringSchema,
  version: requiredStringSchema,
  clauses: z.array(contractClauseSchema),
  generatedAt: requiredStringSchema,
  country: countryCodeSchema,
  amount: contractAmountSchema,
  conditions: z.array(contractConditionSchema),
  obligations: z.array(contractObligationSchema),
  keyDates: z.array(contractKeyDateSchema),
  status: contractStatusSchema,
  attentionFlags: z.array(contractAttentionFlagSchema),
}).passthrough();

export const contractClauseLibraryEntrySchema = z.object({
  id: idSchema,
  clauseKey: requiredStringSchema,
  category: clauseCategorySchema,
  title: requiredStringSchema,
  bodyTemplate: requiredStringSchema,
  parameters: z.array(z.string()),
  locale: requiredStringSchema,
  createdAt: requiredStringSchema,
  updatedAt: requiredStringSchema,
}).passthrough();

export const contractTemplateSchema = z.object({
  id: idSchema,
  key: requiredStringSchema,
  country: countryCodeSchema,
  name: requiredStringSchema,
  description: z.string().nullable().optional(),
  createdAt: requiredStringSchema,
  updatedAt: requiredStringSchema,
}).passthrough();

const contractVersionStatusSchema = z.enum(['draft', 'published', 'archived']);

export const contractVersionSummarySchema = z.object({
  id: idSchema,
  templateId: idSchema,
  versionNumber: z.number().int().positive(),
  status: contractVersionStatusSchema,
  clauseKeys: z.array(z.string()),
  notes: z.string().nullable().optional(),
  createdBy: z.string().nullable().optional(),
  createdAt: requiredStringSchema,
  publishedAt: z.string().nullable().optional(),
}).passthrough();

export const contractVersionDetailSchema = contractVersionSummarySchema.extend({
  clauses: z.array(contractClauseLibraryEntrySchema),
});

const clauseDiffEntrySchema = z.object({
  clauseKey: requiredStringSchema,
  title: requiredStringSchema,
  order: z.number().int().nonnegative(),
});

const clauseDiffChangedEntrySchema = z.object({
  clauseKey: requiredStringSchema,
  title: requiredStringSchema,
  fromOrder: z.number().int().nonnegative(),
  toOrder: z.number().int().nonnegative(),
  bodyChanged: z.boolean(),
});

export const contractVersionDiffResponseSchema = z.object({
  fromVersionId: idSchema,
  toVersionId: idSchema,
  added: z.array(clauseDiffEntrySchema),
  removed: z.array(clauseDiffEntrySchema),
  changed: z.array(clauseDiffChangedEntrySchema),
  unchanged: z.array(clauseDiffEntrySchema),
});

const assembledDocumentSectionSchema = z.object({
  clauseKey: requiredStringSchema,
  order: z.number().int().nonnegative(),
  title: requiredStringSchema,
  category: clauseCategorySchema,
  text: z.string(),
  missingParameters: z.array(z.string()),
});

export const assembledContractDocumentResponseSchema = z.object({
  bondId: idSchema,
  templateId: idSchema,
  versionId: idSchema,
  versionNumber: z.number().int().positive(),
  title: requiredStringSchema,
  sections: z.array(assembledDocumentSectionSchema),
  fullText: z.string(),
  generatedAt: requiredStringSchema,
});

export const paramsTemplateIdSchema = z.object({ id: idSchema });
export const paramsVersionIdSchema = z.object({ versionId: idSchema });
export const paramsBondIdSchema = z.object({ bondId: idSchema });

export const contractVersionsQuerySchema = z.object({}).passthrough();
export const contractTemplatesQuerySchema = z.object({ country: countryCodeSchema.optional() }).passthrough();
export const contractClausesQuerySchema = z.object({ category: clauseCategorySchema.optional() }).passthrough();
export const contractDocumentQuerySchema = z.object({ versionId: z.string().optional() }).passthrough();
export const contractVersionDiffQuerySchema = z.object({ from: idSchema, to: idSchema }).passthrough();

export const createContractTemplateRequestSchema = z.object({
  key: requiredStringSchema,
  country: countryCodeSchema,
  name: requiredStringSchema,
  description: z.string().trim().max(2000).optional(),
}).strict();

export const createContractVersionRequestSchema = z.object({
  clauseKeys: z.array(requiredStringSchema).min(1),
  notes: z.string().trim().max(2000).optional(),
}).strict();

export const upsertContractClauseRequestSchema = z.object({
  clauseKey: requiredStringSchema,
  category: clauseCategorySchema,
  title: requiredStringSchema,
  bodyTemplate: requiredStringSchema,
  parameters: z.array(requiredStringSchema).optional(),
  locale: z.string().trim().min(2).max(5).optional(),
}).strict();

export type CreateContractTemplateRequest = z.input<typeof createContractTemplateRequestSchema>;
export type CreateContractVersionRequest = z.input<typeof createContractVersionRequestSchema>;
export type UpsertContractClauseRequest = z.input<typeof upsertContractClauseRequestSchema>;
