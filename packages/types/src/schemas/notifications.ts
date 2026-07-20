import { z } from 'zod';
import { NotificationType } from '../notification';
import { idSchema } from './common';

export const notificationRowSchema = z.object({
  id: idSchema,
  user_id: idSchema,
  type: z.nativeEnum(NotificationType),
  payload: z.record(z.unknown()),
  read: z.boolean(),
  created_at: z.string(),
}).passthrough();

export const notificationsResponseSchema = z.object({
  notifications: z.array(notificationRowSchema),
  unreadCount: z.number().int().nonnegative(),
});
