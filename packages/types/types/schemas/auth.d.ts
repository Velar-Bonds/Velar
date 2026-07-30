import { z } from 'zod';
export declare const perspectiveSchema: z.ZodEnum<{
    usuario: "usuario";
    partido: "partido";
}>;
export declare const loginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strict>;
export declare const registerRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    perspectiva: z.ZodEnum<{
        usuario: "usuario";
        partido: "partido";
    }>;
    nombres: z.ZodOptional<z.ZodString>;
    apellidos: z.ZodOptional<z.ZodString>;
    identificacion: z.ZodOptional<z.ZodString>;
    telefono: z.ZodOptional<z.ZodString>;
    direccion: z.ZodOptional<z.ZodString>;
    nombrePartido: z.ZodOptional<z.ZodString>;
    codigo: z.ZodOptional<z.ZodString>;
    representanteLegal: z.ZodOptional<z.ZodString>;
    cedulaJuridica: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const registerResponseSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<{
        emisor: "emisor";
        comprador: "comprador";
    }>;
    perspectiva: z.ZodEnum<{
        usuario: "usuario";
        partido: "partido";
    }>;
    partyId: z.ZodNullable<z.ZodString>;
    wallet: z.ZodNullable<z.ZodString>;
}, z.core.$loose>;
export declare const loginResponseSchema: z.ZodObject<{
    access_token: z.ZodString;
    refresh_token: z.ZodString;
    expires_in: z.ZodNumber;
    token_type: z.ZodString;
    user: z.ZodUnknown;
}, z.core.$loose>;
export type LoginRequest = z.input<typeof loginRequestSchema>;
export type RegisterRequest = z.input<typeof registerRequestSchema>;
export type RegisterResponse = z.output<typeof registerResponseSchema>;
