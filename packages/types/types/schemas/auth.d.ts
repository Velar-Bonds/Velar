import { z } from 'zod';
export declare const perspectiveSchema: z.ZodEnum<["usuario", "partido"]>;
export declare const loginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strict", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const registerRequestSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    perspectiva: z.ZodEnum<["usuario", "partido"]>;
    nombres: z.ZodOptional<z.ZodString>;
    apellidos: z.ZodOptional<z.ZodString>;
    identificacion: z.ZodOptional<z.ZodString>;
    telefono: z.ZodOptional<z.ZodString>;
    direccion: z.ZodOptional<z.ZodString>;
    nombrePartido: z.ZodOptional<z.ZodString>;
    codigo: z.ZodOptional<z.ZodString>;
    representanteLegal: z.ZodOptional<z.ZodString>;
    cedulaJuridica: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    email: string;
    password: string;
    perspectiva: "usuario" | "partido";
    nombres?: string | undefined;
    apellidos?: string | undefined;
    identificacion?: string | undefined;
    telefono?: string | undefined;
    direccion?: string | undefined;
    nombrePartido?: string | undefined;
    codigo?: string | undefined;
    representanteLegal?: string | undefined;
    cedulaJuridica?: string | undefined;
}, {
    email: string;
    password: string;
    perspectiva: "usuario" | "partido";
    nombres?: string | undefined;
    apellidos?: string | undefined;
    identificacion?: string | undefined;
    telefono?: string | undefined;
    direccion?: string | undefined;
    nombrePartido?: string | undefined;
    codigo?: string | undefined;
    representanteLegal?: string | undefined;
    cedulaJuridica?: string | undefined;
}>, {
    email: string;
    password: string;
    perspectiva: "usuario" | "partido";
    nombres?: string | undefined;
    apellidos?: string | undefined;
    identificacion?: string | undefined;
    telefono?: string | undefined;
    direccion?: string | undefined;
    nombrePartido?: string | undefined;
    codigo?: string | undefined;
    representanteLegal?: string | undefined;
    cedulaJuridica?: string | undefined;
}, {
    email: string;
    password: string;
    perspectiva: "usuario" | "partido";
    nombres?: string | undefined;
    apellidos?: string | undefined;
    identificacion?: string | undefined;
    telefono?: string | undefined;
    direccion?: string | undefined;
    nombrePartido?: string | undefined;
    codigo?: string | undefined;
    representanteLegal?: string | undefined;
    cedulaJuridica?: string | undefined;
}>;
export declare const registerResponseSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<["comprador", "emisor"]>;
    perspectiva: z.ZodEnum<["usuario", "partido"]>;
    partyId: z.ZodNullable<z.ZodString>;
    wallet: z.ZodNullable<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<["comprador", "emisor"]>;
    perspectiva: z.ZodEnum<["usuario", "partido"]>;
    partyId: z.ZodNullable<z.ZodString>;
    wallet: z.ZodNullable<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<["comprador", "emisor"]>;
    perspectiva: z.ZodEnum<["usuario", "partido"]>;
    partyId: z.ZodNullable<z.ZodString>;
    wallet: z.ZodNullable<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const loginResponseSchema: z.ZodObject<{
    access_token: z.ZodString;
    refresh_token: z.ZodString;
    expires_in: z.ZodNumber;
    token_type: z.ZodString;
    user: z.ZodUnknown;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    access_token: z.ZodString;
    refresh_token: z.ZodString;
    expires_in: z.ZodNumber;
    token_type: z.ZodString;
    user: z.ZodUnknown;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    access_token: z.ZodString;
    refresh_token: z.ZodString;
    expires_in: z.ZodNumber;
    token_type: z.ZodString;
    user: z.ZodUnknown;
}, z.ZodTypeAny, "passthrough">>;
export type LoginRequest = z.input<typeof loginRequestSchema>;
export type RegisterRequest = z.input<typeof registerRequestSchema>;
export type RegisterResponse = z.output<typeof registerResponseSchema>;
