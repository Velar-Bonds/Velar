import {
  Injectable, BadRequestException, ForbiddenException, NotFoundException, Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { SupabaseService } from '../common/supabase/supabase.service';
import { paginatedResponse, parsePagination } from '../common/pagination';
import { AuditService } from '../audit/audit.service';
import { StellarBondService } from '../escrow/stellar-bond.service';
import { TrustlessWorkService } from '../escrow/trustless-work.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AuditEventType, BondStatus, NON_TRANSFERABLE_STATUSES,
  NotificationType, RequestTransferInput, Role, TransferStatus,
  DEFAULT_COUNTRY, getCountryProfile,
} from '@velar/types';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private supabase: SupabaseService,
    private audit: AuditService,
    private stellar: StellarBondService,
    private trustlessWork: TrustlessWorkService,
    private notifications: NotificationsService,
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

  /**
   * Wallet de cobro del vendedor/partido: self-custody vinculada → custodial perfil → custodial partido.
   */
  private async paymentWalletOf(profileId: string): Promise<string | null> {
    const { data } = await this.supabase.admin
      .from('profiles')
      .select('stellar_public_key, stellar_wallet, party_id, parties(stellar_wallet)')
      .eq('id', profileId)
      .maybeSingle();
    if (!data) return null;
    const partyWallet = (data.parties as { stellar_wallet?: string } | null)?.stellar_wallet;
    return data.stellar_public_key ?? data.stellar_wallet ?? partyWallet ?? null;
  }

  /** Llave self-custody (Freighter) vinculada al perfil; null si no hay o falta migración. */
  private async selfCustodyKeyOf(profileId: string): Promise<string | null> {
    const { data, error } = await this.supabase.admin
      .from('profiles').select('stellar_public_key').eq('id', profileId).maybeSingle();
    if (error) return null;
    return (data as { stellar_public_key?: string } | null)?.stellar_public_key ?? null;
  }

  /**
   * SELF-CUSTODY (no custodial): devuelve el XDR SIN FIRMAR de la transferencia
   * del token, con la wallet propia del vendedor como source. El vendedor lo
   * firma en el front con Freighter y luego llama a submitTransferXdr.
   * Es un camino opcional; el flujo custodial (acceptTransfer/releaseToken) no
   * se toca.
   */
  async buildTransferXdr(transferId: string, actorId: string) {
    const { data: transfer } = await this.supabase.admin
      .from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.from_owner !== actorId) {
      throw new ForbiddenException('Solo el vendedor (dueño actual) puede firmar la transferencia');
    }
    const bond = await this.getBond(transfer.bond_token_id);
    const source = await this.selfCustodyKeyOf(actorId);
    if (!source) {
      throw new BadRequestException(
        'Vinculá tu wallet self-custody (PATCH /users/me/wallet) antes de firmar la transferencia.',
      );
    }
    const destination = (await this.selfCustodyKeyOf(transfer.to_owner)) ?? (await this.walletOf(transfer.to_owner));
    if (!destination) throw new BadRequestException('El comprador no tiene una wallet de destino.');

    const xdr = await this.stellar.buildBondPaymentXdr(source, destination, bond.bond_id);
    return {
      xdr,
      networkPassphrase: this.stellar.networkPassphrase,
      sourcePublicKey: source,
      destination,
      assetCode: this.stellar.assetCodeFor(bond.bond_id),
    };
  }

  /**
   * SELF-CUSTODY: somete a Horizon el XDR ya firmado por el front (Freighter)
   * y devuelve el hash. No muta la máquina de estados custodial; deja registro
   * de auditoría con el hash on-chain.
   */
  async submitTransferXdr(transferId: string, signedXdr: string, actorId: string) {
    const { data: transfer } = await this.supabase.admin
      .from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.from_owner !== actorId) {
      throw new ForbiddenException('Solo el vendedor puede enviar la transferencia firmada');
    }
    if (!signedXdr) throw new BadRequestException('Falta el XDR firmado');

    const { hash } = await this.stellar.submitSignedXdr(signedXdr);
    await this.audit.emit({
      type: AuditEventType.TOKEN_LIBERADO,
      bondTokenId: transfer.bond_token_id,
      transferId,
      actorId,
      payload: { selfCustody: true },
      txHash: hash,
    });
    return { success: true, txHash: hash, explorerUrl: this.stellar.txExplorerUrl(hash) };
  }

  /** Conversión simple CRC→USDC para testnet (tasa configurable). */
  private usdcAmountFromCrc(amountCrc: number): string {
    const rate = Number(process.env.STELLAR_USDC_CRC_RATE) || 530;
    const usd = amountCrc > 0 ? amountCrc / rate : 0;
    return usd.toFixed(7);
  }

  private async assertSameCountryBuyer(bond: any, actorId: string) {
    const { data: buyer } = await this.supabase.admin
      .from('profiles').select('country').eq('id', actorId).maybeSingle();
    const buyerCountry = buyer?.country ?? DEFAULT_COUNTRY;
    const bondCountry = bond.country ?? DEFAULT_COUNTRY;
    if (buyerCountry !== bondCountry) {
      const bondNation = getCountryProfile(bondCountry).name;
      const buyerNation = getCountryProfile(buyerCountry).name;
      throw new ForbiddenException(
        `Compra cross-border bloqueada: este instrumento es de ${bondNation} y tu cuenta es de ${buyerNation}.`,
      );
    }
  }

  /**
   * COMPRA INSTANTÁNEA (pago con wallet, DvP atómico): arma el XDR sin firmar de
   * la liquidación atómica USDC↔bono. El comprador lo firma con Freighter y lo
   * reenvía a submitInstantBuy. No usa el escrow ni la negociación: es el camino
   * "pagar con wallet de una" cuando el dueño aceptó el método 'wallet'.
   */
  async buildInstantBuyXdr(bondTokenId: string, actorId: string) {
    const bond = await this.getBond(bondTokenId);
    if (bond.status !== BondStatus.EN_VENTA) {
      throw new BadRequestException('El bono no está publicado en el marketplace');
    }
    if (bond.current_owner === actorId) {
      throw new BadRequestException('No podés comprar tu propio bono');
    }
    const methods: string[] = Array.isArray(bond.payment_methods) ? bond.payment_methods : [];
    if (methods.length > 0 && !methods.includes('wallet')) {
      throw new BadRequestException('Este bono no acepta pago con wallet (cripto). Usá el flujo P2P.');
    }
    await this.assertSameCountryBuyer(bond, actorId);

    const buyerAddress = await this.selfCustodyKeyOf(actorId);
    if (!buyerAddress) {
      throw new BadRequestException(
        'Conectá y vinculá tu wallet self-custody (PATCH /users/me/wallet) para pagar con wallet.',
      );
    }
    const sellerAddress = await this.paymentWalletOf(bond.current_owner);
    if (!sellerAddress) throw new BadRequestException('El vendedor no tiene una wallet de cobro configurada.');

    const priceCrc = Number(bond.amount ?? bond.face_value) || 0;
    if (priceCrc <= 0) throw new BadRequestException('El bono no tiene un precio de venta definido.');
    const usdcAmount = this.usdcAmountFromCrc(priceCrc);

    const xdr = await this.stellar.buildInstantBuyXdr({
      buyerAddress, sellerAddress, bondId: bond.bond_id, usdcAmount,
    });
    return {
      xdr,
      networkPassphrase: this.stellar.networkPassphrase,
      usdcAmount,
      priceCrc,
      buyerAddress,
      sellerAddress,
    };
  }

  /**
   * COMPRA INSTANTÁNEA: somete el XDR firmado por el comprador a Horizon. Como la
   * tx es atómica (pago USDC + movimiento del bono), al confirmar ya ocurrió el
   * traspaso on-chain; registramos la venta y el nuevo dueño en la BD.
   */
  async submitInstantBuy(bondTokenId: string, signedXdr: string, actorId: string) {
    if (!signedXdr) throw new BadRequestException('Falta el XDR firmado');
    const bond = await this.getBond(bondTokenId);
    if (bond.current_owner === actorId) throw new BadRequestException('No podés comprar tu propio bono');
    const seller = bond.current_owner;
    const priceCrc = Number(bond.amount ?? bond.face_value) || null;

    const { hash } = await this.stellar.submitSignedXdr(signedXdr);

    const { data: transfer } = await this.supabase.admin
      .from('transfers')
      .insert({
        bond_token_id: bondTokenId,
        from_owner: seller,
        to_owner: actorId,
        status: TransferStatus.LIBERADA,
        amount: priceCrc,
      })
      .select().single();
    await this.supabase.admin
      .from('bonds').update({ current_owner: actorId, status: BondStatus.ACTIVO }).eq('token_id', bondTokenId);
    await this.audit.emit({
      type: AuditEventType.TOKEN_LIBERADO,
      bondTokenId,
      transferId: transfer?.id,
      actorId,
      payload: { instantBuy: true, paymentMethod: 'wallet', priceCrc },
      txHash: hash,
    });
    return { success: true, txHash: hash, explorerUrl: this.stellar.txExplorerUrl(hash), newOwner: actorId };
  }

  /**
   * NEGOCIACIÓN + WALLET: tras aceptación, el comprador paga USDC on-chain (DvP atómico).
   * El USDC va a la wallet predeterminada del partido/vendedor; el bono se libera al comprador.
   */
  async buildNegotiatedWalletPaymentXdr(transferId: string, actorId: string) {
    const { data: transfer } = await this.supabase.admin
      .from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.to_owner !== actorId) {
      throw new ForbiddenException('Solo el comprador puede pagar esta negociación');
    }
    if ((transfer.payment_method ?? 'sinpe') !== 'wallet') {
      throw new BadRequestException('Esta negociación no usa pago con wallet.');
    }
    if (transfer.status !== TransferStatus.ACEPTADA) {
      throw new BadRequestException('La venta debe estar aceptada antes de pagar con wallet.');
    }

    const bond = await this.getBond(transfer.bond_token_id);
    const buyerAddress = await this.selfCustodyKeyOf(actorId);
    if (!buyerAddress) {
      throw new BadRequestException(
        'Conectá y vinculá tu wallet (PATCH /users/me/wallet) para pagar con USDC.',
      );
    }
    const sellerAddress = await this.paymentWalletOf(transfer.from_owner);
    if (!sellerAddress) {
      throw new BadRequestException('El vendedor no tiene wallet de cobro configurada.');
    }

    const priceCrc = Number(transfer.amount) || Number(bond.face_value) || 0;
    if (priceCrc <= 0) throw new BadRequestException('La negociación no tiene un monto válido.');
    const usdcAmount = this.usdcAmountFromCrc(priceCrc);

    const xdr = await this.stellar.buildInstantBuyXdr({
      buyerAddress, sellerAddress, bondId: bond.bond_id, usdcAmount,
    });
    return {
      xdr,
      networkPassphrase: this.stellar.networkPassphrase,
      usdcAmount,
      priceCrc,
      buyerAddress,
      sellerAddress,
      transferId,
    };
  }

  async submitNegotiatedWalletPaymentXdr(transferId: string, signedXdr: string, actorId: string) {
    if (!signedXdr) throw new BadRequestException('Falta el XDR firmado');
    const { data: transfer } = await this.supabase.admin
      .from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.to_owner !== actorId) throw new ForbiddenException('Solo el comprador puede enviar el pago');
    if ((transfer.payment_method ?? 'sinpe') !== 'wallet') {
      throw new BadRequestException('Esta negociación no usa pago con wallet.');
    }
    if (transfer.status !== TransferStatus.ACEPTADA) {
      throw new BadRequestException('La venta debe estar aceptada para liquidar con wallet.');
    }

    const bond = await this.getBond(transfer.bond_token_id);
    const priceCrc = Number(transfer.amount) || Number(bond.face_value) || null;
    const { hash } = await this.stellar.submitSignedXdr(signedXdr);

    const { data: updated } = await this.supabase.admin
      .from('transfers')
      .update({ status: TransferStatus.LIBERADA })
      .eq('id', transferId)
      .select()
      .single();
    await this.supabase.admin
      .from('bonds')
      .update({ current_owner: actorId, status: BondStatus.ACTIVO })
      .eq('token_id', transfer.bond_token_id);

    await this.audit.emit({
      type: AuditEventType.TOKEN_LIBERADO,
      bondTokenId: transfer.bond_token_id,
      transferId,
      actorId,
      payload: { negotiatedWallet: true, paymentMethod: 'wallet', priceCrc },
      txHash: hash,
    });
    return {
      success: true,
      txHash: hash,
      explorerUrl: this.stellar.txExplorerUrl(hash),
      transfer: updated,
      newOwner: actorId,
    };
  }

  /** Tras aceptar oferta con pago wallet: queda en ACEPTADA esperando DvP on-chain (sin escrow TW). */
  private async finishWalletAcceptedOffer(
    transferId: string,
    transfer: { bond_token_id: string; to_owner: string; from_owner: string; amount?: number | null },
    bond: { bond_id: string },
    actorId: string,
    amount?: number | null,
  ) {
    const { data: updated } = await this.supabase.admin
      .from('transfers').select('*').eq('id', transferId).single();

    await this.audit.emit({
      type: AuditEventType.TRANSFER_ACEPTADA,
      bondTokenId: transfer.bond_token_id,
      transferId,
      actorId,
      payload: {
        paymentMethod: 'wallet',
        awaitingOnChainPayment: true,
        amount: amount ?? transfer.amount ?? null,
      },
    });
    await this.notifications.emit(transfer.to_owner, NotificationType.OFFER_ACCEPTED, {
      transferId,
      bondTokenId: transfer.bond_token_id,
      bondId: bond.bond_id,
      amount: amount ?? transfer.amount ?? null,
      paymentMethod: 'wallet',
    });
    return updated;
  }

  // El COMPRADOR solicita comprar un bono a su dueño actual (modelo "vitrina").
  async requestTransfer(input: RequestTransferInput, actorId: string) {
    if (input.toOwner && input.toOwner !== actorId) {
      throw new ForbiddenException('Solo podés solicitar una compra para tu propia cuenta');
    }
    const bond = await this.getBond(input.bondTokenId);
    if (!bond.current_owner) throw new BadRequestException('El bono no tiene dueño asignado');
    if (bond.current_owner === actorId) throw new BadRequestException('No podés solicitar comprar tu propio bono');

    // ── Compliance: segmentación nacional obligatoria ──────────────────
    // El financiamiento político extranjero es ilegal en CR/CO/BR/AR. Un
    // comprador solo puede adquirir bonos de su MISMA jurisdicción. La regla
    // queda codificada en la infraestructura, no delegada a la buena fe.
    const { data: buyer } = await this.supabase.admin
      .from('profiles').select('*').eq('id', actorId).maybeSingle();
    const buyerCountry = buyer?.country ?? DEFAULT_COUNTRY;
    const bondCountry = bond.country ?? DEFAULT_COUNTRY;
    if (buyerCountry !== bondCountry) {
      const bondNation = getCountryProfile(bondCountry).name;
      const buyerNation = getCountryProfile(buyerCountry).name;
      throw new ForbiddenException(
        `Compra cross-border bloqueada: este instrumento es de ${bondNation} y tu cuenta es de ${buyerNation}. ` +
          `El financiamiento político extranjero está prohibido por ley — VELAR lo impide por diseño.`,
      );
    }
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

    const paymentMethod = input.paymentMethod ?? 'sinpe';
    const allowedMethods: string[] = Array.isArray(bond.payment_methods) ? bond.payment_methods : [];
    if (allowedMethods.length > 0 && !allowedMethods.includes(paymentMethod)) {
      throw new BadRequestException(
        `Este bono no acepta el método "${paymentMethod}". Métodos disponibles: ${allowedMethods.join(', ')}.`,
      );
    }
    if (paymentMethod === 'wallet') {
      const buyerKey = await this.selfCustodyKeyOf(actorId);
      if (!buyerKey) {
        throw new BadRequestException(
          'Para ofertar con wallet, conectá Freighter y vinculá tu llave (Configuración → wallet).',
        );
      }
      const sellerKey = await this.paymentWalletOf(bond.current_owner);
      if (!sellerKey) {
        throw new BadRequestException('El vendedor aún no tiene wallet de cobro configurada.');
      }
    }

    const insertPayload: Record<string, unknown> = {
      bond_token_id: input.bondTokenId,
      from_owner: bond.current_owner,
      to_owner: actorId,
      status: TransferStatus.SOLICITADA,
      amount: input.amount ?? null,
      buyer_message: input.message ?? null,
      payment_method: paymentMethod,
    };

    let transfer: any;
    let error: any;
    ({ data: transfer, error } = await this.supabase.admin
      .from('transfers')
      .insert(insertPayload)
      .select().single());
    if (error?.message?.includes('payment_method')) {
      delete insertPayload.payment_method;
      ({ data: transfer, error } = await this.supabase.admin
        .from('transfers')
        .insert(insertPayload)
        .select().single());
    }
    if (error) throw new BadRequestException(error.message);

    await this.audit.emit({ type: AuditEventType.TRANSFER_SOLICITADA, bondTokenId: input.bondTokenId, transferId: transfer.id, actorId, payload: { buyer: actorId, seller: bond.current_owner, amount: input.amount, paymentMethod } });
    await this.notifications.emit(bond.current_owner, NotificationType.OFFER_RECEIVED, { transferId: transfer.id, bondTokenId: input.bondTokenId, bondId: bond.bond_id, amount: input.amount ?? null, buyerId: actorId });
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

    const bond = await this.getBond(transfer.bond_token_id);
    const paymentMethod = transfer.payment_method ?? 'sinpe';

    if (paymentMethod === 'wallet') {
      return this.finishWalletAcceptedOffer(transferId, transfer, bond, actorId);
    }

    const fromWallet = await this.walletOf(transfer.from_owner);
    const toWallet = await this.walletOf(transfer.to_owner);
    const saleAmount = Number(transfer.amount) || 1;
    // En testnet usamos 1 USDC simbólico — el precio real está en BD (colones)
    const amountUsdc = 1;

    let twContractId: string | undefined;
    let twDeployTx: string | undefined;
    let twFundTx: string | undefined;
    let lockTx: string | undefined;

    if (this.trustlessWork.enabled && fromWallet && toWallet) {
      try {
        // 1. Provision USDC al comprador para que pueda fondear el escrow (testnet)
        await this.stellar.provisionUsdc(toWallet, amountUsdc);
        await new Promise((r) => setTimeout(r, 3000));

        // 2. Deploy contrato TW con USDC como asset custodiado
        const deployed = await this.trustlessWork.deployEscrow({
          bondId: bond.bond_id,
          bondAssetCode: this.stellar.assetCodeFor(bond.bond_id),
          sellerAddress: fromWallet,
          buyerAddress: toWallet,
          transferId: transfer.id,
          amountUsdc,
        });
        twContractId = deployed.contractId;
        twDeployTx = deployed.deployTx;

        // 3. Comprador deposita USDC en el contrato TW (queda bloqueado)
        twFundTx = await this.trustlessWork.fundEscrow(twContractId, toWallet, amountUsdc);

        // 4. Bono entra a wallet escrow del backend (garantía de entrega)
        if (fromWallet) {
          try {
            lockTx = await this.stellar.lockInEscrow(bond.bond_id, fromWallet, saleAmount);
          } catch (e) {
            this.logger.warn(`lockInEscrow falló: ${(e as Error).message}`);
          }
        }
      } catch (e) {
        this.logger.warn(`TrustlessWork deploy/fund falló (sigue el flujo): ${(e as Error).message}`);
      }
    } else if (this.stellar.enabled && fromWallet) {
      try {
        lockTx = await this.stellar.lockInEscrow(bond.bond_id, fromWallet, saleAmount);
      } catch (e) {
        this.logger.warn(`lockInEscrow falló: ${(e as Error).message}`);
      }
    }

    const { data: updated } = await this.supabase.admin
      .from('transfers').update({
        status: TransferStatus.EN_ESCROW,
        escrow_contract_id: twContractId ?? null,
      }).eq('id', transferId).select().single();

    await this.audit.emit({
      type: AuditEventType.ESCROW_BLOQUEADO,
      bondTokenId: transfer.bond_token_id,
      transferId,
      actorId,
      payload: { twContractId, twDeployTx, twFundTx, lockTx, amountUsdc },
    });
    await this.notifications.emit(transfer.to_owner, NotificationType.OFFER_ACCEPTED, { transferId, bondTokenId: transfer.bond_token_id, bondId: bond.bond_id, amount: transfer.amount });
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
    await this.notifications.emit(transfer.to_owner, NotificationType.OFFER_REJECTED, { transferId, bondTokenId: transfer.bond_token_id });
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
      type: AuditEventType.COUNTER_OFFER_SENT,
      bondTokenId: transfer.bond_token_id,
      transferId,
      actorId,
      payload: { counterOfferAmount: amount, message },
    });
    await this.notifications.emit(transfer.to_owner, NotificationType.COUNTER_OFFER_RECEIVED, { transferId, bondTokenId: transfer.bond_token_id, counterOfferAmount: amount, message: message ?? null });
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
    const paymentMethod = transfer.payment_method ?? 'sinpe';

    if (paymentMethod === 'wallet') {
      return this.finishWalletAcceptedOffer(
        transferId, transfer, bond, actorId, transfer.counter_offer_amount,
      );
    }

    const fromWallet = await this.walletOf(transfer.from_owner);
    const toWallet = await this.walletOf(transfer.to_owner);
    const saleAmount = Number(transfer.counter_offer_amount) || 1;
    const amountUsdc = 1;

    let twContractId: string | undefined;
    let twDeployTx: string | undefined;
    let twFundTx: string | undefined;
    let lockTx: string | undefined;

    if (this.trustlessWork.enabled && fromWallet && toWallet) {
      try {
        await this.stellar.provisionUsdc(toWallet, amountUsdc);
        await new Promise((r) => setTimeout(r, 3000));

        const deployed = await this.trustlessWork.deployEscrow({
          bondId: bond.bond_id,
          bondAssetCode: this.stellar.assetCodeFor(bond.bond_id),
          sellerAddress: fromWallet,
          buyerAddress: toWallet,
          transferId: transfer.id,
          amountUsdc,
        });
        twContractId = deployed.contractId;
        twDeployTx = deployed.deployTx;
        twFundTx = await this.trustlessWork.fundEscrow(twContractId, toWallet, amountUsdc);

        if (fromWallet) {
          try { lockTx = await this.stellar.lockInEscrow(bond.bond_id, fromWallet, saleAmount); }
          catch (e) { this.logger.warn(`lockInEscrow falló: ${(e as Error).message}`); }
        }
      } catch (e) {
        this.logger.warn(`TrustlessWork deploy/fund falló (sigue el flujo): ${(e as Error).message}`);
      }
    } else if (this.stellar.enabled && fromWallet) {
      try { lockTx = await this.stellar.lockInEscrow(bond.bond_id, fromWallet, saleAmount); }
      catch (e) { this.logger.warn(`lockInEscrow falló: ${(e as Error).message}`); }
    }

    const { data: updated } = await this.supabase.admin
      .from('transfers').update({
        status: TransferStatus.EN_ESCROW,
        escrow_contract_id: twContractId ?? null,
      }).eq('id', transferId).select().single();

    await this.audit.emit({
      type: AuditEventType.ESCROW_BLOQUEADO,
      bondTokenId: transfer.bond_token_id,
      transferId,
      actorId,
      payload: { acceptedCounterOffer: transfer.counter_offer_amount, twContractId, twDeployTx, twFundTx, lockTx, amountUsdc },
    });
    await this.notifications.emit(transfer.from_owner, NotificationType.OFFER_ACCEPTED, { transferId, bondTokenId: transfer.bond_token_id, bondId: bond.bond_id, amount: transfer.counter_offer_amount });
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

    // TW: comprador marca milestone completed (confirma que hizo el pago off-chain)
    let twMilestoneTx: string | undefined;
    if (this.trustlessWork.enabled && transfer.escrow_contract_id) {
      const buyerWallet = await this.walletOf(transfer.to_owner);
      if (buyerWallet) {
        try {
          twMilestoneTx = await this.trustlessWork.markMilestoneCompleted(
            transfer.escrow_contract_id,
            buyerWallet,
            `evidence:${evidenceHash.slice(0, 16)}`,
          );
        } catch (e) {
          this.logger.warn(`TrustlessWork markMilestone falló: ${(e as Error).message}`);
        }
      }
    }

    const { data: updated } = await this.supabase.admin
      .from('transfers').update({ status: TransferStatus.PAGO_REGISTRADO, payment_evidence_hash: evidenceHash }).eq('id', transferId).select().single();

    await this.audit.emit({
      type: AuditEventType.PAGO_REGISTRADO,
      bondTokenId: transfer.bond_token_id,
      transferId,
      actorId,
      payload: { evidenceHash, twMilestoneTx },
    });
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
    await this.notifications.emit(transfer.from_owner, NotificationType.PAYMENT_CONFIRMED, { transferId, bondTokenId: transfer.bond_token_id });
    await this.notifications.emit(transfer.to_owner, NotificationType.PAYMENT_CONFIRMED, { transferId, bondTokenId: transfer.bond_token_id });
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

    const bond = await this.getBond(transfer.bond_token_id);
    const fromWallet = await this.walletOf(transfer.from_owner);
    const amount = Number(transfer.amount) || 0;

    let twApproveTx: string | undefined;
    let twReleaseTx: string | undefined;
    let priceRecorded = false;
    let priceTxHash: string | undefined;

    if (this.trustlessWork.enabled && transfer.escrow_contract_id) {
      try {
        // 1. Aprueba el milestone (plataforma confirma que el pago fue válido)
        twApproveTx = await this.trustlessWork.approveMilestone(transfer.escrow_contract_id);
        // 2. TW libera el token del bono al comprador (receiver del contrato)
        twReleaseTx = await this.trustlessWork.releaseFunds(transfer.escrow_contract_id);
      } catch (e) {
        this.logger.warn(`TrustlessWork approve/release falló: ${(e as Error).message}`);
      }
    }

    // Registra el precio en VCRC on-chain (analytics) — separado del movimiento del bono
    if (this.stellar.enabled && fromWallet && amount > 0) {
      try {
        const res = await this.stellar.recordPrice(bond.bond_id, amount, fromWallet);
        priceRecorded = res.priceRecorded;
        priceTxHash = res.txHash;
      } catch (e) {
        this.logger.warn(`recordPrice VCRC falló: ${(e as Error).message}`);
      }
    }

    await Promise.all([
      this.supabase.admin.from('bonds').update({ current_owner: transfer.to_owner, status: BondStatus.ACTIVO }).eq('token_id', transfer.bond_token_id),
      this.supabase.admin.from('transfers').update({ status: TransferStatus.LIBERADA }).eq('id', transferId),
    ]);
    await this.audit.emit({
      type: AuditEventType.TOKEN_LIBERADO,
      bondTokenId: transfer.bond_token_id,
      transferId,
      actorId,
      payload: { newOwner: transfer.to_owner, twApproveTx, twReleaseTx, priceRecorded },
      txHash: twReleaseTx ?? priceTxHash,
    });
    return { success: true, newOwner: transfer.to_owner, txHash: twReleaseTx, priceRecorded, twApproveTx, twReleaseTx };
  }

  /** El dueño solicita al TSE que saque el bono del escrow (cancelación con disputa). */
  async requestReturn(transferId: string, reason: string, actorId: string) {
    const { data: transfer } = await this.supabase.admin.from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');
    if (transfer.from_owner !== actorId) {
      throw new ForbiddenException('Solo el dueño del bono puede solicitar retirar del escrow');
    }
    const allowed = [TransferStatus.EN_ESCROW, TransferStatus.PAGO_REGISTRADO];
    if (!allowed.includes(transfer.status)) {
      throw new BadRequestException('Solo se puede solicitar retiro cuando el bono está en escrow');
    }
    if (transfer.return_requested_at && !transfer.return_rejected_at) {
      throw new BadRequestException('Ya hay una solicitud de retiro pendiente');
    }

    const { data: updated, error } = await this.supabase.admin
      .from('transfers').update({
        return_requested_at: new Date().toISOString(),
        return_requested_by: actorId,
        return_reason: reason?.trim() || null,
        return_rejected_at: null,
        return_rejected_by: null,
        return_tse_notes: null,
      }).eq('id', transferId).select().single();
    if (error) throw new BadRequestException(error.message);

    await this.audit.emit({
      type: AuditEventType.TRANSFER_CANCELADA,
      bondTokenId: transfer.bond_token_id,
      transferId,
      actorId,
      payload: { kind: 'return_requested', reason },
    });
    return updated;
  }

  /** TSE aprueba el retorno: mueve el token on-chain del escrow al dueño y cancela. */
  async approveReturn(transferId: string, notes: string | undefined, actorId: string, actorRole: Role) {
    if (!['tse', 'admin'].includes(actorRole)) {
      throw new ForbiddenException('Solo el TSE puede aprobar el retorno');
    }
    const { data: transfer } = await this.supabase.admin.from('transfers').select('*').eq('id', transferId).single();
    if (!transfer) throw new NotFoundException();
    if (!transfer.return_requested_at) throw new BadRequestException('No hay solicitud de retorno pendiente');
    if (transfer.return_approved_at) throw new BadRequestException('Ya fue aprobada');

    const ownerWallet = await this.walletOf(transfer.from_owner);

    let returnTx: string | undefined;
    if (this.trustlessWork.enabled && transfer.escrow_contract_id && ownerWallet) {
      try {
        returnTx = await this.trustlessWork.returnToSeller(transfer.escrow_contract_id, ownerWallet);
      } catch (e) {
        this.logger.warn(`TrustlessWork returnToSeller falló: ${(e as Error).message}`);
      }
    }

    await Promise.all([
      this.supabase.admin.from('bonds').update({ status: BondStatus.ACTIVO }).eq('token_id', transfer.bond_token_id),
      this.supabase.admin.from('transfers').update({
        status: TransferStatus.CANCELADA,
        return_approved_at: new Date().toISOString(),
        return_approved_by: actorId,
        return_tse_notes: notes?.trim() || null,
      }).eq('id', transferId),
    ]);

    await this.audit.emit({
      type: AuditEventType.TRANSFER_CANCELADA,
      bondTokenId: transfer.bond_token_id,
      transferId,
      actorId,
      payload: { kind: 'return_approved', returnTx },
    });
    return { success: true, returnTx };
  }

  /** TSE rechaza la solicitud de retorno (la negociación continúa normal). */
  async rejectReturn(transferId: string, notes: string | undefined, actorId: string, actorRole: Role) {
    if (!['tse', 'admin'].includes(actorRole)) throw new ForbiddenException('Solo el TSE');
    const { data: transfer } = await this.supabase.admin.from('transfers').select('*').eq('id', transferId).single();
    if (!transfer || !transfer.return_requested_at) throw new BadRequestException();

    const { data: updated, error } = await this.supabase.admin
      .from('transfers').update({
        return_rejected_at: new Date().toISOString(),
        return_rejected_by: actorId,
        return_tse_notes: notes?.trim() || null,
      }).eq('id', transferId).select().single();
    if (error) throw new BadRequestException(error.message);
    return updated;
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

  async findMyTransfers(actorId: string, actorRole: Role, page?: string, limit?: string) {
    const { page: p, limit: l, from, to } = parsePagination(page, limit);
    let q = this.supabase.admin
      .from('transfers')
      .select('*, bonds!inner(bond_id, status, face_value, issuer_party_id), from_profile:profiles!transfers_from_owner_fkey(id, full_name, email), to_profile:profiles!transfers_to_owner_fkey(id, full_name, email)', { count: 'exact' })
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
    const { data, count, error } = await q.range(from, to);
    if (error) throw new BadRequestException(error.message);
    return paginatedResponse(data ?? [], count ?? 0, p, l);
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
