import { z } from 'zod';
export declare const escrowOperationSchema: z.ZodObject<{
    transferId: z.ZodString;
    bondTokenId: z.ZodString;
    seller: z.ZodString;
    buyer: z.ZodString;
    approver: z.ZodString;
    amount: z.ZodNumber;
    title: z.ZodString;
}, "strict", z.ZodTypeAny, {
    bondTokenId: string;
    amount: number;
    title: string;
    transferId: string;
    seller: string;
    buyer: string;
    approver: string;
}, {
    bondTokenId: string;
    amount: number;
    title: string;
    transferId: string;
    seller: string;
    buyer: string;
    approver: string;
}>;
export declare const escrowStateSchema: z.ZodObject<{
    contractId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["initialized", "funded", "approved", "released", "refunded", "disputed"]>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    contractId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["initialized", "funded", "approved", "released", "refunded", "disputed"]>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    contractId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["initialized", "funded", "approved", "released", "refunded", "disputed"]>>;
}, z.ZodTypeAny, "passthrough">>;
