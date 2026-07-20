import { z } from 'zod';
export declare const reportStatusSchema: z.ZodEnum<["enviado", "revisado", "observado", "aprobado"]>;
export declare const createReportRequestSchema: z.ZodEffects<z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    period_start: z.ZodOptional<z.ZodString>;
    period_end: z.ZodOptional<z.ZodString>;
    bond_token_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    total_amount: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    title: string;
    description: string;
    period_start?: string | undefined;
    period_end?: string | undefined;
    bond_token_ids?: string[] | undefined;
    total_amount?: number | undefined;
}, {
    title: string;
    description: string;
    period_start?: string | undefined;
    period_end?: string | undefined;
    bond_token_ids?: string[] | undefined;
    total_amount?: number | undefined;
}>, {
    title: string;
    description: string;
    period_start?: string | undefined;
    period_end?: string | undefined;
    bond_token_ids?: string[] | undefined;
    total_amount?: number | undefined;
}, {
    title: string;
    description: string;
    period_start?: string | undefined;
    period_end?: string | undefined;
    bond_token_ids?: string[] | undefined;
    total_amount?: number | undefined;
}>;
export declare const reviewReportRequestSchema: z.ZodObject<{
    status: z.ZodEnum<["revisado", "observado", "aprobado"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    status: "aprobado" | "revisado" | "observado";
    notes?: string | undefined;
}, {
    status: "aprobado" | "revisado" | "observado";
    notes?: string | undefined;
}>;
export declare const reportRowSchema: z.ZodObject<{
    id: z.ZodString;
    party_id: z.ZodString;
    submitted_by: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    period_start: z.ZodNullable<z.ZodString>;
    period_end: z.ZodNullable<z.ZodString>;
    bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
    total_amount: z.ZodNullable<z.ZodNumber>;
    status: z.ZodEnum<["enviado", "revisado", "observado", "aprobado"]>;
    reviewed_by: z.ZodNullable<z.ZodString>;
    reviewed_at: z.ZodNullable<z.ZodString>;
    tse_notes: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    party_id: z.ZodString;
    submitted_by: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    period_start: z.ZodNullable<z.ZodString>;
    period_end: z.ZodNullable<z.ZodString>;
    bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
    total_amount: z.ZodNullable<z.ZodNumber>;
    status: z.ZodEnum<["enviado", "revisado", "observado", "aprobado"]>;
    reviewed_by: z.ZodNullable<z.ZodString>;
    reviewed_at: z.ZodNullable<z.ZodString>;
    tse_notes: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    party_id: z.ZodString;
    submitted_by: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    period_start: z.ZodNullable<z.ZodString>;
    period_end: z.ZodNullable<z.ZodString>;
    bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
    total_amount: z.ZodNullable<z.ZodNumber>;
    status: z.ZodEnum<["enviado", "revisado", "observado", "aprobado"]>;
    reviewed_by: z.ZodNullable<z.ZodString>;
    reviewed_at: z.ZodNullable<z.ZodString>;
    tse_notes: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export type CreateReportRequest = z.input<typeof createReportRequestSchema>;
export type ReportRow = z.output<typeof reportRowSchema>;
