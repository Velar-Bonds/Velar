import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { paginatedResponse, parsePagination } from '../common/pagination';
import {
  AuditEvent,
  AuditEventType,
  BondSearchQuery,
  BondToken,
  Transfer,
} from '@velar/types';

type TimelineBondRow = Record<string, unknown> & {
  issuer_party_id?: string | null;
  created_at: string;
};

type TimelineEventRow = Record<string, unknown>;

type TimelineTransferRow = Record<string, unknown> & {
  from_owner?: string | null;
  to_owner: string;
  status: string;
  created_at: string;
  from_profile?: unknown;
  to_profile?: unknown;
};

type TimelinePayload = {
  bond: TimelineBondRow;
  events: TimelineEventRow[];
  transfers: TimelineTransferRow[];
};

type ProfileLookupRow = {
  id: string;
  full_name: string | null;
};

type TraceabilityOwnerEntry = {
  ownerId: string;
  name: string;
  since: string;
  until: string | null;
  paid: boolean;
  current: boolean;
};

type TraceabilityPayload = {
  bond: BondToken;
  events: AuditEvent[];
  transfers: Transfer[];
  owners: TraceabilityOwnerEntry[];
};

function toCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_[a-z]/g, (segment) => segment[1].toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

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

  async getBondTimeline(tokenId: string): Promise<TimelinePayload> {
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

    return {
      bond: bond as TimelineBondRow,
      events: (events ?? []) as TimelineEventRow[],
      transfers: (transfers ?? []) as TimelineTransferRow[],
    };
  }

  async getBondTraceability(tokenId: string): Promise<TraceabilityPayload> {
    let timeline: TimelinePayload;
    try {
      timeline = await this.getBondTimeline(tokenId);
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw new NotFoundException('Bond not found');
      }
      throw e;
    }

    // Collect unique profile IDs: issuer + all transfer participants
    const profileIds = new Set<string>();
    if (timeline.bond.issuer_party_id) profileIds.add(timeline.bond.issuer_party_id);
    for (const t of timeline.transfers) {
      if (t.from_owner) profileIds.add(t.from_owner);
      if (t.to_owner) profileIds.add(t.to_owner);
    }

    // Batch resolve profile names
    const nameMap = new Map<string, string>();
    if (profileIds.size > 0) {
      const { data: profiles } = await this.supabase.admin
        .from('profiles')
        .select('id, full_name')
        .in('id', [...profileIds]);
      if (profiles) {
        for (const p of profiles as ProfileLookupRow[]) {
          nameMap.set(p.id, p.full_name ?? p.id);
        }
      }
    }

    // Derive owners chain from transfers
    const transfers = timeline.transfers ?? [];
    const owners: TraceabilityOwnerEntry[] = [];

    // Seed owner: issuer
    const issuerId = timeline.bond.issuer_party_id;
    if (issuerId) {
      owners.push({
        ownerId: issuerId,
        name: nameMap.get(issuerId) ?? issuerId,
        since: timeline.bond.created_at,
        until: transfers.length > 0 ? transfers[0].created_at : null,
        paid: false,
        current: false,
      });
    }

    // Process each transfer in chronological order
    for (let i = 0; i < transfers.length; i++) {
      const t = transfers[i];
      const nextUntil = i < transfers.length - 1 ? transfers[i + 1].created_at : null;

      owners.push({
        ownerId: t.to_owner,
        name: nameMap.get(t.to_owner) ?? t.to_owner,
        since: t.created_at,
        until: nextUntil,
        paid: false, // will compute below
        current: false,
      });
    }

    // Mark paid: scan all transfers for liberada status per owner
    for (const owner of owners) {
      owner.paid = transfers.some(
        (transfer) => transfer.to_owner === owner.ownerId && transfer.status === 'liberada',
      );
    }

    // Mark current: last entry
    if (owners.length > 0) {
      owners[owners.length - 1].current = true;
    }

    // Strip profile embeds from transfers
    const cleanTransfers = transfers.map((transfer) => {
      const withoutProfiles = { ...transfer };
      delete withoutProfiles.from_profile;
      delete withoutProfiles.to_profile;
      return withoutProfiles;
    });

    return {
      bond: toCamel(timeline.bond) as unknown as BondToken,
      events: timeline.events.map((event) => toCamel(event) as unknown as AuditEvent),
      transfers: cleanTransfers.map((transfer) => toCamel(transfer) as unknown as Transfer),
      owners,
    };
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

  async getRecentEvents(page?: string, limit?: string) {
    const { page: p, limit: l, from, to } = parsePagination(page, limit);
    const { data, count, error } = await this.supabase.admin
      .from('audit_events')
      .select('*, bonds(bond_id, status), profiles!audit_events_actor_id_fkey(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw new BadRequestException(error.message);
    return paginatedResponse(data ?? [], count ?? 0, p, l);
  }
}
