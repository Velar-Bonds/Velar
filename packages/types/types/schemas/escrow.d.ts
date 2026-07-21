import { z } from 'zod';
export declare const escrowOperationSchema: z.ZodObject<{
    transferId: z.ZodString;
    bondTokenId: z.ZodString;
    seller: z.ZodString;
    buyer: z.ZodString;
    approver: z.ZodString;
    amount: z.ZodCoercedNumber<unknown>;
    title: z.ZodString;
}, z.core.$strict>;
export declare const escrowStateSchema: z.ZodObject<{
    contractId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        initialized: "initialized";
        funded: "funded";
        approved: "approved";
        released: "released";
        refunded: "refunded";
        disputed: "disputed";
    }>>;
}, z.core.$loose>;
