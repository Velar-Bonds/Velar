import { Injectable, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { paginatedResponse, parsePagination } from '../common/pagination';
import {
  AuditEventType,
  BondSearchQuery,
  type AuditEvent,
  type BondToken,
  type Transfer,
  type TraceabilityResponse,
} from '@velar/types';

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

  private mapBondTraceabilityBond(bond: any): BondToken {
    return {
      tokenId: bond.token_id,
      bondId: bond.bond_id,
      issuerPartyId: bond.issuer_party_id,
      currentOwner: bond.current_owner,
      status: bond.status,
      documentHash: bond.document_hash,
      metadataUri: bond.metadata_uri ?? null,
      faceValue: bond.face_value ?? null,
      certificateNumber: bond.certificate_number ?? null,
      currency: bond.currency ?? null,
      interestRate: bond.interest_rate ?? null,
      series: bond.series ?? null,
      issueDate: bond.issue_date ?? null,
      maturityDate: bond.maturity_date ?? null,
      stellarStatus: bond.stellar_status ?? null,
      stellarTransactionHash: bond.stellar_transaction_hash ?? null,
      stellarLedger: bond.stellar_ledger ?? null,
      stellarAssetCode: bond.stellar_asset_code ?? null,
      stellarIssuerPublicKey: bond.stellar_issuer_public_key ?? null,
      stellarOwnerPublicKey: bond.stellar_owner_public_key ?? null,
      stellarRegisteredAt: bond.stellar_registered_at ?? null,
      stellarError: bond.stellar_error ?? null,
      createdAt: bond.created_at,
      updatedAt: bond.updated_at,
    };
  }

  private mapAuditEvent(event: any): AuditEvent {
    return {
      id: event.id,
      bondTokenId: event.bond_token_id ?? null,
      transferId: event.transfer_id ?? null,
      type: event.type,
      actorId: event.actor_id ?? null,
      payload: event.payload ?? {},
      txHash: event.tx_hash ?? null,
      createdAt: event.created_at,
    };
  }

  private mapTransfer(transfer: any): Transfer {
    return {
      id: transfer.id,
      bondTokenId: transfer.bond_token_id,
      fromOwner: transfer.from_owner,
      toOwner: transfer.to_owner,
      status: transfer.status,
      escrowContractId: transfer.escrow_contract_id ?? null,
      paymentEvidenceHash: transfer.payment_evidence_hash ?? null,
      validatedBy: transfer.validated_by ?? null,
      amount: transfer.amount ?? null,
      counterOfferAmount: transfer.counter_offer_amount ?? null,
      sellerMessage: transfer.seller_message ?? null,
      buyerMessage: transfer.buyer_message ?? null,
      createdAt: transfer.created_at,
      updatedAt: transfer.updated_at,
    };
  }

  async getBondTraceability(tokenId: string): Promise<TraceabilityResponse> {
    try {
      const { bond, events, transfers } = await this.getBondTimeline(tokenId);

      const cleanTransfers = transfers.map((t: any) => this.mapTransfer(t));
      const mappedBond = this.mapBondTraceabilityBond(bond);
      const mappedEvents = events.map((event: any) => this.mapAuditEvent(event));

      const owners = cleanTransfers.length === 0
        ? [{
          ownerId: bond.issuer_party_id,
          name: bond.parties?.name ?? '—',
          since: bond.created_at,
          until: null,
          paid: false,
          current: true,
        }]
        : [
          {
            ownerId: bond.issuer_party_id,
            name: bond.parties?.name ?? '—',
            since: bond.created_at,
            until: cleanTransfers[0].createdAt,
            paid: false,
            current: false,
          },
          ...cleanTransfers.map((t, idx) => ({
            ownerId: t.toOwner,
            name: transfers[idx]?.to_profile?.full_name ?? '—',
            since: t.createdAt,
            until: cleanTransfers[idx + 1]?.createdAt ?? null,
            paid: t.status === 'liberada',
            current: idx === cleanTransfers.length - 1,
          })),
        ];

      return {
        bond: mappedBond,
        events: mappedEvents,
        transfers: cleanTransfers,
        owners,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw new HttpException({ error: 'Bond not found', statusCode: 404 }, HttpStatus.NOT_FOUND);
      }
      throw error;
    }
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
