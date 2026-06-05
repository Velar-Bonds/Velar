import { Injectable, Logger } from '@nestjs/common';
import {
  Asset, Horizon, Networks, Operation, TransactionBuilder, BASE_FEE,
} from '@stellar/stellar-sdk';
import { WalletService } from './wallet.service';

/**
 * Representa cada bono como un TOKEN real en Stellar (testnet).
 *
 * - El bono = un activo Stellar único (cantidad 1, no divisible) emitido por la
 *   cuenta plataforma/emisora.
 * - "Tener el bono" = tener ese activo en la cuenta de custodia del dueño.
 * - Transferir = mover el activo:  dueño -> canasta(escrow) -> nuevo dueño.
 * - La historia vive en el ledger de Stellar (pagos del activo), visible en
 *   stellar.expert y leíble por VELAR.
 *
 * Custodia asistida: el backend firma con las llaves (WalletService). El usuario
 * no maneja wallets. No hay dinero involucrado: solo se mueve el token del bono.
 */
const NETWORK = process.env.STELLAR_NETWORK ?? 'testnet';
const HORIZON = process.env.STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';
const NET = NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
const EXPLORER_NETWORK = NETWORK === 'mainnet' ? 'public' : 'testnet';

type StellarBalance = {
  asset_code?: string;
  asset_issuer?: string;
  balance?: string;
};

type StellarAssetAccount = {
  account_id?: string;
  balances: StellarBalance[];
};

@Injectable()
export class StellarBondService {
  private readonly logger = new Logger(StellarBondService.name);
  private readonly server = new Horizon.Server(HORIZON);

  constructor(private wallets: WalletService) {}

  get enabled(): boolean {
    return (
      this.wallets.enabled &&
      !!this.wallets.issuerAddress &&
      !!this.wallets.escrowAddress
    );
  }

  /** Código de activo Stellar a partir del bondId (alfanumérico, máx. 12). */
  assetCodeFor(bondId: string): string {
    const code = bondId.replace(/[^A-Za-z0-9]/g, '').slice(0, 12);
    return code || 'BOND';
  }

  private assetFor(bondId: string): Asset {
    return new Asset(this.assetCodeFor(bondId), this.wallets.issuerAddress!);
  }

  /** Explorador público para ver el activo del bono en la blockchain. */
  explorerUrl(bondId: string): string {
    return `https://stellar.expert/explorer/${EXPLORER_NETWORK}/asset/${this.assetCodeFor(bondId)}-${this.wallets.issuerAddress}`;
  }

  private async hasTrustline(account: string, asset: Asset): Promise<boolean> {
    const acc = await this.server.loadAccount(account);
    return acc.balances.some(
      (b: StellarBalance) => b.asset_code === asset.getCode() && b.asset_issuer === asset.getIssuer(),
    );
  }

  /** Asegura que `account` confíe en el activo (changeTrust), firmado en custodia. */
  private async ensureTrustline(account: string, asset: Asset): Promise<void> {
    if (await this.hasTrustline(account, asset)) return;
    const kp = this.wallets.keypairFor(account);
    const src = await this.server.loadAccount(account);
    const tx = new TransactionBuilder(src, { fee: BASE_FEE, networkPassphrase: NET })
      .addOperation(Operation.changeTrust({ asset, limit: '1' }))
      .setTimeout(60)
      .build();
    tx.sign(kp);
    await this.server.submitTransaction(tx);
  }

  /** Paga 1 unidad del activo de `from` a `to`, firmado por `from` (custodia). */
  private async payOne(from: string, to: string, asset: Asset): Promise<{ txHash: string; ledger: number }> {
    const kp = this.wallets.keypairFor(from);
    const src = await this.server.loadAccount(from);
    const tx = new TransactionBuilder(src, { fee: BASE_FEE, networkPassphrase: NET })
      .addOperation(Operation.payment({ destination: to, asset, amount: '1' }))
      .setTimeout(60)
      .build();
    tx.sign(kp);
    const res = await this.server.submitTransaction(tx);
    return { txHash: res.hash, ledger: res.ledger };
  }

  /**
   * Emite el token del bono: la emisora crea 1 unidad y la envía al dueño.
   * Devuelve el código del activo, la emisora y el hash de la transacción.
   */
  async issueBond(bondId: string, ownerAddress: string) {
    const asset = this.assetFor(bondId);
    await this.ensureTrustline(ownerAddress, asset);
    const { txHash, ledger } = await this.payOne(this.wallets.issuerAddress!, ownerAddress, asset);
    this.logger.log(`Bono ${bondId} emitido on-chain → ${ownerAddress} (${txHash})`);
    return { assetCode: asset.getCode(), issuer: asset.getIssuer(), owner: ownerAddress, txHash, ledger };
  }

  /** Mueve el token del dueño a la canasta de escrow (queda bloqueado). */
  async lockInEscrow(bondId: string, ownerAddress: string): Promise<string> {
    const asset = this.assetFor(bondId);
    await this.ensureTrustline(this.wallets.escrowAddress!, asset);
    const { txHash } = await this.payOne(ownerAddress, this.wallets.escrowAddress!, asset);
    this.logger.log(`Bono ${bondId} → escrow (${txHash})`);
    return txHash;
  }

  /** Libera el token de la canasta al nuevo dueño (confirmada la transferencia). */
  async releaseFromEscrow(bondId: string, newOwnerAddress: string): Promise<string> {
    const asset = this.assetFor(bondId);
    await this.ensureTrustline(newOwnerAddress, asset);
    const { txHash } = await this.payOne(this.wallets.escrowAddress!, newOwnerAddress, asset);
    this.logger.log(`Bono ${bondId} liberado de escrow → ${newOwnerAddress} (${txHash})`);
    return txHash;
  }

  /** Devuelve la cuenta que actualmente tiene el token (dueño on-chain). */
  async currentHolder(bondId: string): Promise<string | null> {
    const asset = this.assetFor(bondId);
    const accounts = await this.server.accounts().forAsset(asset).call();
    const holder = (accounts.records as StellarAssetAccount[]).find((a) =>
      a.balances.some(
        (b: StellarBalance) =>
          b.asset_code === asset.getCode() &&
          b.asset_issuer === asset.getIssuer() &&
          parseFloat(b.balance) > 0,
      ),
    );
    return holder?.account_id ?? null;
  }

  /** Link a una transacción Stellar en el explorador público. */
  txExplorerUrl(txHash: string): string {
    return `https://stellar.expert/explorer/${EXPLORER_NETWORK}/tx/${txHash}`;
  }
}
