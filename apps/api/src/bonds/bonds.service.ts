import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { StellarBondService } from '../escrow/stellar-bond.service';
import { SorobanBondService } from '../escrow/soroban-bond.service';
import { WalletService } from '../escrow/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterBondInput, BondRequestInput, BondStatus, Role, AuditEventType, NotificationType } from '@velar/types';

/** Roles de AUTORIDAD: ven todo y emiten bonos. Solo el TSE (y admin) emite. */
export const AUTHORITY: Role[] = ['tse', 'admin'];

type BondRow = {
  token_id: string;
  bond_id: string;
  status?: string | null;
  stellar_status?: string | null;
  stellar_transaction_hash?: string | null;
  stellar_asset_code?: string | null;
  stellar_ledger?: number | null;
  stellar_issuer_public_key?: string | null;
  stellar_owner_public_key?: string | null;
  stellar_registered_at?: string | null;
  stellar_error?: string | null;
  document_hash?: string | null;
};

function sorobanReadErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Error(Contract, #2)')) {
    return 'Contrato desplegado, pero initialize no terminó. La metadata on-chain todavía no está disponible.';
  }
  if (message.includes('No se pudo leer el contrato')) {
    return 'No se pudo leer la metadata on-chain del contrato.';
  }
  return message.split('\n')[0].slice(0, 220);
}

function resolveDocumentHash(value?: string | null): string {
  if (typeof value === 'string' && /^[a-fA-F0-9]{64}$/.test(value)) return value.toLowerCase();
  return crypto.createHash('sha256').update(`bond-document-unavailable:${value ?? 'none'}`).digest('hex');
}

@Injectable()
export class BondsService {
  private readonly logger = new Logger(BondsService.name);

  constructor(
    private supabase: SupabaseService,
    private audit: AuditService,
    private stellar: StellarBondService,
    private wallets: WalletService,
    private soroban: SorobanBondService,
    private notifications: NotificationsService,
  ) {}

  /**
   * Despliega el bono como contrato Soroban si está habilitado.
   * Si falla o no está habilitado, no rompe el flujo (Classic Asset sigue).
   * Guarda contractId + initTxHash en la fila del bono.
   */
  private async deploySorobanIfEnabled(bond: any, partyId: string, partyOwnerWallet: string | null) {
    if (!this.soroban.enabled || !partyOwnerWallet) return;
    try {
      const docHash = resolveDocumentHash(bond.document_hash);

      const r = await this.soroban.deployBond({
        partyOwner: partyOwnerWallet,
        partyId,
        bondId: bond.bond_id,
        certificateNumber: bond.certificate_number ?? '',
        series: bond.series ?? 'A',
        faceValue: Number(bond.face_value) || 0,
        currency: bond.currency ?? 'CRC',
        interestRateBps: Math.round(Number(bond.interest_rate ?? 0) * 100),
        issueDate: bond.issue_date ? Math.floor(new Date(bond.issue_date).getTime() / 1000) : Math.floor(Date.now() / 1000),
        maturityDate: bond.maturity_date ? Math.floor(new Date(bond.maturity_date).getTime() / 1000) : 0,
        documentHash: docHash,
      });

      await this.supabase.admin
        .from('bonds')
        .update({
          soroban_contract_id: r.contractId,
          soroban_init_tx_hash: r.initTxHash,
        })
        .eq('token_id', bond.token_id);

      this.logger.log(`Bono ${bond.bond_id} ahora vive como Soroban ${r.contractId}`);
    } catch (e) {
      this.logger.warn(`Soroban deploy falló (sigue Classic): ${(e as Error).message}`);
    }
  }

