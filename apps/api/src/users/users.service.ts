import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { Role } from '@velar/types';

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  async getProfile(userId: string) {
    const { data } = await this.supabase.admin
      .from('profiles').select('*, parties(*)').eq('id', userId).single();
    return data;
  }

  async updateProfile(userId: string, updates: { full_name?: string; stellar_wallet?: string }) {
    const { data, error } = await this.supabase.admin
      .from('profiles').update(updates).eq('id', userId).select().single();
    if (error) throw new BadRequestException(error.message);
    return data;
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
    const allowed: Role[] = ['comprador', 'recomprador', 'tse', 'admin'];
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
