import { z } from 'zod';
export declare const reportStatusSchema: z.ZodEnum<{
    aprobado: "aprobado";
    rechazado: "rechazado";
    enviado: "enviado";
    observado: "observado";
    pendiente_segunda_aprobacion: "pendiente_segunda_aprobacion";
    revisado: "revisado";
}>;
export declare const createReportRequestSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    period_start: z.ZodOptional<z.ZodString>;
    period_end: z.ZodOptional<z.ZodString>;
    bond_token_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
    total_amount: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strict>;
export declare const reviewReportRequestSchema: z.ZodObject<{
    status: z.ZodEnum<{
        aprobado: "aprobado";
        rechazado: "rechazado";
        observado: "observado";
        revisado: "revisado";
    }>;
    notes: z.ZodOptional<z.ZodString>;
    expectedVersion: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export declare const reportRowSchema: z.ZodObject<{
    id: z.ZodString;
    party_id: z.ZodString;
    submitted_by: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    period_start: z.ZodNullable<z.ZodString>;
    period_end: z.ZodNullable<z.ZodString>;
    bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString>>;
    total_amount: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
    status: z.ZodEnum<{
        aprobado: "aprobado";
        rechazado: "rechazado";
        enviado: "enviado";
        observado: "observado";
        pendiente_segunda_aprobacion: "pendiente_segunda_aprobacion";
        revisado: "revisado";
    }>;
    reviewed_by: z.ZodNullable<z.ZodString>;
    reviewed_at: z.ZodNullable<z.ZodString>;
    tse_notes: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$loose>;
export type CreateReportRequest = z.input<typeof createReportRequestSchema>;
export type ReviewReportRequest = z.input<typeof reviewReportRequestSchema>;
export type ReportRow = z.output<typeof reportRowSchema>;