  /** Cuenta (profile emisor) del partido, dueña inicial de los bonos a su nombre. */
  private async partyOwner(partyId: string) {
    const [{ data: owner }, { data: party }] = await Promise.all([
      this.supabase.admin
        .from('profiles').select('id, email, stellar_wallet')
        .eq('role', 'emisor').eq('party_id', partyId).limit(1).maybeSingle(),
      this.supabase.admin
        .from('parties').select('id, code, stellar_wallet')
        .eq('id', partyId).maybeSingle(),
    ]);
    if (!owner) return null;

    let partyWallet = party?.stellar_wallet ?? null;
    if (!partyWallet) {
      try {
        const wallet = await this.wallets.createWalletRecord(`party:${party?.code ?? partyId}`);
        partyWallet = wallet.publicKey;
        await this.supabase.admin.from('parties').update({
          stellar_wallet: wallet.publicKey,
          stellar_wallet_status: wallet.status,
          stellar_network: wallet.network,
          stellar_created_at: new Date().toISOString(),
          stellar_wallet_error: wallet.error ?? null,
        }).eq('id', partyId);
      } catch (e) {
        this.logger.warn(`partyOwner wallet failed: ${(e as Error).message}`);
      }
    }

    if (partyWallet && owner.stellar_wallet !== partyWallet) {
      await this.supabase.admin.from('profiles').update({
        stellar_wallet: partyWallet,
        stellar_wallet_status: 'funded',
        stellar_network: 'testnet',
        stellar_created_at: new Date().toISOString(),
        stellar_wallet_error: null,
      }).eq('id', owner.id);
    }

    return { ...owner, stellar_wallet: partyWallet ?? owner.stellar_wallet ?? null };
  }

  /** Asegura que un profile tenga wallet de custodia; la crea si falta. */
  private async ensureWallet(profileId: string): Promise<string | null> {
    const { data } = await this.supabase.admin
      .from('profiles').select('stellar_wallet, email').eq('id', profileId).single();
    if (data?.stellar_wallet) return data.stellar_wallet;
    try {
      const pk = await this.wallets.createWallet(data?.email ?? profileId);
      await this.supabase.admin.from('profiles').update({
        stellar_wallet: pk,
        stellar_wallet_status: 'created',
        stellar_network: 'testnet',
        stellar_created_at: new Date().toISOString(),
      }).eq('id', profileId);
      return pk;
    } catch (e) {
      this.logger.warn(`ensureWallet falló: ${(e as Error).message}`);
      return null;
    }
  }

  private async markStellarDisabled(tokenId: string) {
    await this.supabase.admin
      .from('bonds')
      .update({ status: BondStatus.PENDIENTE, stellar_status: 'pending', stellar_error: 'Stellar no esta habilitado' })
      .eq('token_id', tokenId);
  }

  private async issueApprovedBondOnchain(bond: BondRow, ownerId: string) {
    if (!this.stellar.enabled) {
      await this.markStellarDisabled(bond.token_id);
      return undefined;
    }

    const ownerWallet = await this.ensureWallet(ownerId);
    if (!ownerWallet) {
      await this.supabase.admin
        .from('bonds')
        .update({ status: BondStatus.PENDIENTE, stellar_status: 'failed', stellar_error: 'El dueno no tiene wallet Stellar' })
        .eq('token_id', bond.token_id);
      return undefined;
    }

    await this.supabase.admin
      .from('bonds')
      .update({ stellar_status: 'submitted', stellar_error: null })
      .eq('token_id', bond.token_id);

    try {
      const res = await this.stellar.issueBond(bond.bond_id, ownerWallet);
      await this.supabase.admin
        .from('bonds')
        .update({
          status: BondStatus.ACTIVO,
          stellar_status: 'confirmed',
          stellar_transaction_hash: res.txHash,
          stellar_ledger: res.ledger,
          stellar_asset_code: res.assetCode,
          stellar_issuer_public_key: res.issuer,
          stellar_owner_public_key: res.owner,
          stellar_registered_at: new Date().toISOString(),
          stellar_error: null,
        })
        .eq('token_id', bond.token_id);
      return res;
    } catch (e) {
      const message = (e as Error).message;
      await this.supabase.admin
        .from('bonds')
        .update({ status: BondStatus.PENDIENTE, stellar_status: 'failed', stellar_error: message })
        .eq('token_id', bond.token_id);
      this.logger.warn(`issueBond on-chain falló: ${message}`);
      return undefined;
    }
  }

