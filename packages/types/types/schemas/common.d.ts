import { z } from 'zod';
export declare const requiredStringSchema: z.ZodString;
export declare const idSchema: z.ZodString;
export declare const isoDateSchema: z.ZodString;
export declare const optionalIsoDateSchema: z.ZodOptional<z.ZodString>;
export declare const positiveNumberSchema: z.ZodNumber;
export declare const paymentMethodSchema: z.ZodEnum<["sinpe", "transferencia", "wallet"]>;
export declare const roleSchema: z.ZodNativeEnum<{
    readonly TSE: "tse";
    readonly EMISOR: "emisor";
    readonly COMPRADOR: "comprador";
    readonly RECOMPRADOR: "recomprador";
    readonly VALIDADOR: "validador";
    readonly ADMIN: "admin";
}>;
export declare const paramsIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const paramsTokenIdSchema: z.ZodObject<{
    tokenId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tokenId: string;
}, {
    tokenId: string;
}>;
export declare const paramsBondTokenIdSchema: z.ZodObject<{
    bondTokenId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    bondTokenId: string;
}, {
    bondTokenId: string;
}>;
export declare const emptyObjectSchema: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
export declare const okSchema: z.ZodObject<{
    ok: z.ZodLiteral<true>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    ok: z.ZodLiteral<true>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    ok: z.ZodLiteral<true>;
}, z.ZodTypeAny, "passthrough">>;
export declare const successSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    success: z.ZodLiteral<true>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    success: z.ZodLiteral<true>;
}, z.ZodTypeAny, "passthrough">>;
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export declare function paginatedSchema<T extends z.ZodTypeAny>(item: T): z.ZodObject<{
    data: z.ZodArray<T, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    data: T["_output"][];
    total: number;
}, {
    page: number;
    limit: number;
    data: T["_input"][];
    total: number;
}>;
