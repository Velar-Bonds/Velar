"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsResponseSchema = exports.notificationRowSchema = void 0;
const zod_1 = require("zod");
const notification_1 = require("../notification");
const common_1 = require("./common");
exports.notificationRowSchema = zod_1.z.object({
    id: common_1.idSchema,
    user_id: common_1.idSchema,
    type: zod_1.z.nativeEnum(notification_1.NotificationType),
    payload: zod_1.z.record(zod_1.z.unknown()),
    read: zod_1.z.boolean(),
    created_at: zod_1.z.string(),
}).passthrough();
exports.notificationsResponseSchema = zod_1.z.object({
    notifications: zod_1.z.array(exports.notificationRowSchema),
    unreadCount: zod_1.z.number().int().nonnegative(),
});
