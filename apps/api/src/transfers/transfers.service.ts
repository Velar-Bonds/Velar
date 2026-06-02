import {
  Injectable, BadRequestException, ForbiddenException, NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { EscrowService } from '../escrow/escrow.service';
import {
  AuditEventType, BondStatus, NON_TRANSFERABLE_STATUSES,
  RequestTransferInput, Role, TransferStatus,
} from '@velar/types';

@Injectable()
export class TransfersService {
  constructor(
    private supabase: SupabaseService,
    private audit: AuditService,
    private escrow: EscrowService,
  ) {}

  private async getBond(tokenId: string) {
    const { data, error } = await this.supabase.admin
      .from('bonds').select('*').eq('token_id', tokenId).single();
    if (error || !data) throw new NotFoundException('Bond not found');
    return data;
  }

  async requestTransfer(input: RequestTransferInput, actorId: string) {
    const bond = await this.getBond(input.bondTokenId);
    if (bond.current_owner !== actorId) throw new ForbiddenException('Only the current owner can initiate a transfer');
    if (NON_TRANSFERABLE_STATUSES.includes(bond.status)) {
      throw new BadRequestException(`Bond status "${bond.status}" does not allow transfers`);
    }

    const { data: transfer, error } = await this.supabase.admin
      .from('transfers')
      .insert({ bond_token_id: input.bondTokenId, from_owner: actorId, to_owner: input.toOwner, status: TransferStatus.SOLICITADA, amount: input.amount ?? null })
      .select().single();
    if (error) throw new BadRequestException(error.message);

    await this.audit.emit({ type: AuditEventType.TRANSFER_SOLICITADA, bondTokenId: input.bondTokenId, transferId: transfer.id, actorId, payload: { toOwner: input.toOwner, amount: input.amount } });
    return transfer;
  }

  async acceptTransfer(transferId: string, actorId: string) {
    const { data: transfer } = await this.supabase.admin.from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.to_owner !== actorId) throw new ForbiddenException('Not the intended buyer');
    if (transfer.status !== TransferStatus.SOLICITADA) throw new BadRequestException('Transfer not in SOLICITADA state');

    await this.supabase.admin.from('transfers').update({ status: TransferStatus.ACEPTADA }).eq('id', transferId);
    await this.supabase.admin.from('bonds').update({ status: BondStatus.EN_ESCROW }).eq('token_id', transfer.bond_token_id);

    const [{ data: fromProfile }, { data: toProfile }] = await Promise.all([
      this.supabase.admin.from('profiles').select('stellar_wallet').eq('id', transfer.from_owner).single(),
      this.supabase.admin.from('profiles').select('stellar_wallet').eq('id', transfer.to_owner).single(),
    ]);

    let escrowContractId: string | undefined;
    let txHash: string | undefined;

    if (fromProfile?.stellar_wallet && toProfile?.stellar_wallet) {
      try {
        const res = await this.escrow.initEscrow({
          transferId, bondTokenId: transfer.bond_token_id,
          seller: fromProfile.stellar_wallet, buyer: toProfile.stellar_wallet,
          approver: toProfile.stellar_wallet, amount: transfer.amount ?? 0,
          title: `VELAR Bond Transfer ${transfer.bond_token_id}`,
        });
        escrowContractId = res.contractId;
        txHash = res.unsignedTransaction;
      } catch { /* non-fatal */ }
    }

    const { data: updated } = await this.supabase.admin
      .from('transfers').update({ status: TransferStatus.EN_ESCROW, escrow_contract_id: escrowContractId ?? null }).eq('id', transferId).select().single();

    await this.audit.emit({ type: AuditEventType.ESCROW_BLOQUEADO, bondTokenId: transfer.bond_token_id, transferId, actorId, payload: { escrowContractId }, txHash });
    return updated;
  }

  async registerPayment(transferId: string, evidenceContent: string, actorId: string) {
    const { data: transfer } = await this.supabase.admin.from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException();
    if (transfer.to_owner !== actorId) throw new ForbiddenException();
    if (transfer.status !== TransferStatus.EN_ESCROW) throw new BadRequestException('Transfer must be in EN_ESCROW state');

    const evidenceHash = crypto.createHash('sha256').update(evidenceContent).digest('hex');
    const { data: updated } = await this.supabase.admin
      .from('transfers').update({ status: TransferStatus.PAGO_REGISTRADO, payment_evidence_hash: evidenceHash }).eq('id', transferId).select().single();

    await this.audit.emit({ type: AuditEventType.PAGO_REGISTRADO, bondTokenId: transfer.bond_token_id, transferId, actorId, payload: { evidenceHash } });
    return updated;
  }

  async validatePayment(transferId: string, actorId: string, actorRole: Role) {
    if (!['validador', 'tse', 'admin'].includes(actorRole)) throw new ForbiddenException('Only VALIDADOR can validate payments');
    const { data: transfer } = await this.supabase.admin.from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException();
    if (transfer.status !== TransferStatus.PAGO_REGISTRADO) throw new BadRequestException('Payment not registered yet');

    const { data: updated } = await this.supabase.admin
      .from('transfers').update({ status: TransferStatus.PAGO_VALIDADO, validated_by: actorId }).eq('id', transferId).select().single();
    await this.audit.emit({ type: AuditEventType.PAGO_VALIDADO, bondTokenId: transfer.bond_token_id, transferId, actorId, payload: {} });
    return updated;
  }

  async releaseToken(transferId: string, actorId: string, actorRole: Role) {
    if (!['validador', 'tse', 'admin'].includes(actorRole)) throw new ForbiddenException('Only VALIDADOR can release tokens');
    const { data: transfer } = await this.supabase.admin.from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException();
    if (transfer.status !== TransferStatus.PAGO_VALIDADO) throw new BadRequestException('Payment must be validated before releasing');

    let txHash: string | undefined;
    if (transfer.escrow_contract_id) {
      try {
        const { data: profile } = await this.supabase.admin.from('profiles').select('stellar_wallet').eq('id', actorId).single();
        if (profile?.stellar_wallet) {
          const result = await this.escrow.releaseEscrow(transfer.escrow_contract_id, profile.stellar_wallet);
          txHash = result?.txHash;
        }
      } catch { /* non-fatal */ }
    }

    await Promise.all([
      this.supabase.admin.from('bonds').update({ current_owner: transfer.to_owner, status: BondStatus.ACTIVO }).eq('token_id', transfer.bond_token_id),
      this.supabase.admin.from('transfers').update({ status: TransferStatus.LIBERADA }).eq('id', transferId),
    ]);
    await this.audit.emit({ type: AuditEventType.TOKEN_LIBERADO, bondTokenId: transfer.bond_token_id, transferId, actorId, payload: { newOwner: transfer.to_owner }, txHash });
    return { success: true, newOwner: transfer.to_owner, txHash };
  }

  async cancelTransfer(transferId: string, actorId: string) {
    const { data: transfer } = await this.supabase.admin.from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException();
    if (transfer.from_owner !== actorId && transfer.to_owner !== actorId) throw new ForbiddenException();
    const cancellable = [TransferStatus.SOLICITADA, TransferStatus.ACEPTADA, TransferStatus.EN_ESCROW];
    if (!cancellable.includes(transfer.status)) throw new BadRequestException('Cannot cancel at this stage');

    await Promise.all([
      this.supabase.admin.from('bonds').update({ status: BondStatus.ACTIVO }).eq('token_id', transfer.bond_token_id),
      this.supabase.admin.from('transfers').update({ status: TransferStatus.CANCELADA }).eq('id', transferId),
    ]);
    await this.audit.emit({ type: AuditEventType.TRANSFER_CANCELADA, bondTokenId: transfer.bond_token_id, transferId, actorId, payload: {} });
    return { success: true };
  }

  async findMyTransfers(actorId: string, actorRole: Role) {
    let q = this.supabase.admin
      .from('transfers')
      .select('*, bonds(bond_id, status, face_value), from_profile:profiles!transfers_from_owner_fkey(id, full_name, email), to_profile:profiles!transfers_to_owner_fkey(id, full_name, email)')
      .order('created_at', { ascending: false });

    if (!['tse', 'admin'].includes(actorRole)) {
      if (actorRole === 'validador') {
        q = q.in('status', ['pago_registrado', 'pago_validado']);
      } else {
        q = q.or(`from_owner.eq.${actorId},to_owner.eq.${actorId}`);
      }
    }
    const { data } = await q;
    return data ?? [];
  }

  async findOne(transferId: string) {
    const { data } = await this.supabase.admin
      .from('transfers')
      .select('*, bonds(*), from_profile:profiles!transfers_from_owner_fkey(*), to_profile:profiles!transfers_to_owner_fkey(*), validator:profiles!transfers_validated_by_fkey(id, full_name)')
      .eq('id', transferId)
      .single();
    return data;
  }
}
