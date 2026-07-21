import { z } from 'zod';
export declare const requiredStringSchema: z.ZodString;
export declare const idSchema: z.ZodString;
export declare const isoDateSchema: z.ZodString;
export declare const optionalIsoDateSchema: z.ZodOptional<z.ZodString>;
export declare const positiveNumberSchema: z.ZodCoercedNumber<unknown>;
export declare const paymentMethodSchema: z.ZodEnum<{
    sinpe: "sinpe";
    transferencia: "transferencia";
    wallet: "wallet";
}>;
export declare const roleSchema: z.ZodEnum<{
    readonly TSE: "tse";
    readonly EMISOR: "emisor";
    readonly COMPRADOR: "comprador";
    readonly RECOMPRADOR: "recomprador";
    readonly VALIDADOR: "validador";
    readonly ADMIN: "admin";
}>;
export declare const paramsIdSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const paramsTokenIdSchema: z.ZodObject<{
    tokenId: z.ZodString;
}, z.core.$strip>;
export declare const paramsBondTokenIdSchema: z.ZodObject<{
    bondTokenId: z.ZodString;
}, z.core.$strip>;
export declare const emptyObjectSchema: z.ZodObject<{}, z.core.$strict>;
export declare const okSchema: z.ZodObject<{
    ok: z.ZodLiteral<true>;
}, z.core.$loose>;
export declare const successSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
}, z.core.$loose>;
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$loose>;
export declare function paginatedSchema<T extends z.ZodTypeAny>(item: T): z.ZodObject<{
    data: z.ZodArray<T>;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
}, z.core.$strip>;
