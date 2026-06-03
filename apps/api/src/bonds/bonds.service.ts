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
import { RegisterBondInput, BondStatus, Role, AuditEventType } from '@velar/types';

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

  async findAll(actorId: string, actorRole: Role) {
    let q = this.supabase.admin
      .from('bonds')
      .select('*, parties(*), profiles!bonds_current_owner_fkey(id, full_name, email)')
      .order('created_at', { ascending: false });

    // La autoridad ve TODO; un usuario ve solo los bonos que posee.
    if (!AUTHORITY.includes(actorRole)) {
      q = q.eq('current_owner', actorId);
    }
    const { data } = await q;
    return data ?? [];
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
