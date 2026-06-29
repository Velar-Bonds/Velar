import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { WalletService } from '../escrow/wallet.service';
import { Role } from '@velar/types';

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

  async listUsers(actorRole: Role) {
    if (!['tse', 'admin'].includes(actorRole)) throw new ForbiddenException('Admin only');
    const { data } = await this.supabase.admin
      .from('profiles').select('*, parties(*)').order('created_at', { ascending: false });
    return data ?? [];
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

  async setRole(targetId: string, role: Role, actorRole: Role) {
    if (actorRole !== 'admin') throw new ForbiddenException('Admin only');
    const { data, error } = await this.supabase.admin
      .from('profiles').update({ role }).eq('id', targetId).select().single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
