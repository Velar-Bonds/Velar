import { z } from 'zod';
export declare const updateProfileRequestSchema: z.ZodObject<{
    full_name: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const updateWalletRequestSchema: z.ZodObject<{
    publicKey: z.ZodString;
}, z.core.$strict>;
export declare const setRoleRequestSchema: z.ZodObject<{
    role: z.ZodEnum<{
        readonly TSE: "tse";
        readonly EMISOR: "emisor";
        readonly COMPRADOR: "comprador";
        readonly RECOMPRADOR: "recomprador";
        readonly VALIDADOR: "validador";
        readonly ADMIN: "admin";
    }>;
}, z.core.$strict>;
export declare const profileRowSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    full_name: z.ZodNullable<z.ZodString>;
    role: z.ZodEnum<{
        readonly TSE: "tse";
        readonly EMISOR: "emisor";
        readonly COMPRADOR: "comprador";
        readonly RECOMPRADOR: "recomprador";
        readonly VALIDADOR: "validador";
        readonly ADMIN: "admin";
    }>;
    party_id: z.ZodNullable<z.ZodString>;
    stellar_wallet: z.ZodNullable<z.ZodString>;
    stellar_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    country: z.ZodOptional<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$loose>;
export declare const recipientRowSchema: z.ZodObject<{
    id: z.ZodString;
    full_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    role: z.ZodEnum<{
        readonly TSE: "tse";
        readonly EMISOR: "emisor";
        readonly COMPRADOR: "comprador";
        readonly RECOMPRADOR: "recomprador";
        readonly VALIDADOR: "validador";
        readonly ADMIN: "admin";
    }>;
}, z.core.$loose>;
export declare const walletResponseSchema: z.ZodObject<{
    ok: z.ZodLiteral<true>;
    stellar_public_key: z.ZodString;
}, z.core.$loose>;
