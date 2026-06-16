import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { NotificationType } from '@velar/types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private supabase: SupabaseService) {}

  /**
   * Crea una notificación para un usuario. NUNCA lanza: si falla, solo loguea,
   * para no romper el flujo de negocio que la dispara (igual que AuditService.emit).
   */
  async emit(userId: string, type: NotificationType, payload: Record<string, unknown> = {}) {
    if (!userId) return;
    try {
      await this.supabase.admin.from('notifications').insert({
        user_id: userId,
        type,
        payload,
      });
    } catch (e) {
      this.logger.warn(`emit notification falló: ${(e as Error).message}`);
    }
  }

  /** Últimas notificaciones del usuario + conteo de no leídas. */
  async list(userId: string, limit = 20) {
    const [{ data }, { count }] = await Promise.all([
      this.supabase.admin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
      this.supabase.admin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false),
    ]);
    return { notifications: data ?? [], unreadCount: count ?? 0 };
  }

  /** Marca una notificación como leída (solo si pertenece al usuario). */
  async markRead(id: string, userId: string) {
    await this.supabase.admin
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId);
    return { ok: true };
  }

  /** Marca todas las notificaciones del usuario como leídas. */
  async markAllRead(userId: string) {
    await this.supabase.admin
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    return { ok: true };
  }
}
