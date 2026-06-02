import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditEventType, BondSearchQuery } from '@velar/types';

@Injectable()
export class AuditService {
  constructor(private supabase: SupabaseService) {}

  async emit(event: {
    type: AuditEventType;
    bondTokenId?: string;
    transferId?: string;
    actorId?: string;
    payload?: Record<string, unknown>;
    txHash?: string;
  }) {
    await this.supabase.admin.from('audit_events').insert({
      type: event.type,
      bond_token_id: event.bondTokenId ?? null,
      transfer_id: event.transferId ?? null,
      actor_id: event.actorId ?? null,
      payload: event.payload ?? {},
      tx_hash: event.txHash ?? null,
    });
  }

  async getBondTimeline(tokenId: string) {
    const { data: bond, error: bondErr } = await this.supabase.admin
      .from('bonds')
      .select('*, parties(*), profiles!bonds_current_owner_fkey(*)')
      .eq('token_id', tokenId)
      .single();
    if (bondErr) throw new BadRequestException('Bond not found');

    const { data: events } = await this.supabase.admin
      .from('audit_events')
      .select('*')
      .eq('bond_token_id', tokenId)
      .order('created_at', { ascending: true });

    const { data: transfers } = await this.supabase.admin
      .from('transfers')
      .select('*, from_profile:profiles!transfers_from_owner_fkey(*), to_profile:profiles!transfers_to_owner_fkey(*)')
      .eq('bond_token_id', tokenId)
      .order('created_at', { ascending: true });

    return { bond, events: events ?? [], transfers: transfers ?? [] };
  }

  async searchBonds(query: BondSearchQuery) {
    let q = this.supabase.admin
      .from('bonds')
      .select('*, parties(*), profiles!bonds_current_owner_fkey(id, full_name, email, role)')
      .order('created_at', { ascending: false });

    if (query.tokenId) q = q.eq('token_id', query.tokenId);
    if (query.bondId) q = q.ilike('bond_id', `%${query.bondId}%`);
    if (query.issuerPartyId) q = q.eq('issuer_party_id', query.issuerPartyId);
    if (query.ownerId) q = q.eq('current_owner', query.ownerId);
    if (query.status) q = q.eq('status', query.status);

    const { data, error } = await q;
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async getRecentEvents(limit = 50) {
    const { data } = await this.supabase.admin
      .from('audit_events')
      .select('*, bonds(bond_id, status), profiles!audit_events_actor_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data ?? [];
  }
}
