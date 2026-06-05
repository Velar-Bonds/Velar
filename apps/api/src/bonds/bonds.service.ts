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
import { WalletService } from '../escrow/wallet.service';
import { RegisterBondInput, BondRequestInput, BondStatus, Role, AuditEventType } from '@velar/types';

/** Roles de AUTORIDAD: ven todo y emiten bonos. Solo el TSE (y admin) emite. */
export const AUTHORITY: Role[] = ['tse', 'admin'];

@Injectable()
export class BondsService {
  private readonly logger = new Logger(BondsService.name);

  constructor(
    private supabase: SupabaseService,
    private audit: AuditService,
    private stellar: StellarBondService,
    private wallets: WalletService,
  ) {}

  /** Cuenta (profile emisor) del partido, dueña inicial de los bonos a su nombre. */
  private async partyOwner(partyId: string) {
    const { data } = await this.supabase.admin
      .from('profiles').select('id, stellar_wallet')
      .eq('role', 'emisor').eq('party_id', partyId).limit(1).maybeSingle();
    return data;
  }

  /** Asegura que un profile tenga wallet de custodia; la crea si falta. */
  private async ensureWallet(profileId: string): Promise<string | null> {
    const { data } = await this.supabase.admin
      .from('profiles').select('stellar_wallet, email').eq('id', profileId).single();
    if (data?.stellar_wallet) return data.stellar_wallet;
    try {
      const pk = await this.wallets.createWallet(data?.email ?? profileId);
      await this.supabase.admin.from('profiles').update({ stellar_wallet: pk }).eq('id', profileId);
      return pk;
    } catch (e) {
      this.logger.warn(`ensureWallet falló: ${(e as Error).message}`);
      return null;
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
        status: BondStatus.ACTIVO,
      })
      .select()
      .single();
    if (error) {
      if (error.code === '23505' || /duplicate/i.test(error.message)) {
        throw new BadRequestException(`Ya existe un bono con el número "${input.bondId}". Usá otro.`);
      }
      throw new BadRequestException(error.message);
    }

    await this.audit.emit({
      type: AuditEventType.BOND_EMITIDO,
      bondTokenId: data.token_id,
      actorId,
      payload: { bondId: data.bond_id, issuerPartyId: data.issuer_party_id },
    });

    // Emite el TOKEN del bono on-chain (Stellar testnet) hacia la wallet del partido.
    let txHash: string | undefined;
    if (this.stellar.enabled) {
      const ownerWallet = party.stellar_wallet ?? (await this.ensureWallet(owner));
      if (ownerWallet) {
        try {
          const res = await this.stellar.issueBond(data.bond_id, ownerWallet);
          txHash = res.txHash;
        } catch (e) {
          this.logger.warn(`issueBond on-chain falló (sigue en BD): ${(e as Error).message}`);
        }
      }
    }
    await this.audit.emit({
      type: AuditEventType.BOND_ASIGNADO,
      bondTokenId: data.token_id,
      actorId,
      payload: { owner, party: input.issuerPartyId },
      txHash,
    });
    return data;
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
        certificate_number: (input as any).certificateNumber ?? null,
        face_value: input.faceValue,
        currency: input.currency ?? 'CRC',
        interest_rate: input.interestRate ?? null,
        series: input.series ?? null,
        issue_date: input.issueDate ?? null,
        maturity_date: input.maturityDate ?? null,
        notes: (input as any).notes ?? null,
        status: 'pendiente',
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /** TSE aprueba una solicitud → crea el bono con los datos del partido. */
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
        status: BondStatus.ACTIVO,
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

    await this.supabase.admin
      .from('bond_requests')
      .update({ status: 'aprobado', bond_token_id: bond.token_id, reviewed_by: actorId, reviewed_at: new Date().toISOString() })
      .eq('id', requestId);

    return bond;
  }

  /** TSE rechaza una solicitud. */
  async rejectRequest(requestId: string, reason: string, actorId: string, actorRole: Role) {
    const roleNorm = (actorRole as string)?.trim().toLowerCase() as Role;
    if (!AUTHORITY.includes(roleNorm)) throw new ForbiddenException(`Solo el TSE puede rechazar solicitudes (rol actual: ${actorRole})`);
    const { error } = await this.supabase.admin
      .from('bond_requests')
      .update({ status: 'rechazado', rejection_reason: reason, reviewed_by: actorId, reviewed_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw new BadRequestException(error.message);
    return { ok: true };
  }

  /** Vitrina: bonos disponibles para que un usuario solicite comprar (de otros dueños). */
  async findAvailable(actorId: string) {
    const { data } = await this.supabase.admin
      .from('bonds')
      .select('*, parties(*), profiles!bonds_current_owner_fkey(id, full_name, email)')
      .eq('status', BondStatus.ACTIVO)
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
      const visible = data.current_owner === actorId || data.status === BondStatus.ACTIVO;
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

    const ownerWallet = (bond as any).profiles?.stellar_wallet ?? await this.ensureWallet(bond.current_owner);
    if (!ownerWallet) throw new BadRequestException('El dueño no tiene wallet Stellar');

    try {
      const { txHash } = await this.stellar.issueBond(bond.bond_id, ownerWallet);
      await this.audit.emit({ type: AuditEventType.BOND_ASIGNADO, bondTokenId: tokenId, actorId, payload: { onchain: true }, txHash });
      return { ok: true, txHash, explorerUrl: this.stellar.explorerUrl(bond.bond_id) };
    } catch (e: any) {
      throw new BadRequestException(`Error al emitir on-chain: ${e.message}`);
    }
  }

  /** El partido publica su bono en el marketplace (status activo → en_venta). */
  async publish(tokenId: string, actorId: string) {
    // Obtener el bono + perfil del actor para verificar que pertenece al mismo partido
    const { data: bond, error: findErr } = await this.supabase.admin
      .from('bonds').select('*, parties(*)').eq('token_id', tokenId).single();
    if (findErr || !bond) throw new NotFoundException('Bono no encontrado');

    const { data: actor } = await this.supabase.admin
      .from('profiles').select('party_id, role').eq('id', actorId).single();

    const isOwner = bond.current_owner === actorId;
    const isSameParty = actor?.party_id && actor.party_id === bond.issuer_party_id;
    const isAuthority = ['tse', 'admin'].includes(actor?.role);

    if (!isOwner && !isSameParty && !isAuthority) {
      throw new ForbiddenException('Solo el partido emisor puede publicar este bono');
    }
    if (!['activo', 'aprobado', 'emitido'].includes(bond.status)) {
      throw new BadRequestException(`No se puede publicar un bono con estado "${bond.status}"`);
    }
    const { data, error } = await this.supabase.admin
      .from('bonds').update({ status: 'en_venta' }).eq('token_id', tokenId).select().single();
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
    const bond = await this.findOne(tokenId, actorId, actorRole);
    if (!this.stellar.enabled) return { enabled: false };
    const holder = await this.stellar.currentHolder(bond.bond_id).catch(() => null);
    return {
      enabled: true,
      assetCode: this.stellar.assetCodeFor(bond.bond_id),
      onchainHolder: holder,
      assetExplorer: this.stellar.explorerUrl(bond.bond_id),
    };
  }

  static hashDocument(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
