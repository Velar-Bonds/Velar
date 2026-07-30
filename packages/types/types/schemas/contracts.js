"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertContractClauseRequestSchema = exports.createContractVersionRequestSchema = exports.createContractTemplateRequestSchema = exports.contractVersionDiffQuerySchema = exports.contractDocumentQuerySchema = exports.contractClausesQuerySchema = exports.contractTemplatesQuerySchema = exports.contractVersionsQuerySchema = exports.paramsBondIdSchema = exports.paramsVersionIdSchema = exports.paramsTemplateIdSchema = exports.assembledContractDocumentResponseSchema = exports.contractVersionDiffResponseSchema = exports.contractVersionDetailSchema = exports.contractVersionSummarySchema = exports.contractTemplateSchema = exports.contractClauseLibraryEntrySchema = exports.contractSummaryResponseSchema = exports.countryCodeSchema = exports.clauseCategorySchema = void 0;
const zod_1 = require("zod");
const country_1 = require("../country");
const contract_model_1 = require("../contract-model");
const common_1 = require("./common");
/**
 * Zod schemas for the contract intelligence & document assembly engine
 * (issue #38): `GET /bonds/:tokenId/summary` and the `/contracts/...` template,
 * version, clause-library, diff and document-assembly endpoints. Registered in
 * `apiContracts` (`../contracts.ts`) per the shared-contract convention (#43).
 */
