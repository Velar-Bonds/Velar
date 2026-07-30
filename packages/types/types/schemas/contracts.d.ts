import { z } from 'zod';
/**
 * Zod schemas for the contract intelligence & document assembly engine
 * (issue #38): `GET /bonds/:tokenId/summary` and the `/contracts/...` template,
 * version, clause-library, diff and document-assembly endpoints. Registered in
 * `apiContracts` (`../contracts.ts`) per the shared-contract convention (#43).
 */
export declare const clauseCategorySchema: z.ZodEnum<{
    transferencia: "transferencia";
    otro: "otro";
    partes: "partes";
    objeto: "objeto";
    pago: "pago";
    garantia: "garantia";
    plazo: "plazo";
    incumplimiento: "incumplimiento";
    jurisdiccion: "jurisdiccion";
    firmas: "firmas";
}>;
export declare const countryCodeSchema: z.ZodEnum<{
    CR: "CR";
    CO: "CO";
    BR: "BR";
    AR: "AR";
}>;
export declare const contractSummaryResponseSchema: z.ZodObject<{
    bondId: z.ZodString;
    contractId: z.ZodString;
    title: z.ZodString;
    version: z.ZodString;
    clauses: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        title: z.ZodString;
        category: z.ZodEnum<{
            transferencia: "transferencia";
            otro: "otro";
            partes: "partes";
            objeto: "objeto";
            pago: "pago";
            garantia: "garantia";
            plazo: "plazo";
            incumplimiento: "incumplimiento";
            jurisdiccion: "jurisdiccion";
            firmas: "firmas";
        }>;
        legalText: z.ZodString;
        references: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$loose>>;
    generatedAt: z.ZodString;
    country: z.ZodEnum<{
        CR: "CR";
        CO: "CO";
        BR: "BR";
        AR: "AR";
    }>;
    amount: z.ZodObject<{
        value: z.ZodNullable<z.ZodNumber>;
        currency: z.ZodNullable<z.ZodString>;
        unknown: z.ZodBoolean;
    }, z.core.$strip>;
    conditions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        description: z.ZodString;
        sourceClauseId: z.ZodString;
    }, z.core.$strip>>;
    obligations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        role: z.ZodEnum<{
            tse: "tse";
            comprador: "comprador";
            vendedor: "vendedor";
        }>;
        description: z.ZodString;
        sourceClauseId: z.ZodString;
    }, z.core.$strip>>;
    keyDates: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodEnum<{
            issue_date: "issue_date";
            maturity_date: "maturity_date";
            transfer_requested: "transfer_requested";
            transfer_last_update: "transfer_last_update";
            released: "released";
            version_published: "version_published";
        }>;
        label: z.ZodString;
        date: z.ZodNullable<z.ZodString>;
        unknown: z.ZodBoolean;
    }, z.core.$strip>>;
    status: z.ZodEnum<{
        readonly BORRADOR: "borrador";
        readonly VIGENTE: "vigente";
        readonly EN_NEGOCIACION: "en_negociacion";
        readonly EN_ESCROW: "en_escrow";
        readonly LIBERADO: "liberado";
        readonly CANCELADO: "cancelado";
        readonly CONGELADO: "congelado";
    }>;
    attentionFlags: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        severity: z.ZodEnum<{
            info: "info";
            warning: "warning";
            critical: "critical";
        }>;
        kind: z.ZodString;
        message: z.ZodString;
        sourceClauseId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$loose>;
