import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { RegisterBondInput, BondStatus, Role, AuditEventType } from '@velar/types';

@Injectable()
export class BondsService {
  constructor(
    private supabase: SupabaseService,
    private audit: AuditService,
  ) {}

  async register(input: RegisterBondInput, actorId: string, actorRole: Role) {
    if (!['emisor', 'admin'].includes(actorRole)) {
      throw new ForbiddenException('Only EMISOR or ADMIN can register bonds');
    }
    const { data, error } = await this.supabase.admin
      .from('bonds')
      .insert({
        bond_id: input.bondId,
        issuer_party_id: input.issuerPartyId,
        document_hash: input.documentHash,
        metadata_uri: input.metadataUri ?? null,
        face_value: input.faceValue ?? null,
        current_owner: input.initialOwner ?? null,
        status: input.initialOwner ? BondStatus.ACTIVO : BondStatus.EMITIDO,
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);

    await this.audit.emit({
      type: AuditEventType.BOND_EMITIDO,
      bondTokenId: data.token_id,
      actorId,
      payload: { bondId: data.bond_id, issuerPartyId: data.issuer_party_id },
    });

    if (input.initialOwner) {
      await this.audit.emit({
        type: AuditEventType.BOND_ASIGNADO,
        bondTokenId: data.token_id,
        actorId,
        payload: { owner: input.initialOwner },
      });
    }
    return data;
  }

  async findAll(actorId: string, actorRole: Role) {
    let q = this.supabase.admin
      .from('bonds')
      .select('*, parties(*), profiles!bonds_current_owner_fkey(id, full_name, email)')
      .order('created_at', { ascending: false });

    if (!['tse', 'admin'].includes(actorRole)) {
      if (actorRole === 'comprador' || actorRole === 'recomprador') {
        q = q.eq('current_owner', actorId);
      } else if (actorRole === 'emisor') {
        const { data: profile } = await this.supabase.admin
          .from('profiles')
          .select('party_id')
          .eq('id', actorId)
          .single();
        if (profile?.party_id) q = q.eq('issuer_party_id', profile.party_id);
      }
    }
    const { data } = await q;
    return data ?? [];
  }

  async findOne(tokenId: string, actorId: string, actorRole: Role) {
    const { data, error } = await this.supabase.admin
      .from('bonds')
      .select('*, parties(*), profiles!bonds_current_owner_fkey(id, full_name, email)')
      .eq('token_id', tokenId)
      .single();
    if (error || !data) throw new NotFoundException('Bond not found');
    if (!['tse', 'admin'].includes(actorRole)) {
      if (data.current_owner !== actorId) throw new ForbiddenException();
    }
    return data;
  }

  async freeze(tokenId: string, actorId: string, actorRole: Role) {
    if (!['tse', 'admin'].includes(actorRole)) throw new ForbiddenException('TSE/Admin only');
    const { data, error } = await this.supabase.admin
      .from('bonds').update({ status: BondStatus.CONGELADO }).eq('token_id', tokenId).select().single();
    if (error) throw new BadRequestException(error.message);
    await this.audit.emit({ type: AuditEventType.BOND_CONGELADO, bondTokenId: tokenId, actorId, payload: {} });
    return data;
  }

  async unfreeze(tokenId: string, actorId: string, actorRole: Role) {
    if (!['tse', 'admin'].includes(actorRole)) throw new ForbiddenException('TSE/Admin only');
    const { data, error } = await this.supabase.admin
      .from('bonds').update({ status: BondStatus.ACTIVO }).eq('token_id', tokenId).select().single();
    if (error) throw new BadRequestException(error.message);
    await this.audit.emit({ type: AuditEventType.BOND_DESCONGELADO, bondTokenId: tokenId, actorId, payload: {} });
    return data;
  }

  static hashDocument(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