  async register(input: RegisterBondInput, actorId: string, actorRole: Role) {
    // Solo el TSE (autoridad) emite bonos, a nombre de un partido.
    if (!AUTHORITY.includes(actorRole)) {
      throw new ForbiddenException('Solo el TSE puede emitir bonos');
    }
    // El bono se emite A NOMBRE de un partido: dueño inicial = la cuenta del partido.
    const party = await this.partyOwner(input.issuerPartyId);
    if (!party) {
      throw new BadRequestException('Ese partido no tiene cuenta registrada. Registrá el partido primero.');
    }
    const owner = party.id;

    const { data, error } = await this.supabase.admin
      .from('bonds')
      .insert({
        bond_id: input.bondId,
        issuer_party_id: input.issuerPartyId,
        document_hash: input.documentHash,
        metadata_uri: input.metadataUri ?? null,
        face_value: input.faceValue ?? null,
        current_owner: owner,
        status: BondStatus.PENDIENTE,
      })
      .select()
      .single();
    if (error) {
      if (error.code === '23505' || /duplicate/i.test(error.message)) {
        throw new BadRequestException(`Ya existe un bono con el número "${input.bondId}". Usá otro.`);
      }
      throw new BadRequestException(error.message);
    }

    // Emite el TOKEN del bono on-chain (Stellar testnet) hacia la wallet del partido.
    const stellarResult = await this.issueApprovedBondOnchain(data, owner);
    const txHash = stellarResult?.txHash;
    // Si Soroban está habilitado, también despliega el contrato del bono.
    await this.deploySorobanIfEnabled(data, input.issuerPartyId, party.stellar_wallet ?? null);
    if (stellarResult) {
      await this.audit.emit({
        type: AuditEventType.BOND_EMITIDO,
        bondTokenId: data.token_id,
        actorId,
        payload: {
          bondId: data.bond_id,
          issuerPartyId: data.issuer_party_id,
          assetCode: stellarResult.assetCode,
          issuer: stellarResult.issuer,
          holder: stellarResult.owner,
        },
        txHash,
      });
      await this.audit.emit({
        type: AuditEventType.BOND_ASIGNADO,
        bondTokenId: data.token_id,
        actorId,
        payload: { owner, party: input.issuerPartyId, holder: stellarResult.owner },
        txHash,
      });
    }
    const { data: updated } = await this.supabase.admin
      .from('bonds')
      .select('*')
      .eq('token_id', data.token_id)
      .single();
    return updated ?? data;
  }

  async findAll(actorId: string, actorRole: Role, partyId?: string) {
    let q = this.supabase.admin
      .from('bonds')
      .select('*, parties(*), profiles!bonds_current_owner_fkey(id, full_name, email)')
      .order('created_at', { ascending: false });

    if (AUTHORITY.includes(actorRole)) {
      // TSE/admin ven todo
    } else if (actorRole === 'emisor' && partyId) {
      // El partido ve solo los bonos emitidos a su partido
      q = q.eq('issuer_party_id', partyId);
    } else {
      // Comprador ve solo los bonos que posee
      q = q.eq('current_owner', actorId);
    }
    const { data } = await q;
    return data ?? [];
  }

  /** Solicitudes de bono enviadas por el partido. */
  async findRequests(actorId: string, actorRole: Role, partyId?: string) {
    let q = this.supabase.admin
      .from('bond_requests')
      .select('*, parties(id, name, code)')
      .order('created_at', { ascending: false });

    if (AUTHORITY.includes(actorRole)) {
      // TSE ve todas las solicitudes pendientes
    } else if (partyId) {
      q = q.eq('party_id', partyId);
    } else {
      q = q.eq('requested_by', actorId);
    }
    const { data } = await q;
    return data ?? [];
  }

