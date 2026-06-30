import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { SupabaseService } from '../common/supabase/supabase.service';
import {
  EXPLORER_NETWORK,
  explorerAccountUrl,
  explorerAssetUrl,
  explorerContractUrl,
} from '../escrow/stellar.config';
import { WalletService } from '../escrow/wallet.service';

/**
 * Endpoints PÚBLICOS (sin auth) para el explorador del ledger de VELAR.
 * Cualquiera puede consultarlos para verificar el estado on-chain.
 */
@Public()
@Controller('explorer')
export class ExplorerController {
  constructor(
    private supabase: SupabaseService,
    private wallets: WalletService,
  ) {}

  @Get('snapshot')
  async snapshot() {
    const db = this.supabase.admin;
    const issuer = this.wallets.platformAddress ?? '';
    const escrow = this.wallets.escrowAddress ?? '';

    const [bondsRes, transfersRes, partiesRes, sorobanRes, twRes] = await Promise.all([
      db.from('bonds').select('bond_id, status, face_value, currency, soroban_contract_id, created_at, parties(name)').order('created_at', { ascending: false }).limit(20),
      db.from('transfers').select('id, amount, status, created_at, bonds(bond_id), escrow_contract_id').order('created_at', { ascending: false }).limit(20),
      db.from('parties').select('id, name, code, stellar_wallet'),
      db.from('bonds').select('soroban_contract_id, bond_id').not('soroban_contract_id', 'is', null).order('created_at', { ascending: false }).limit(10),
      db.from('transfers').select('escrow_contract_id, id, status, bonds(bond_id)').not('escrow_contract_id', 'is', null).order('created_at', { ascending: false }).limit(10),
    ]);

    const bonds = bondsRes.data ?? [];
    const transfers = transfersRes.data ?? [];
    const liberadas = transfers.filter((t: any) => t.status === 'liberada');
    const totalVolume = liberadas.reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
    const totalEmitted = bonds.reduce((s: number, b: any) => s + (Number(b.face_value) || 0), 0);

    return {
      network: EXPLORER_NETWORK,

      // Accounts críticas
      platform_account: {
        address: issuer,
        explorer_url: explorerAccountUrl(issuer),
      },
      escrow_account: {
        address: escrow,
        explorer_url: explorerAccountUrl(escrow),
      },

      // Assets emitidos por la plataforma
      assets: {
        vcrc: {
          symbol: 'VCRC',
          issuer,
          purpose: 'Representación on-chain del precio de cada venta en colones',
          explorer_url: explorerAssetUrl('VCRC', issuer),
        },
      },

      // Resumen
      stats: {
        total_bonds: bonds.length,
        total_emitted_crc: totalEmitted,
        total_sales: liberadas.length,
        total_volume_crc: totalVolume,
        sorobanContracts: (sorobanRes.data ?? []).length,
        trustlessWorkContracts: (twRes.data ?? []).length,
      },

      // Últimos bonos (con link al asset y al contrato Soroban si tienen)
      recent_bonds: bonds.map((b: any) => ({
        bond_id: b.bond_id,
        party: b.parties?.name,
        face_value: b.face_value,
        currency: b.currency ?? 'CRC',
        status: b.status,
        asset_url: explorerAssetUrl(assetCode(b.bond_id), issuer),
        soroban_contract_url: b.soroban_contract_id
          ? explorerContractUrl(b.soroban_contract_id)
          : null,
        soroban_contract_id: b.soroban_contract_id,
      })),

      // Últimos contratos Soroban VelarBond (NFT del bono)
      soroban_nfts: (sorobanRes.data ?? []).map((b: any) => ({
        bond_id: b.bond_id,
        contract_id: b.soroban_contract_id,
        url: explorerContractUrl(b.soroban_contract_id),
      })),

      // Últimos contratos Trustless Work (escrow de coordinación)
      trustless_work_contracts: (twRes.data ?? []).map((t: any) => ({
        transfer_id: t.id,
        bond_id: t.bonds?.bond_id,
        status: t.status,
        contract_id: t.escrow_contract_id,
        url: explorerContractUrl(t.escrow_contract_id),
      })),

      // Glosario de memos para que cualquiera entienda las txs
      memo_glossary: [
        { prefix: 'VELAR:issue:', meaning: 'Emisión inicial de un bono al partido emisor' },
        { prefix: 'escrow:',      meaning: 'Token del bono bloqueado en escrow durante una venta' },
        { prefix: 'sold:',        meaning: 'Token liberado al comprador + monto pagado en CRC' },
        { prefix: 'return:',      meaning: 'Bono devuelto al dueño original (cancelación TSE)' },
        { prefix: 'bond:',        meaning: 'Pago de VCRC vinculado a una venta específica' },
      ],
    };
  }
}

function assetCode(bondId: string): string {
  const code = bondId.replace(/[^A-Za-z0-9]/g, '').slice(0, 12);
  return code || 'BOND';
}
