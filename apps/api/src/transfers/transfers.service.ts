import {
  Injectable, BadRequestException, ForbiddenException, NotFoundException, Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { StellarBondService } from '../escrow/stellar-bond.service';
import {
  AuditEventType, BondStatus, NON_TRANSFERABLE_STATUSES,
  RequestTransferInput, Role, TransferStatus,
} from '@velar/types';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private supabase: SupabaseService,
    private audit: AuditService,
    private stellar: StellarBondService,
  ) {}

  private async getBond(tokenId: string) {
    const { data, error } = await this.supabase.admin
      .from('bonds').select('*').eq('token_id', tokenId).single();
    if (error || !data) throw new NotFoundException('Bond not found');
    return data;
  }

  private async walletOf(profileId: string): Promise<string | null> {
    const { data } = await this.supabase.admin
      .from('profiles').select('stellar_wallet').eq('id', profileId).single();
    return data?.stellar_wallet ?? null;
  }

  // El COMPRADOR solicita comprar un bono a su dueño actual (modelo "vitrina").
  async requestTransfer(input: RequestTransferInput, actorId: string) {
    const bond = await this.getBond(input.bondTokenId);
    if (!bond.current_owner) throw new BadRequestException('El bono no tiene dueño asignado');
    if (bond.current_owner === actorId) throw new BadRequestException('No podés solicitar comprar tu propio bono');
    if (NON_TRANSFERABLE_STATUSES.includes(bond.status)) {
      throw new BadRequestException(`El bono está "${bond.status}" y no se puede solicitar ahora`);
    }
    if (bond.status !== BondStatus.EN_VENTA) {
      throw new BadRequestException('El bono debe estar publicado en el marketplace para recibir ofertas');
    }
    // Evitar dos solicitudes abiertas sobre el mismo bono.
    const { data: open } = await this.supabase.admin
      .from('transfers').select('id')
      .eq('bond_token_id', input.bondTokenId)
      .in('status', ['solicitada', 'contraoferta', 'aceptada', 'en_escrow', 'pago_registrado', 'pago_validado'])
      .limit(1).maybeSingle();
    if (open) throw new BadRequestException('Ya hay una solicitud en curso para este bono');

    const { data: transfer, error } = await this.supabase.admin
      .from('transfers')
      .insert({
        bond_token_id: input.bondTokenId,
        from_owner: bond.current_owner,
        to_owner: actorId,
        status: TransferStatus.SOLICITADA,
        amount: input.amount ?? null,
        buyer_message: input.message ?? null,
      })
      .select().single();
    if (error) throw new BadRequestException(error.message);

    await this.audit.emit({ type: AuditEventType.TRANSFER_SOLICITADA, bondTokenId: input.bondTokenId, transferId: transfer.id, actorId, payload: { buyer: actorId, seller: bond.current_owner, amount: input.amount } });
    return transfer;
  }

  // El DUEÑO (vendedor) acepta la solicitud → el token entra a la canasta.
  async acceptTransfer(transferId: string, actorId: string) {
    const { data: transfer } = await this.supabase.admin.from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.from_owner !== actorId) throw new ForbiddenException('Solo el dueño del bono puede aceptar la venta');
    if (transfer.status !== TransferStatus.SOLICITADA) throw new BadRequestException('Transfer not in SOLICITADA state');

    await this.supabase.admin.from('transfers').update({ status: TransferStatus.ACEPTADA }).eq('id', transferId);
    await this.supabase.admin.from('bonds').update({ status: BondStatus.EN_ESCROW }).eq('token_id', transfer.bond_token_id);

    // Mueve el TOKEN del bono a la canasta de escrow on-chain (queda bloqueado).
    const bond = await this.getBond(transfer.bond_token_id);
    const fromWallet = await this.walletOf(transfer.from_owner);
    let txHash: string | undefined;
    if (this.stellar.enabled && fromWallet) {
      try {
        txHash = await this.stellar.lockInEscrow(bond.bond_id, fromWallet, Number(transfer.amount) || undefined);
      } catch (e) {
        this.logger.warn(`lockInEscrow falló (sigue el flujo en BD): ${(e as Error).message}`);
      }
    }

    const { data: updated } = await this.supabase.admin
      .from('transfers').update({ status: TransferStatus.EN_ESCROW }).eq('id', transferId).select().single();

    await this.audit.emit({ type: AuditEventType.ESCROW_BLOQUEADO, bondTokenId: transfer.bond_token_id, transferId, actorId, payload: { canasta: 'escrow' }, txHash });
    return updated;
  }

  async rejectTransfer(transferId: string, actorId: string) {
    const { data: transfer } = await this.supabase.admin.from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.from_owner !== actorId) throw new ForbiddenException('Solo el vendedor puede rechazar la oferta');
    if (![TransferStatus.SOLICITADA, TransferStatus.CONTRAOFERTA].includes(transfer.status)) {
      throw new BadRequestException('La oferta no se puede rechazar en este estado');
    }

    await Promise.all([
      this.supabase.admin.from('transfers').update({ status: TransferStatus.RECHAZADA }).eq('id', transferId),
      this.supabase.admin.from('bonds').update({ status: BondStatus.EN_VENTA }).eq('token_id', transfer.bond_token_id),
    ]);
    await this.audit.emit({ type: AuditEventType.TRANSFER_RECHAZADA, bondTokenId: transfer.bond_token_id, transferId, actorId, payload: {} });
    return { success: true };
  }

  async counterOffer(transferId: string, amount: number, message: string | undefined, actorId: string) {
    const { data: transfer } = await this.supabase.admin.from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.from_owner !== actorId) throw new ForbiddenException('Solo el vendedor puede hacer contraoferta');
    if (![TransferStatus.SOLICITADA, TransferStatus.CONTRAOFERTA].includes(transfer.status)) {
      throw new BadRequestException('La oferta no acepta contraoferta en este estado');
    }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      throw new BadRequestException('La contraoferta debe tener un monto positivo');
    }

    const { data: updated, error } = await this.supabase.admin
      .from('transfers')
      .update({
        status: TransferStatus.CONTRAOFERTA,
        counter_offer_amount: amount,
        seller_message: message ?? null,
      })
      .eq('id', transferId)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    await this.audit.emit({
      type: AuditEventType.TRANSFER_ACEPTADA,
      bondTokenId: transfer.bond_token_id,
      transferId,
      actorId,
      payload: { counterOfferAmount: amount, message },
    });
    return updated;
  }

  async acceptCounterOffer(transferId: string, actorId: string) {
    const { data: transfer } = await this.supabase.admin.from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.to_owner !== actorId) throw new ForbiddenException('Solo el comprador puede aceptar la contraoferta');
    if (transfer.status !== TransferStatus.CONTRAOFERTA) throw new BadRequestException('No hay contraoferta pendiente');
    if (!transfer.counter_offer_amount) throw new BadRequestException('La contraoferta no tiene monto');

    await this.supabase.admin
      .from('transfers')
      .update({ status: TransferStatus.ACEPTADA, amount: transfer.counter_offer_amount })
      .eq('id', transferId);
    await this.supabase.admin.from('bonds').update({ status: BondStatus.EN_ESCROW }).eq('token_id', transfer.bond_token_id);

    const bond = await this.getBond(transfer.bond_token_id);
    const fromWallet = await this.walletOf(transfer.from_owner);
    let txHash: string | undefined;
    if (this.stellar.enabled && fromWallet) {
      try {
        txHash = await this.stellar.lockInEscrow(bond.bond_id, fromWallet, Number(transfer.amount) || undefined);
      } catch (e) {
        this.logger.warn(`lockInEscrow falló (sigue el flujo en BD): ${(e as Error).message}`);
      }
    }

    const { data: updated } = await this.supabase.admin
      .from('transfers').update({ status: TransferStatus.EN_ESCROW }).eq('id', transferId).select().single();

    await this.audit.emit({
      type: AuditEventType.ESCROW_BLOQUEADO,
      bondTokenId: transfer.bond_token_id,
      transferId,
      actorId,
      payload: { acceptedCounterOffer: transfer.counter_offer_amount },
      txHash,
    });
    return updated;
  }

  async registerPayment(transferId: string, evidenceContent: string, actorId: string) {
    const { data: transfer } = await this.supabase.admin.from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException();
    if (transfer.to_owner !== actorId) throw new ForbiddenException();
    if (transfer.status !== TransferStatus.EN_ESCROW) throw new BadRequestException('Transfer must be in EN_ESCROW state');

    // El pago es FÍSICO (fuera del sistema): solo registramos el hash de su evidencia.
    // El token sigue bloqueado en la canasta hasta que el validador confirme.
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

    // El validador confirma el pago físico. El token aún no se mueve: se libera
    // en el paso "release". (No hay dinero on-chain; solo se mueve el token del bono.)
    const { data: updated } = await this.supabase.admin
      .from('transfers').update({ status: TransferStatus.PAGO_VALIDADO, validated_by: actorId }).eq('id', transferId).select().single();
    await this.audit.emit({ type: AuditEventType.PAGO_VALIDADO, bondTokenId: transfer.bond_token_id, transferId, actorId, payload: {} });
    return updated;
  }

  // El VENDEDOR (dueño actual) confirma que recibió el pago → libera el token al comprador.
  async releaseToken(transferId: string, actorId: string, actorRole: Role) {
    const { data: transfer } = await this.supabase.admin.from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException();
    const isSeller = transfer.from_owner === actorId;
    if (!isSeller && !['tse', 'admin'].includes(actorRole)) {
      throw new ForbiddenException('Solo el vendedor confirma el pago y libera el bono');
    }
    if (transfer.status !== TransferStatus.PAGO_REGISTRADO) throw new BadRequestException('El comprador aún no registró el pago');

    // On-chain: libera el TOKEN del bono + registra el precio en VCRC (atómico).
    let txHash: string | undefined;
    let priceRecorded = false;
    const bond = await this.getBond(transfer.bond_token_id);
    const toWallet = await this.walletOf(transfer.to_owner);
    const fromWallet = await this.walletOf(transfer.from_owner);
    const amount = Number(transfer.amount) || 0;
    if (this.stellar.enabled && toWallet) {
      try {
        const res = await this.stellar.releaseFromEscrow(bond.bond_id, toWallet, amount || undefined, fromWallet ?? undefined);
        txHash = res.txHash;
        priceRecorded = res.priceRecorded;
      } catch (e) {
        this.logger.warn(`releaseFromEscrow falló (sigue el flujo en BD): ${(e as Error).message}`);
      }
    }

    await Promise.all([
      this.supabase.admin.from('bonds').update({ current_owner: transfer.to_owner, status: BondStatus.ACTIVO }).eq('token_id', transfer.bond_token_id),
      this.supabase.admin.from('transfers').update({ status: TransferStatus.LIBERADA }).eq('id', transferId),
    ]);
    await this.audit.emit({ type: AuditEventType.TOKEN_LIBERADO, bondTokenId: transfer.bond_token_id, transferId, actorId, payload: { newOwner: transfer.to_owner, priceRecorded }, txHash });
    return { success: true, newOwner: transfer.to_owner, txHash, priceRecorded };
  }

  async cancelTransfer(transferId: string, actorId: string) {
    const { data: transfer } = await this.supabase.admin.from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException();
    if (transfer.from_owner !== actorId && transfer.to_owner !== actorId) throw new ForbiddenException();
    const cancellable = [TransferStatus.SOLICITADA, TransferStatus.CONTRAOFERTA, TransferStatus.ACEPTADA, TransferStatus.EN_ESCROW];
    if (!cancellable.includes(transfer.status)) throw new BadRequestException('Cannot cancel at this stage');

    await Promise.all([
      this.supabase.admin.from('bonds').update({ status: transfer.status === TransferStatus.EN_ESCROW ? BondStatus.ACTIVO : BondStatus.EN_VENTA }).eq('token_id', transfer.bond_token_id),
      this.supabase.admin.from('transfers').update({ status: TransferStatus.CANCELADA }).eq('id', transferId),
    ]);
    await this.audit.emit({ type: AuditEventType.TRANSFER_CANCELADA, bondTokenId: transfer.bond_token_id, transferId, actorId, payload: {} });
    return { success: true };
  }

  async findMyTransfers(actorId: string, actorRole: Role) {
    let q = this.supabase.admin
      .from('transfers')
      .select('*, bonds!inner(bond_id, status, face_value, issuer_party_id), from_profile:profiles!transfers_from_owner_fkey(id, full_name, email), to_profile:profiles!transfers_to_owner_fkey(id, full_name, email)')
      .order('created_at', { ascending: false });

    if (!['tse', 'admin'].includes(actorRole)) {
      if (actorRole === 'validador') {
        q = q.in('status', ['pago_registrado', 'pago_validado']);
      } else if (actorRole === 'emisor') {
        // El partido emisor ve transferencias de los bonos que él emitió,
        // aunque ya no sea dueño actual (trazabilidad de su propio bono).
        const { data: profile } = await this.supabase.admin
          .from('profiles').select('party_id').eq('id', actorId).single();
        if (profile?.party_id) {
          q = q.eq('bonds.issuer_party_id', profile.party_id);
        } else {
          q = q.or(`from_owner.eq.${actorId},to_owner.eq.${actorId}`);
        }
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
