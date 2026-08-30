import { z } from 'zod';
/** GET /users — paginación + filtros por rol y búsqueda (nombre/email). */
export declare const usersQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    role: z.ZodOptional<z.ZodEnum<{
        readonly TSE: "tse";
        readonly EMISOR: "emisor";
        readonly COMPRADOR: "comprador";
        readonly RECOMPRADOR: "recomprador";
        readonly VALIDADOR: "validador";
        readonly ADMIN: "admin";
    }>>;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
/** Asignación de rol en lote — solo admin. */
export declare const bulkSetRoleRequestSchema: z.ZodObject<{
    userIds: z.ZodArray<z.ZodString>;
    role: z.ZodEnum<{
        readonly TSE: "tse";
        readonly EMISOR: "emisor";
        readonly COMPRADOR: "comprador";
        readonly RECOMPRADOR: "recomprador";
        readonly VALIDADOR: "validador";
        readonly ADMIN: "admin";
    }>;
}, z.core.$strict>;
export declare const bulkSetRoleResponseSchema: z.ZodObject<{
    ok: z.ZodLiteral<true>;
    updated: z.ZodArray<z.ZodString>;
}, z.core.$loose>;
/** Eventos mostrados en la trazabilidad de administración por usuario. */
export declare const userAuditEventSchema: z.ZodObject<{
    id: z.ZodString;
    bondTokenId: z.ZodNullable<z.ZodString>;
    transferId: z.ZodNullable<z.ZodString>;
    type: z.ZodString;
    actorId: z.ZodNullable<z.ZodString>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    txHash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
}, z.core.$loose>;
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
    stellar_wallet_status: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_wallet_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_network: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_created_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_wallet_retry_count: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    stellar_wallet_last_retry_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
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
/** POST /users/:id/wallet/retry — Express may send `{}`; do not use z.undefined(). */
export declare const retryWalletRequestSchema: z.ZodObject<{}, z.core.$strict>;
export declare const retryWalletResponseSchema: z.ZodObject<{
    ok: z.ZodLiteral<true>;
    stellar_wallet: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_wallet_status: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_wallet_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_network: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stellar_wallet_retry_count: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    stellar_wallet_last_retry_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$loose>;