export declare const contractClauseLibraryEntrySchema: z.ZodObject<{
    id: z.ZodString;
    clauseKey: z.ZodString;
    category: z.ZodEnum<{
        transferencia: "transferencia";
        otro: "otro";
        partes: "partes";
        objeto: "objeto";
        pago: "pago";
        garantia: "garantia";
        plazo: "plazo";
        incumplimiento: "incumplimiento";
        jurisdiccion: "jurisdiccion";
        firmas: "firmas";
    }>;
    title: z.ZodString;
    bodyTemplate: z.ZodString;
    parameters: z.ZodArray<z.ZodString>;
    locale: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$loose>;
export declare const contractTemplateSchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    country: z.ZodEnum<{
        CR: "CR";
        CO: "CO";
        BR: "BR";
        AR: "AR";
    }>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$loose>;
export declare const contractVersionSummarySchema: z.ZodObject<{
    id: z.ZodString;
    templateId: z.ZodString;
    versionNumber: z.ZodNumber;
    status: z.ZodEnum<{
        draft: "draft";
        published: "published";
        archived: "archived";
    }>;
    clauseKeys: z.ZodArray<z.ZodString>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdBy: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    publishedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$loose>;
export declare const contractVersionDetailSchema: z.ZodObject<{
    id: z.ZodString;
    templateId: z.ZodString;
    versionNumber: z.ZodNumber;
    status: z.ZodEnum<{
        draft: "draft";
        published: "published";
        archived: "archived";
    }>;
    clauseKeys: z.ZodArray<z.ZodString>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdBy: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    publishedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    clauses: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        clauseKey: z.ZodString;
        category: z.ZodEnum<{
            transferencia: "transferencia";
            otro: "otro";
            partes: "partes";
            objeto: "objeto";
            pago: "pago";
            garantia: "garantia";
            plazo: "plazo";
            incumplimiento: "incumplimiento";
            jurisdiccion: "jurisdiccion";
            firmas: "firmas";
        }>;
        title: z.ZodString;
        bodyTemplate: z.ZodString;
        parameters: z.ZodArray<z.ZodString>;
        locale: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, z.core.$loose>>;
}, z.core.$loose>;
export declare const contractVersionDiffResponseSchema: z.ZodObject<{
    fromVersionId: z.ZodString;
    toVersionId: z.ZodString;
    added: z.ZodArray<z.ZodObject<{
        clauseKey: z.ZodString;
        title: z.ZodString;
        order: z.ZodNumber;
    }, z.core.$strip>>;
    removed: z.ZodArray<z.ZodObject<{
        clauseKey: z.ZodString;
        title: z.ZodString;
        order: z.ZodNumber;
    }, z.core.$strip>>;
    changed: z.ZodArray<z.ZodObject<{
        clauseKey: z.ZodString;
        title: z.ZodString;
        fromOrder: z.ZodNumber;
        toOrder: z.ZodNumber;
        bodyChanged: z.ZodBoolean;
    }, z.core.$strip>>;
    unchanged: z.ZodArray<z.ZodObject<{
        clauseKey: z.ZodString;
        title: z.ZodString;
        order: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const assembledContractDocumentResponseSchema: z.ZodObject<{
    bondId: z.ZodString;
    templateId: z.ZodString;
    versionId: z.ZodString;
    versionNumber: z.ZodNumber;
    title: z.ZodString;
    sections: z.ZodArray<z.ZodObject<{
        clauseKey: z.ZodString;
        order: z.ZodNumber;
        title: z.ZodString;
        category: z.ZodEnum<{
            transferencia: "transferencia";
            otro: "otro";
            partes: "partes";
            objeto: "objeto";
            pago: "pago";
            garantia: "garantia";
            plazo: "plazo";
            incumplimiento: "incumplimiento";
            jurisdiccion: "jurisdiccion";
            firmas: "firmas";
        }>;
        text: z.ZodString;
        missingParameters: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    fullText: z.ZodString;
    generatedAt: z.ZodString;
}, z.core.$strip>;
export declare const paramsTemplateIdSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const paramsVersionIdSchema: z.ZodObject<{
    versionId: z.ZodString;
}, z.core.$strip>;
export declare const paramsBondIdSchema: z.ZodObject<{
    bondId: z.ZodString;
}, z.core.$strip>;
export declare const contractVersionsQuerySchema: z.ZodObject<{}, z.core.$loose>;
export declare const contractTemplatesQuerySchema: z.ZodObject<{
    country: z.ZodOptional<z.ZodEnum<{
        CR: "CR";
        CO: "CO";
        BR: "BR";
        AR: "AR";
    }>>;
}, z.core.$loose>;
export declare const contractClausesQuerySchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodEnum<{
        transferencia: "transferencia";
        otro: "otro";
        partes: "partes";
        objeto: "objeto";
        pago: "pago";
        garantia: "garantia";
        plazo: "plazo";
        incumplimiento: "incumplimiento";
        jurisdiccion: "jurisdiccion";
        firmas: "firmas";
    }>>;
}, z.core.$loose>;
export declare const contractDocumentQuerySchema: z.ZodObject<{
    versionId: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const contractVersionDiffQuerySchema: z.ZodObject<{
    from: z.ZodString;
    to: z.ZodString;
}, z.core.$loose>;
export declare const createContractTemplateRequestSchema: z.ZodObject<{
    key: z.ZodString;
    country: z.ZodEnum<{
        CR: "CR";
        CO: "CO";
        BR: "BR";
        AR: "AR";
    }>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const createContractVersionRequestSchema: z.ZodObject<{
    clauseKeys: z.ZodArray<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const upsertContractClauseRequestSchema: z.ZodObject<{
    clauseKey: z.ZodString;
    category: z.ZodEnum<{
        transferencia: "transferencia";
        otro: "otro";
        partes: "partes";
        objeto: "objeto";
        pago: "pago";
        garantia: "garantia";
        plazo: "plazo";
        incumplimiento: "incumplimiento";
        jurisdiccion: "jurisdiccion";
        firmas: "firmas";
    }>;
    title: z.ZodString;
    bodyTemplate: z.ZodString;
    parameters: z.ZodOptional<z.ZodArray<z.ZodString>>;
    locale: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type CreateContractTemplateRequest = z.input<typeof createContractTemplateRequestSchema>;
export type CreateContractVersionRequest = z.input<typeof createContractVersionRequestSchema>;
export type UpsertContractClauseRequest = z.input<typeof upsertContractClauseRequestSchema>;
