"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escrowStateSchema = exports.escrowOperationSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.escrowOperationSchema = zod_1.z.object({
    transferId: common_1.idSchema,
    bondTokenId: common_1.idSchema,
    seller: common_1.requiredStringSchema,
    buyer: common_1.requiredStringSchema,
    approver: common_1.requiredStringSchema,
    amount: common_1.positiveNumberSchema,
    title: common_1.requiredStringSchema,
}).strict();
exports.escrowStateSchema = zod_1.z.object({
    contractId: zod_1.z.string().optional(),
    status: zod_1.z.enum(['initialized', 'funded', 'approved', 'released', 'refunded', 'disputed']).optional(),
}).passthrough();
