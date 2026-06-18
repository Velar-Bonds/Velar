import { Injectable, Logger } from '@nestjs/common';
import {
  Asset, Horizon, Memo, Operation, TransactionBuilder, BASE_FEE,
} from '@stellar/stellar-sdk';
import {
  STELLAR_NETWORK, NETWORK_PASSPHRASE, HORIZON_URL, explorerAssetUrl, explorerTxUrl,
} from './stellar.config';
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
// USDC en Stellar testnet (Circle)
const USDC_ISSUER_TESTNET = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const USDC_ISSUER_MAINNET = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const USDC_ISSUER = STELLAR_NETWORK === 'mainnet' ? USDC_ISSUER_MAINNET : USDC_ISSUER_TESTNET;

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
  private readonly server = new Horizon.Server(HORIZON_URL);

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

  /** Activo VCRC: representación en Stellar de colones, emitido por la plataforma. */
  private paymentAsset(): Asset {
    return new Asset('VCRC', this.wallets.issuerAddress!);
  }

  /** URL del explorador para ver el asset VCRC y sus volúmenes acumulados. */
  paymentAssetExplorerUrl(): string {
    return explorerAssetUrl('VCRC', this.wallets.issuerAddress!);
  }

  /** Explorador público para ver el activo del bono en la blockchain. */
  explorerUrl(bondId: string): string {
    return explorerAssetUrl(this.assetCodeFor(bondId), this.wallets.issuerAddress!);
  }

  private async hasTrustline(account: string, asset: Asset): Promise<boolean> {
    const acc = await this.server.loadAccount(account);
    return acc.balances.some(
      (b: StellarBalance) => b.asset_code === asset.getCode() && b.asset_issuer === asset.getIssuer(),
    );
  }

  /** Asegura trustline al asset VCRC (usado por TW antes del deploy). */
  async ensureVcrcTrustline(account: string): Promise<void> {
    const vcrc = new Asset('VCRC', this.wallets.issuerAddress!);
    return this.ensureTrustline(account, vcrc);
  }

  /** Asegura trustline al token del bono (usado por TW antes de liberar al comprador). */
  async ensureBondTrustline(account: string, bondId: string): Promise<void> {
    return this.ensureTrustline(account, this.assetFor(bondId));
  }

  usdcAsset(): Asset {
    return new Asset('USDC', USDC_ISSUER);
  }

  get usdcIssuer(): string {
    return USDC_ISSUER;
  }

  /** Asegura trustline USDC en la cuenta indicada. */
  async ensureUsdcTrustline(account: string): Promise<void> {
    return this.ensureTrustline(account, this.usdcAsset());
  }

  /**
   * Envía USDC de la wallet platform al comprador para que pueda fondear el escrow.
   * En testnet la platform recibe USDC del faucet de Circle; en prod esto sería
   * el comprador depositando USDC real antes de la oferta.
   */
  async provisionUsdc(buyerAddress: string, amount: number): Promise<string> {
    const usdc = this.usdcAsset();
    await this.ensureTrustline(buyerAddress, usdc);
    const kp = this.wallets.keypairFor(this.wallets.issuerAddress!);
    // La cuenta issuer/platform actúa como reserva de USDC para testnet
    const src = await this.server.loadAccount(this.wallets.issuerAddress!);
    const hasTrustline = await this.hasTrustline(this.wallets.issuerAddress!, usdc);
    if (!hasTrustline) {
      throw new Error('La cuenta plataforma no tiene USDC. Correr npm run provision:usdc');
    }
    const tx = new TransactionBuilder(src, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(Operation.payment({
        destination: buyerAddress,
        asset: usdc,
        amount: amount.toFixed(7),
      }))
      .addMemo(Memo.text('escrow:provision'))
      .setTimeout(60)
      .build();
    tx.sign(kp);
    const res = await this.server.submitTransaction(tx);
    this.logger.log(`USDC provisionado: ${amount} USDC → ${buyerAddress} (${res.hash})`);
    return res.hash;
  }

  /** Asegura que `account` confíe en el activo (changeTrust), firmado en custodia. */
  private async ensureTrustline(account: string, asset: Asset): Promise<void> {
    if (await this.hasTrustline(account, asset)) return;
    const kp = this.wallets.keypairFor(account);
    const src = await this.server.loadAccount(account);
    const tx = new TransactionBuilder(src, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(Operation.changeTrust({ asset, limit: '1' }))
      .setTimeout(60)
      .build();
    tx.sign(kp);
    await this.server.submitTransaction(tx);
  }

  /** Paga 1 unidad del activo de `from` a `to`, firmado por `from` (custodia). */
  private async payOne(from: string, to: string, asset: Asset, memoText?: string): Promise<{ txHash: string; ledger: number }> {
    const kp = this.wallets.keypairFor(from);
    const src = await this.server.loadAccount(from);
    const builder = new TransactionBuilder(src, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(Operation.payment({ destination: to, asset, amount: '1' }))
      .setTimeout(60);
    if (memoText) {
      // Stellar memo TEXT permite hasta 28 bytes UTF-8
      builder.addMemo(Memo.text(memoText.slice(0, 28)));
    }
    const tx = builder.build();
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
    const { txHash, ledger } = await this.payOne(this.wallets.issuerAddress!, ownerAddress, asset, `VELAR:issue:${bondId}`);
    this.logger.log(`Bono ${bondId} emitido on-chain  a  ${ownerAddress} (${txHash})`);
    return { assetCode: asset.getCode(), issuer: asset.getIssuer(), owner: ownerAddress, txHash, ledger };
  }

  /**
   * Registra el precio de venta on-chain emitiendo VCRC al vendedor.
   * El movimiento del token del bono lo hace Trustless Work (releaseFunds).
   */
  async recordPrice(
    bondId: string,
    amount: number,
    sellerAddress: string,
  ): Promise<{ txHash: string; priceRecorded: boolean }> {
    const vcrc = this.paymentAsset();
    const wantsPrice = !!sellerAddress && amount > 0 && sellerAddress !== this.wallets.issuerAddress;
    if (!wantsPrice) return { txHash: '', priceRecorded: false };
    try {
      await this.ensureTrustline(sellerAddress, vcrc);
    } catch (e) {
      this.logger.warn(`trustline VCRC para vendedor falló: ${(e as Error).message}`);
      return { txHash: '', priceRecorded: false };
    }
    const issuerKp = this.wallets.keypairFor(this.wallets.issuerAddress!);
    const issuerSrc = await this.server.loadAccount(this.wallets.issuerAddress!);
    const tx = new TransactionBuilder(issuerSrc, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(Operation.payment({
        destination: sellerAddress,
        asset: vcrc,
        amount: amount.toFixed(7),
      }))
      .addMemo(Memo.text(`sold:${amount}CRC`.slice(0, 28)))
      .setTimeout(60)
      .build();
    tx.sign(issuerKp);
    const res = await this.server.submitTransaction(tx);
    this.logger.log(`Precio ₡${amount} VCRC registrado on-chain → ${sellerAddress} (${res.hash})`);
    return { txHash: res.hash, priceRecorded: true };
  }

  /** @deprecated — movimiento de bono ahora lo hace TrustlessWork.fundEscrow */
  async lockInEscrow(bondId: string, ownerAddress: string, amount?: number): Promise<string> {
    const asset = this.assetFor(bondId);
    await this.ensureTrustline(this.wallets.escrowAddress!, asset);
    const memo = amount ? `escrow:${amount}` : `escrow:${bondId}`;
    const { txHash } = await this.payOne(ownerAddress, this.wallets.escrowAddress!, asset, memo);
    this.logger.log(`Bono ${bondId}  a  escrow (${txHash})`);
    return txHash;
  }

  /** Devuelve el token desde la canasta de escrow al dueño original (cancelación). */
  async returnFromEscrow(bondId: string, originalOwnerAddress: string): Promise<string> {
    const asset = this.assetFor(bondId);
    await this.ensureTrustline(originalOwnerAddress, asset);
    const { txHash } = await this.payOne(this.wallets.escrowAddress!, originalOwnerAddress, asset, `return:${bondId}`.slice(0, 28));
    this.logger.log(`Bono ${bondId}  de  escrow (devuelto al dueño ${originalOwnerAddress}, tx ${txHash})`);
    return txHash;
  }

  /**
   * Libera el token de la canasta al nuevo dueño Y registra el precio pagado on-chain.
   *
   * En una sola transacción atómica firmada por escrow + issuer:
   *  - Op 1: paga 1 unidad del token bono: escrow  a  comprador
   *  - Op 2 (opcional, si hay precio y vendedor): paga VCRC: issuer  a  vendedor
   *
   * Combinarlas en una sola tx evita race conditions de sequence number y
   * garantiza que el cambio de dueño y el registro del precio sean atómicos.
   */
  async releaseFromEscrow(
    bondId: string,
    newOwnerAddress: string,
    amount?: number,
    sellerAddress?: string,
  ): Promise<{ txHash: string; priceRecorded: boolean }> {
    const asset = this.assetFor(bondId);
    const vcrc = this.paymentAsset();
    // Asegura trustlines (en txs separadas, son idempotentes y rápidas)
    await this.ensureTrustline(newOwnerAddress, asset);
    const wantsPrice = !!sellerAddress && !!amount && amount > 0 && sellerAddress !== this.wallets.issuerAddress;
    if (wantsPrice) {
      try { await this.ensureTrustline(sellerAddress!, vcrc); }
      catch (e) { this.logger.warn(`trustline VCRC falló: ${(e as Error).message}`); }
    }

    const issuerKp = this.wallets.keypairFor(this.wallets.issuerAddress!);
    const escrowKp = this.wallets.keypairFor(this.wallets.escrowAddress!);
    const escrowSrc = await this.server.loadAccount(this.wallets.escrowAddress!);
    const memo = amount ? `sold:${amount}CRC` : `sold:${bondId}`;

    const builder = new TransactionBuilder(escrowSrc, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(Operation.payment({
        destination: newOwnerAddress,
        asset,
        amount: '1',
      }))
      .addMemo(Memo.text(memo.slice(0, 28)))
      .setTimeout(60);

    if (wantsPrice) {
      builder.addOperation(Operation.payment({
        source: this.wallets.issuerAddress!,
        destination: sellerAddress!,
        asset: vcrc,
        amount: amount!.toFixed(7),
      }));
    }

    const tx = builder.build();
    tx.sign(escrowKp);
    if (wantsPrice) tx.sign(issuerKp);

    try {
      const res = await this.server.submitTransaction(tx);
      this.logger.log(`Bono ${bondId} liberado  a  ${newOwnerAddress} (${res.hash})${wantsPrice ? ` + ₡${amount} VCRC  a  ${sellerAddress}` : ''}`);
      return { txHash: res.hash, priceRecorded: wantsPrice };
    } catch (e: any) {
      const codes = e?.response?.data?.extras?.result_codes;
      const detail = codes ? JSON.stringify(codes) : (e as Error).message;
      this.logger.warn(`releaseFromEscrow falló: ${detail}`);
      throw e;
    }
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
    return explorerTxUrl(txHash);
  }
}
