import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { WalletService } from '../escrow/wallet.service';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, Role } from '@velar/types';
import { WalletReconciliationService } from './wallet-reconciliation.service';
import { paginatedResponse, parsePagination } from '../common/pagination';

/**
 * Desactivar = banear en Supabase Auth por un plazo efectivamente infinito
 * (100 años). Se usa el primitivo de Auth en vez de una columna nueva porque
 * bloquea el login en el propio emisor del token: sin esto habría que acordarse
 * de chequear la bandera en cada camino de autenticación.
 */
const DEACTIVATED_BAN_DURATION = '876000h';
const ACTIVE_BAN_DURATION = 'none';

type ProfileRow = {
  id: string;
  email?: string | null;
  stellar_wallet?: string | null;
};

@Injectable()
export class UsersService {
  constructor(
    private supabase: SupabaseService,
    private wallets: WalletService,
    private audit: AuditService,
    private reconciliation: WalletReconciliationService,
  ) {}

  async getProfile(userId: string) {
    const { data } = await this.supabase.admin
      .from('profiles').select('*, parties(*)').eq('id', userId).single();
    if (!data || data.stellar_wallet) return data;
    return this.ensureProfileWallet(data);
  }

  private async ensureProfileWallet(profile: ProfileRow) {
    try {
      const wallet = await this.wallets.createWalletRecord(profile.email ?? profile.id);
      const patch = {
        stellar_wallet: wallet.publicKey,
        stellar_wallet_status: wallet.status,
        stellar_network: wallet.network,
        stellar_created_at: new Date().toISOString(),
        stellar_wallet_error: wallet.error ?? null,
      };
      const { data, error } = await this.supabase.admin
        .from('profiles').update(patch).eq('id', profile.id).select('*, parties(*)').single();
      if (error) {
        const fallback = { stellar_wallet: wallet.publicKey };
        const { data: fallbackData } = await this.supabase.admin
          .from('profiles').update(fallback).eq('id', profile.id).select('*, parties(*)').single();
        return fallbackData ?? { ...profile, ...fallback };
      }
      return data;
    } catch {
      return profile;
    }
  }