  /** El partido solicita un bono al TSE. */
  async requestBond(input: BondRequestInput, actorId: string, partyId: string) {
    const { data, error } = await this.supabase.admin
      .from('bond_requests')
      .insert({
        party_id: partyId,
        requested_by: actorId,
        certificate_number: input.certificateNumber ?? null,
        face_value: input.faceValue,
        currency: input.currency ?? 'CRC',
        interest_rate: input.interestRate ?? null,
        series: input.series ?? null,
        issue_date: input.issueDate ?? null,
        maturity_date: input.maturityDate ?? null,
        notes: input.notes ?? null,
        status: 'pendiente',
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /** TSE aprueba una solicitud  a  crea el bono con los datos del partido. */
  async approveRequest(requestId: string, actorId: string, actorRole: Role) {
    this.logger.log(`approveRequest: actorId=${actorId} actorRole=${JSON.stringify(actorRole)}`);
    // Normaliza por si el role viene con mayúsculas o espacios desde la BD
    const roleNorm = (actorRole as string)?.trim().toLowerCase() as Role;
    if (!AUTHORITY.includes(roleNorm)) throw new ForbiddenException(`Solo el TSE puede aprobar solicitudes (rol actual: ${actorRole})`);

    const { data: req, error: reqErr } = await this.supabase.admin
      .from('bond_requests').select('*, parties(*)').eq('id', requestId).single();
    if (reqErr || !req) throw new NotFoundException('Solicitud no encontrada');
    if (req.status !== 'pendiente') throw new BadRequestException('La solicitud ya fue procesada');

    // Obtener dueño del partido
    const owner = await this.partyOwner(req.party_id);
    if (!owner) throw new BadRequestException('El partido no tiene cuenta registrada');

    const bondId = `SOL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
    const docHash = BondsService.hashDocument(`${bondId}:${req.party_id}:${Date.now()}`);

    const { data: bond, error: bondErr } = await this.supabase.admin
      .from('bonds')
      .insert({
        bond_id: bondId,
        issuer_party_id: req.party_id,
        current_owner: owner.id,
        status: BondStatus.PENDIENTE,
        document_hash: docHash,
        face_value: req.face_value,
        certificate_number: req.certificate_number,
        currency: req.currency ?? 'CRC',
        interest_rate: req.interest_rate,
        series: req.series,
        issue_date: req.issue_date,
        maturity_date: req.maturity_date,
      })
      .select()
      .single();
    if (bondErr) throw new BadRequestException(bondErr.message);

    const stellarResult = await this.issueApprovedBondOnchain(bond, owner.id);
    await this.deploySorobanIfEnabled(bond, req.party_id, owner.stellar_wallet ?? null);
    if (stellarResult) {
      await this.audit.emit({
        type: AuditEventType.BOND_EMITIDO,
        bondTokenId: bond.token_id,
        actorId,
        payload: {
          bondId: bond.bond_id,
          issuerPartyId: bond.issuer_party_id,
          requestId,
          assetCode: stellarResult.assetCode,
          issuer: stellarResult.issuer,
          holder: stellarResult.owner,
        },
        txHash: stellarResult.txHash,
      });
      await this.audit.emit({
        type: AuditEventType.BOND_ASIGNADO,
        bondTokenId: bond.token_id,
        actorId,
        payload: { owner: owner.id, party: req.party_id, requestId, holder: stellarResult.owner },
        txHash: stellarResult.txHash,
      });
      await this.notifications.emit(req.requested_by, NotificationType.BOND_APPROVED, {
        requestId,
        bondTokenId: bond.token_id,
        bondId: bond.bond_id,
        faceValue: req.face_value,
      });
    }

    await this.supabase.admin
      .from('bond_requests')
      .update({
        status: stellarResult ? 'aprobado' : 'pendiente',
        bond_token_id: bond.token_id,
        reviewed_by: stellarResult ? actorId : null,
        reviewed_at: stellarResult ? new Date().toISOString() : null,
      })
      .eq('id', requestId);

    const { data: updatedBond } = await this.supabase.admin
      .from('bonds')
      .select('*')
      .eq('token_id', bond.token_id)
      .single();
    return updatedBond ?? bond;
  }

  /** TSE rechaza una solicitud. */
  async rejectRequest(requestId: string, reason: string, actorId: string, actorRole: Role) {
    const roleNorm = (actorRole as string)?.trim().toLowerCase() as Role;
    if (!AUTHORITY.includes(roleNorm)) throw new ForbiddenException(`Solo el TSE puede rechazar solicitudes (rol actual: ${actorRole})`);
    const { data: req, error: findError } = await this.supabase.admin
      .from('bond_requests')
      .select('id, bond_token_id, requested_by')
      .eq('id', requestId)
      .single();
    if (findError || !req) throw new NotFoundException('Solicitud no encontrada');

    const { error } = await this.supabase.admin
      .from('bond_requests')
      .update({ status: 'rechazado', rejection_reason: reason, reviewed_by: actorId, reviewed_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw new BadRequestException(error.message);
    await this.audit.emit({
      type: AuditEventType.TRANSFER_RECHAZADA,
      bondTokenId: req.bond_token_id ?? undefined,
      actorId,
      payload: { requestId, reason, entity: 'bond_request' },
    });
    await this.notifications.emit(req.requested_by, NotificationType.BOND_REJECTED, {
      requestId,
      bondTokenId: req.bond_token_id ?? null,
      reason,
    });
    return { ok: true };
  }

  /** Vitrina: bonos disponibles para que un usuario solicite comprar (de otros dueños). */
  async findAvailable(actorId: string) {
    const { data } = await this.supabase.admin
      .from('bonds')
      .select('*, parties(*), profiles!bonds_current_owner_fkey(id, full_name, email)')
      .eq('status', BondStatus.EN_VENTA)
      .not('current_owner', 'is', null)
      .neq('current_owner', actorId)
      .order('created_at', { ascending: false });
    return data ?? [];
  }

  async findOne(tokenId: string, actorId: string, actorRole: Role) {
    const { data, error } = await this.supabase.admin
      .from('bonds')
      .select('*, parties(*), profiles!bonds_current_owner_fkey(id, full_name, email)')
      .eq('token_id', tokenId)
      .single();
    if (error || !data) throw new NotFoundException('Bond not found');
    // Autoridad ve cualquiera; un usuario ve los suyos o los disponibles (activos de otros).
    if (!AUTHORITY.includes(actorRole)) {
      const visible = data.current_owner === actorId || [BondStatus.ACTIVO, BondStatus.EN_VENTA].includes(data.status);
      if (!visible) throw new ForbiddenException();
    }
    return data;
  }

  /** Re-emite el token on-chain para un bono que existe en BD pero no en Stellar. */
  async issueOnchain(tokenId: string, actorId: string, actorRole: Role) {
    if (!AUTHORITY.includes((actorRole as string)?.trim().toLowerCase() as Role)) {
      throw new ForbiddenException('Solo el TSE puede emitir on-chain');
    }
    const { data: bond } = await this.supabase.admin
      .from('bonds').select('*, profiles!bonds_current_owner_fkey(id, stellar_wallet)').eq('token_id', tokenId).single();
    if (!bond) throw new NotFoundException('Bono no encontrado');
    if (!this.stellar.enabled) throw new BadRequestException('Stellar no está habilitado');

    const bondWithOwner = bond as BondRow & { current_owner: string; profiles?: { stellar_wallet?: string | null } | null };
    const ownerWallet = bondWithOwner.profiles?.stellar_wallet ?? await this.ensureWallet(bondWithOwner.current_owner);
    if (!ownerWallet) throw new BadRequestException('El dueño no tiene wallet Stellar');

    // Idempotencia: si ya está confirmado, no re-emitir.
    if ((bond as any).stellar_status === 'confirmed' && (bond as any).stellar_transaction_hash) {
      this.logger.log(`Bono ${bond.bond_id} ya estaba emitido on-chain. No se re-emite.`);
      return { ok: true, alreadyIssued: true, txHash: (bond as any).stellar_transaction_hash, explorerUrl: this.stellar.explorerUrl(bond.bond_id) };
    }

    try {
      const res = await this.stellar.issueBond(bond.bond_id, ownerWallet);
      await this.supabase.admin.from('bonds').update({
        status: BondStatus.ACTIVO,
        stellar_status: 'confirmed',
        stellar_transaction_hash: res.txHash,
        stellar_ledger: res.ledger,
        stellar_asset_code: res.assetCode,
        stellar_issuer_public_key: res.issuer,
        stellar_owner_public_key: res.owner,
        stellar_registered_at: new Date().toISOString(),
        stellar_error: null,
      }).eq('token_id', tokenId);
      const txHash = res.txHash;
      await this.audit.emit({ type: AuditEventType.BOND_ASIGNADO, bondTokenId: tokenId, actorId, payload: { onchain: true }, txHash });
      return { ok: true, txHash, explorerUrl: this.stellar.explorerUrl(bond.bond_id) };
    } catch (e: any) {
      // Stellar Horizon devuelve detalles útiles en e.response.data.extras
      const codes = e?.response?.data?.extras?.result_codes;
      let msg = e.message;
      if (codes) {
        const op = codes.operations?.[0];
        if (op === 'op_line_full' || op === 'op_underfunded') {
          msg = 'Este bono ya tiene un token emitido al dueño (la trustline está llena). Probá emitir un bono nuevo en vez de re-emitir éste.';
        } else if (op === 'op_no_trust') {
          msg = 'El dueño no tiene trustline para este asset. Necesita crearla primero.';
        } else {
          msg = `Stellar rechazó la operación: ${JSON.stringify(codes)}`;
        }
      }
      await this.supabase.admin.from('bonds').update({ stellar_error: msg }).eq('token_id', tokenId);
      throw new BadRequestException(msg);
    }
  }

  /**
   * Lee los datos del contrato Soroban directamente de la cadena y los devuelve
   * en formato legible (no crudo como en Stellar Expert).
   */
  async readSorobanDetails(tokenId: string, _actorId: string, _actorRole: Role) {
    const { data: bond } = await this.supabase.admin
      .from('bonds')
      .select(`
        soroban_contract_id,
        soroban_init_tx_hash,
        bond_id,
        certificate_number,
        series,
        face_value,
        currency,
        interest_rate,
        issue_date,
        maturity_date,
        document_hash,
        current_owner,
        status,
        created_at,
        parties(name, code),
        profiles!bonds_current_owner_fkey(stellar_wallet)
      `)
      .eq('token_id', tokenId).single();
    if (!bond) throw new NotFoundException('Bono no encontrado');
    if (!(bond as any).soroban_contract_id) {
      throw new BadRequestException('Este bono no tiene contrato Soroban desplegado');
    }

    const fallback = (reason: string) => ({
      source: 'database_snapshot',
      read_error: reason,
      contract_id: (bond as any).soroban_contract_id,
      init_tx_hash: (bond as any).soroban_init_tx_hash ?? null,
      bond_id: (bond as any).bond_id,
      certificate_number: (bond as any).certificate_number ?? null,
      series: (bond as any).series ?? null,
      face_value: (bond as any).face_value != null ? Number((bond as any).face_value) : null,
      currency: (bond as any).currency ?? 'CRC',
      interest_rate: (bond as any).interest_rate != null ? Number((bond as any).interest_rate) : null,
      issue_date: (bond as any).issue_date ?? null,
      maturity_date: (bond as any).maturity_date ?? null,
      document_hash_hex: (bond as any).document_hash ?? null,
      current_owner: (bond as any).profiles?.stellar_wallet ?? (bond as any).current_owner ?? null,
      status: (bond as any).status ?? null,
      created_at: (bond as any).created_at ?? null,
      party_name: (bond as any).parties?.name ?? null,
      party_code: (bond as any).parties?.code ?? null,
    });

    if (!this.soroban.enabled) return fallback('Soroban no habilitado en el backend');

    try {
      const raw: any = await this.soroban.readDetails((bond as any).soroban_contract_id);
      // Convertir datos crudos del contrato a formato amigable
      return {
        source: 'soroban',
        read_error: null,
        contract_id: (bond as any).soroban_contract_id,
        init_tx_hash: (bond as any).soroban_init_tx_hash ?? null,
        bond_id: raw?.bond_id ?? bond.bond_id,
        certificate_number: raw?.certificate_number ?? null,
        series: raw?.series ?? null,
        face_value: raw?.face_value != null ? Number(raw.face_value) : null,
        currency: typeof raw?.currency === 'string' ? raw.currency : 'CRC',
        interest_rate: raw?.interest_rate_bps != null ? Number(raw.interest_rate_bps) / 100 : null,
        issue_date: raw?.issue_date ? new Date(Number(raw.issue_date) * 1000).toISOString() : null,
        maturity_date: raw?.maturity_date ? new Date(Number(raw.maturity_date) * 1000).toISOString() : null,
        document_hash_hex: raw?.document_hash
          ? Buffer.from(raw.document_hash).toString('hex')
          : null,
        current_owner: raw?.current_owner ?? null,
        status: raw?.status ?? null,
        created_at: raw?.created_at ? new Date(Number(raw.created_at) * 1000).toISOString() : null,
        party_name: (bond as any).parties?.name ?? null,
        party_code: (bond as any).parties?.code ?? null,
      };
    } catch (e) {
      return fallback(sorobanReadErrorMessage(e));
    }
  }

  /** El partido publica su bono en el marketplace (status activo  a  en_venta). */
  async publish(tokenId: string, actorId: string) {
    // Solo el DUEÑO ACTUAL puede publicar el bono al marketplace.
    // Ni el partido emisor (si ya lo vendió) ni el TSE pueden publicarlo: solo trazabilidad.
    const { data: bond, error: findErr } = await this.supabase.admin
      .from('bonds').select('*, parties(*)').eq('token_id', tokenId).single();
    if (findErr || !bond) throw new NotFoundException('Bono no encontrado');

    if (bond.current_owner !== actorId) {
      throw new ForbiddenException('Solo el dueño actual del bono puede publicarlo al marketplace');
    }
    if (!['activo', 'aprobado', 'emitido'].includes(bond.status)) {
      throw new BadRequestException(`No se puede publicar un bono con estado "${bond.status}"`);
    }
    const { data, error } = await this.supabase.admin
      .from('bonds').update({ status: BondStatus.EN_VENTA }).eq('token_id', tokenId).select().single();
    if (error) throw new BadRequestException(error.message);
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

  private async walletOf(profileId: string): Promise<string | null> {
    const { data } = await this.supabase.admin
      .from('profiles').select('stellar_wallet').eq('id', profileId).single();
    return data?.stellar_wallet ?? null;
  }

  /** Dueño actual del bono on-chain + link al activo en el explorador. */
  async onchainInfo(tokenId: string, actorId: string, actorRole: Role) {
    const bond = await this.findOne(tokenId, actorId, actorRole) as BondRow;
    if (!this.stellar.enabled) return { enabled: false };
    const holder = await this.stellar.currentHolder(bond.bond_id).catch(() => null);
    return {
      enabled: true,
      assetCode: this.stellar.assetCodeFor(bond.bond_id),
      onchainHolder: holder,
      assetExplorer: this.stellar.explorerUrl(bond.bond_id),
      stellarStatus: bond.stellar_status,
      transactionHash: bond.stellar_transaction_hash,
      ledger: bond.stellar_ledger,
      issuer: bond.stellar_issuer_public_key,
      owner: bond.stellar_owner_public_key,
      registeredAt: bond.stellar_registered_at,
      error: bond.stellar_error,
      transactionExplorer: bond.stellar_transaction_hash
        ? this.stellar.txExplorerUrl(bond.stellar_transaction_hash)
        : null,
    };
  }

  static hashDocument(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