exports.clauseCategorySchema = zod_1.z.enum([
    'partes', 'objeto', 'pago', 'transferencia', 'garantia', 'plazo', 'incumplimiento', 'jurisdiccion', 'firmas', 'otro',
]);
exports.countryCodeSchema = zod_1.z.enum(country_1.COUNTRY_CODES);
const contractClauseSchema = zod_1.z.object({
    id: common_1.idSchema,
    order: zod_1.z.number().int().positive(),
    title: common_1.requiredStringSchema,
    category: exports.clauseCategorySchema,
    legalText: common_1.requiredStringSchema,
    references: zod_1.z.array(zod_1.z.string()).optional(),
}).passthrough();
const contractAmountSchema = zod_1.z.object({
    value: zod_1.z.number().nullable(),
    currency: zod_1.z.string().nullable(),
    unknown: zod_1.z.boolean(),
});
const contractConditionSchema = zod_1.z.object({
    id: common_1.idSchema,
    description: common_1.requiredStringSchema,
    sourceClauseId: common_1.idSchema,
});
const contractObligationSchema = zod_1.z.object({
    id: common_1.idSchema,
    role: zod_1.z.enum(['tse', 'vendedor', 'comprador']),
    description: common_1.requiredStringSchema,
    sourceClauseId: common_1.idSchema,
});
const contractKeyDateSchema = zod_1.z.object({
    id: common_1.idSchema,
    kind: zod_1.z.enum([
        'issue_date', 'maturity_date', 'transfer_requested', 'transfer_last_update', 'released', 'version_published',
    ]),
    label: common_1.requiredStringSchema,
    date: zod_1.z.string().nullable(),
    unknown: zod_1.z.boolean(),
});
const contractStatusSchema = zod_1.z.nativeEnum(contract_model_1.ContractStatus);
const contractAttentionFlagSchema = zod_1.z.object({
    id: common_1.idSchema,
    severity: zod_1.z.enum(['info', 'warning', 'critical']),
    kind: common_1.requiredStringSchema,
    message: common_1.requiredStringSchema,
    sourceClauseId: common_1.idSchema.optional(),
});
exports.contractSummaryResponseSchema = zod_1.z.object({
    bondId: common_1.idSchema,
    contractId: common_1.idSchema,
    title: common_1.requiredStringSchema,
    version: common_1.requiredStringSchema,
    clauses: zod_1.z.array(contractClauseSchema),
    generatedAt: common_1.requiredStringSchema,
    country: exports.countryCodeSchema,
    amount: contractAmountSchema,
    conditions: zod_1.z.array(contractConditionSchema),
    obligations: zod_1.z.array(contractObligationSchema),
    keyDates: zod_1.z.array(contractKeyDateSchema),
    status: contractStatusSchema,
    attentionFlags: zod_1.z.array(contractAttentionFlagSchema),
}).passthrough();
exports.contractClauseLibraryEntrySchema = zod_1.z.object({
    id: common_1.idSchema,
    clauseKey: common_1.requiredStringSchema,
    category: exports.clauseCategorySchema,
    title: common_1.requiredStringSchema,
    bodyTemplate: common_1.requiredStringSchema,
    parameters: zod_1.z.array(zod_1.z.string()),
    locale: common_1.requiredStringSchema,
    createdAt: common_1.requiredStringSchema,
    updatedAt: common_1.requiredStringSchema,
}).passthrough();
exports.contractTemplateSchema = zod_1.z.object({
    id: common_1.idSchema,
    key: common_1.requiredStringSchema,
    country: exports.countryCodeSchema,
    name: common_1.requiredStringSchema,
    description: zod_1.z.string().nullable().optional(),
    createdAt: common_1.requiredStringSchema,
    updatedAt: common_1.requiredStringSchema,
}).passthrough();
const contractVersionStatusSchema = zod_1.z.enum(['draft', 'published', 'archived']);
exports.contractVersionSummarySchema = zod_1.z.object({
    id: common_1.idSchema,
    templateId: common_1.idSchema,
    versionNumber: zod_1.z.number().int().positive(),
    status: contractVersionStatusSchema,
    clauseKeys: zod_1.z.array(zod_1.z.string()),
    notes: zod_1.z.string().nullable().optional(),
    createdBy: zod_1.z.string().nullable().optional(),
    createdAt: common_1.requiredStringSchema,
    publishedAt: zod_1.z.string().nullable().optional(),
}).passthrough();
exports.contractVersionDetailSchema = exports.contractVersionSummarySchema.extend({
    clauses: zod_1.z.array(exports.contractClauseLibraryEntrySchema),
});
const clauseDiffEntrySchema = zod_1.z.object({
    clauseKey: common_1.requiredStringSchema,
    title: common_1.requiredStringSchema,
    order: zod_1.z.number().int().nonnegative(),
});
const clauseDiffChangedEntrySchema = zod_1.z.object({
    clauseKey: common_1.requiredStringSchema,
    title: common_1.requiredStringSchema,
    fromOrder: zod_1.z.number().int().nonnegative(),
    toOrder: zod_1.z.number().int().nonnegative(),
    bodyChanged: zod_1.z.boolean(),
});
exports.contractVersionDiffResponseSchema = zod_1.z.object({
    fromVersionId: common_1.idSchema,
    toVersionId: common_1.idSchema,
    added: zod_1.z.array(clauseDiffEntrySchema),
    removed: zod_1.z.array(clauseDiffEntrySchema),
    changed: zod_1.z.array(clauseDiffChangedEntrySchema),
    unchanged: zod_1.z.array(clauseDiffEntrySchema),
});
const assembledDocumentSectionSchema = zod_1.z.object({
    clauseKey: common_1.requiredStringSchema,
    order: zod_1.z.number().int().nonnegative(),
    title: common_1.requiredStringSchema,
    category: exports.clauseCategorySchema,
    text: zod_1.z.string(),
    missingParameters: zod_1.z.array(zod_1.z.string()),
});
exports.assembledContractDocumentResponseSchema = zod_1.z.object({
    bondId: common_1.idSchema,
    templateId: common_1.idSchema,
    versionId: common_1.idSchema,
    versionNumber: zod_1.z.number().int().positive(),
    title: common_1.requiredStringSchema,
    sections: zod_1.z.array(assembledDocumentSectionSchema),
    fullText: zod_1.z.string(),
    generatedAt: common_1.requiredStringSchema,
});
exports.paramsTemplateIdSchema = zod_1.z.object({ id: common_1.idSchema });
exports.paramsVersionIdSchema = zod_1.z.object({ versionId: common_1.idSchema });
exports.paramsBondIdSchema = zod_1.z.object({ bondId: common_1.idSchema });
exports.contractVersionsQuerySchema = zod_1.z.object({}).passthrough();
exports.contractTemplatesQuerySchema = zod_1.z.object({ country: exports.countryCodeSchema.optional() }).passthrough();
exports.contractClausesQuerySchema = zod_1.z.object({ category: exports.clauseCategorySchema.optional() }).passthrough();
exports.contractDocumentQuerySchema = zod_1.z.object({ versionId: zod_1.z.string().optional() }).passthrough();
exports.contractVersionDiffQuerySchema = zod_1.z.object({ from: common_1.idSchema, to: common_1.idSchema }).passthrough();
exports.createContractTemplateRequestSchema = zod_1.z.object({
    key: common_1.requiredStringSchema,
    country: exports.countryCodeSchema,
    name: common_1.requiredStringSchema,
    description: zod_1.z.string().trim().max(2000).optional(),
}).strict();
exports.createContractVersionRequestSchema = zod_1.z.object({
    clauseKeys: zod_1.z.array(common_1.requiredStringSchema).min(1),
    notes: zod_1.z.string().trim().max(2000).optional(),
}).strict();
exports.upsertContractClauseRequestSchema = zod_1.z.object({
    clauseKey: common_1.requiredStringSchema,
    category: exports.clauseCategorySchema,
    title: common_1.requiredStringSchema,
    bodyTemplate: common_1.requiredStringSchema,
    parameters: zod_1.z.array(common_1.requiredStringSchema).optional(),
    locale: zod_1.z.string().trim().min(2).max(5).optional(),
}).strict();