  async updateProfile(userId: string, updates: { full_name?: string }) {
    const { data, error } = await this.supabase.admin
      .from('profiles').update({ full_name: updates.full_name }).eq('id', userId).select().single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /**
   * Vincula la wallet self-custody (Freighter) del usuario a su perfil.
   * No toca `stellar_wallet` (custodia asistida): es una columna aparte.
   * Si la migración con `stellar_public_key` aún no se aplicó, falla con un
   * mensaje claro en vez de romper (el flujo custodial sigue intacto).
   */
  async setSelfCustodyWallet(userId: string, publicKey: string) {
    if (!/^G[A-Z2-7]{55}$/.test(publicKey)) {
      throw new BadRequestException('Llave pública de Stellar inválida');
    }
    const { data, error } = await this.supabase.admin
      .from('profiles')
      .update({ stellar_public_key: publicKey })
      .eq('id', userId)
      .select('id, stellar_public_key')
      .single();
    if (error) {
      if (/column|schema cache/i.test(error.message)) {
        throw new BadRequestException(
          'Falta aplicar la migración self_custody_wallet (supabase db push) para vincular wallets propias.',
        );
      }
      throw new BadRequestException(error.message);
    }
    return { ok: true, stellar_public_key: (data as { stellar_public_key?: string })?.stellar_public_key ?? publicKey };
  }

  /**
   * Directorio de usuarios paginado, con filtro por rol y búsqueda por
   * nombre/email. Reusa parsePagination/paginatedResponse (mismo patrón que
   * BondsService.findAll y AuditService.getRecentEvents).
   */
  async listUsers(actorRole: Role, page?: string, limit?: string, role?: Role, search?: string) {
    if (!['tse', 'admin'].includes(actorRole)) throw new ForbiddenException('Admin only');
    const { page: p, limit: l, from, to } = parsePagination(page, limit);
    let q = this.supabase.admin
      .from('profiles')
      .select('*, parties(*)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (role) q = q.eq('role', role);
    if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, count, error } = await q.range(from, to);
    if (error) throw new BadRequestException(error.message);
    return paginatedResponse(data ?? [], count ?? 0, p, l);
  }

  /**
   * Lista de usuarios a los que se puede transferir un bono (destinatarios).
   * Devuelve compradores y recompradores, excluyendo al propio usuario.
   * Accesible a dueños (comprador/recomprador) y a tse/admin.
   * Desbloquea que el frontend use un <select> en vez de pedir UUIDs a mano.
   */
  async listRecipients(actorId: string, actorRole: Role) {
    const allowed: Role[] = ['comprador', 'recomprador', 'emisor', 'tse', 'admin'];
    if (!allowed.includes(actorRole)) {
      throw new ForbiddenException('No autorizado para listar destinatarios');
    }
    const { data, error } = await this.supabase.admin
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['comprador', 'recomprador'])
      .neq('id', actorId)
      .order('full_name', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async setRole(targetId: string, role: Role, actorRole: Role, actorId?: string) {
    if (actorRole !== 'admin') throw new ForbiddenException('Admin only');
    const { data, error } = await this.supabase.admin
      .from('profiles').update({ role }).eq('id', targetId).select().single();
    if (error) throw new BadRequestException(error.message);
    await this.audit.emit({
      type: AuditEventType.USER_ROLE_CHANGED,
      actorId: actorId ?? targetId,
      payload: { targetUserId: targetId, newRole: role },
    });
    return data;
  }

  /**
   * Asigna un rol a varios usuarios en una sola llamada. Misma regla de
   * autorización que setRole (admin only); cada actualización exitosa se
   * audita individualmente. Los ids que fallan se omiten en vez de abortar
   * el lote completo.
   */
  async bulkSetRole(userIds: string[], role: Role, actorRole: Role, actorId: string) {
    if (actorRole !== 'admin') throw new ForbiddenException('Admin only');
    const updated: string[] = [];
    for (const targetId of userIds) {
      const { error } = await this.supabase.admin
        .from('profiles').update({ role }).eq('id', targetId).select().single();
      if (error) continue;
      updated.push(targetId);
      await this.audit.emit({
        type: AuditEventType.USER_ROLE_CHANGED,
        actorId,
        payload: { targetUserId: targetId, newRole: role },
      });
    }
    return { ok: true as const, updated };
  }

  /** Trazabilidad de auditoría de un usuario: cambios de rol y (des)activación. */
  async getUserAuditTrail(targetId: string, actorRole: Role) {
    if (!['tse', 'admin'].includes(actorRole)) throw new ForbiddenException('TSE/Admin only');
    return this.audit.getUserAuditTrail(targetId);
  }

  /* ─── Ciclo de vida de la cuenta (issue #77) ─────────────────────────────── */

  /** Desactiva una cuenta: bloquea el login hasta que un admin la reactive. */
  async deactivate(targetId: string, actorRole: Role, actorId: string) {
    return this.setAccountActive(targetId, false, actorRole, actorId);
  }

  /** Reactiva una cuenta previamente desactivada. */
  async reactivate(targetId: string, actorRole: Role, actorId: string) {
    return this.setAccountActive(targetId, true, actorRole, actorId);
  }

  /**
   * Mismo criterio de autorización que `setRole`: solo `admin`. Se auditan las
   * dos direcciones, con el admin como actor y la cuenta afectada en el payload.
   */
  private async setAccountActive(
    targetId: string,
    active: boolean,
    actorRole: Role,
    actorId: string,
  ) {
    if (actorRole !== 'admin') throw new ForbiddenException('Admin only');
    if (targetId === actorId) {
      throw new BadRequestException('No podés desactivar tu propia cuenta');
    }

    const { error } = await this.supabase.admin.auth.admin.updateUserById(targetId, {
      ban_duration: active ? ACTIVE_BAN_DURATION : DEACTIVATED_BAN_DURATION,
    });
    if (error) throw new BadRequestException(error.message);

    await this.audit.emit({
      type: active
        ? AuditEventType.AUTH_ACCOUNT_REACTIVATED
        : AuditEventType.AUTH_ACCOUNT_DEACTIVATED,
      actorId,
      payload: { targetUserId: targetId },
    });

    return { ok: true as const, userId: targetId, active };
  }

  /** Reintenta la wallet custodial fallida de un usuario. Solo admin. */
  async retryWallet(targetId: string, actorRole: Role, actorId: string) {
    if (actorRole !== 'admin') throw new ForbiddenException('Admin only');

    const { data: before, error: loadError } = await this.supabase.admin
      .from('profiles')
      .select('stellar_wallet_status')
      .eq('id', targetId)
      .maybeSingle();
    if (loadError || !before) throw new BadRequestException('Usuario no encontrado');

    const result = await this.reconciliation.retryProfile(targetId, actorId);

    await this.audit.emit({
      type: AuditEventType.WALLET_RETRY_REQUESTED,
      actorId,
      payload: {
        targetUserId: targetId,
        previousStatus: before.stellar_wallet_status ?? null,
        newStatus: result.stellar_wallet_status,
        ...(result.stellar_wallet ? { publicKey: result.stellar_wallet } : {}),
        ...(result.stellar_wallet_error ? { error: result.stellar_wallet_error } : {}),
      },
    });

    return {
      ok: true as const,
      stellar_wallet: result.stellar_wallet,
      stellar_wallet_status: result.stellar_wallet_status,
      stellar_wallet_error: result.stellar_wallet_error,
      stellar_network: result.stellar_network,
      stellar_wallet_retry_count: result.stellar_wallet_retry_count,
      stellar_wallet_last_retry_at: result.stellar_wallet_last_retry_at,
    };
  }
}
