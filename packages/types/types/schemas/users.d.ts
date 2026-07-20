import { z } from 'zod';
export declare const updateProfileRequestSchema: z.ZodEffects<z.ZodObject<{
    full_name: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    full_name?: string | undefined;
}, {
    full_name?: string | undefined;
}>, {
    full_name?: string | undefined;
}, {
    full_name?: string | undefined;
}>;
export declare const updateWalletRequestSchema: z.ZodObject<{
    publicKey: z.ZodString;
}, "strict", z.ZodTypeAny, {
    publicKey: string;
}, {
    publicKey: string;
}>;
export declare const setRoleRequestSchema: z.ZodObject<{
    role: z.ZodNativeEnum<{
        readonly TSE: "tse";
        readonly EMISOR: "emisor";
        readonly COMPRADOR: "comprador";
        readonly RECOMPRADOR: "recomprador";
        readonly VALIDADOR: "validador";
        readonly ADMIN: "admin";
    }>;
}, "strict", z.ZodTypeAny, {
    role: "tse" | "emisor" | "comprador" | "recomprador" | "validador" | "admin";
}, {
    role: "tse" | "emisor" | "comprador" | "recomprador" | "validador" | "admin";
}>;
export declare const profileRowSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    full_name: z.ZodNullable<z.ZodString>;
    role: z.ZodNativeEnum<{
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
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    email: z.ZodString;
    full_name: z.ZodNullable<z.ZodString>;
    role: z.ZodNativeEnum<{
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
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    email: z.ZodString;
    full_name: z.ZodNullable<z.ZodString>;
    role: z.ZodNativeEnum<{
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
}, z.ZodTypeAny, "passthrough">>;
export declare const recipientRowSchema: z.ZodObject<{
    id: z.ZodString;
    full_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    role: z.ZodNativeEnum<{
        readonly TSE: "tse";
        readonly EMISOR: "emisor";
        readonly COMPRADOR: "comprador";
        readonly RECOMPRADOR: "recomprador";
        readonly VALIDADOR: "validador";
        readonly ADMIN: "admin";
    }>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    full_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    role: z.ZodNativeEnum<{
        readonly TSE: "tse";
        readonly EMISOR: "emisor";
        readonly COMPRADOR: "comprador";
        readonly RECOMPRADOR: "recomprador";
        readonly VALIDADOR: "validador";
        readonly ADMIN: "admin";
    }>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    full_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    role: z.ZodNativeEnum<{
        readonly TSE: "tse";
        readonly EMISOR: "emisor";
        readonly COMPRADOR: "comprador";
        readonly RECOMPRADOR: "recomprador";
        readonly VALIDADOR: "validador";
        readonly ADMIN: "admin";
    }>;
}, z.ZodTypeAny, "passthrough">>;
export declare const walletResponseSchema: z.ZodObject<{
    ok: z.ZodLiteral<true>;
    stellar_public_key: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    ok: z.ZodLiteral<true>;
    stellar_public_key: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    ok: z.ZodLiteral<true>;
    stellar_public_key: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
