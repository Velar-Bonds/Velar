import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { TransactionBuilder } from '@stellar/stellar-sdk';
import { WalletService } from './wallet.service';
import { StellarBondService } from './stellar-bond.service';
import { NETWORK_PASSPHRASE, explorerContractUrl, explorerTxUrl } from './stellar.config';

/**
 * Trustless Work como escrow REAL del token del bono.
 *
 * El contrato Soroban de TW custodia físicamente el token durante la venta:
 *   deployEscrow    → contrato creado con buyer como receiver y bond asset como trustline
 *   fundEscrow      → vendedor deposita 1 unidad del token bono en el contrato
 *   markCompleted   → comprador registra pago off-chain (evidencia hasheada)
 *   approveMilestone → plataforma aprueba
 *   releaseFunds    → TW mueve el token al comprador automáticamente
 *
 * Para cancelaciones/retornos:
 *   disputeEscrow + resolveDispute → TW devuelve el token al vendedor
 *
 * El registro de precio en VCRC sigue como tx Stellar separada (analytics).
 */
@Injectable()
export class TrustlessWorkService {
  private readonly logger = new Logger(TrustlessWorkService.name);
  private readonly base = process.env.TRUSTLESS_WORK_API_URL ?? '';
  private readonly apiKey = process.env.TRUSTLESS_WORK_API_KEY ?? '';
  private readonly platformAddress = process.env.TRUSTLESS_WORK_PLATFORM_ADDRESS ?? '';

  constructor(
    private wallets: WalletService,
    @Inject(forwardRef(() => StellarBondService))
    private stellar: StellarBondService,
  ) {}

  get enabled(): boolean {
    return !!(this.base && this.apiKey && this.platformAddress);
  }

  private async call<T = any>(path: string, body: any): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`TrustlessWork ${path} ${res.status}: ${err.slice(0, 400)}`);
    }
    return res.json() as Promise<T>;
  }

  /** Firma un XDR con la keypair del signer indicado y lo envía. */
  private async signAndSubmit(
    unsignedXdr: string,
    signerAddress: string,
  ): Promise<{ txHash: string; ledger?: number; contractId?: string }> {
    const kp = this.wallets.keypairFor(signerAddress);
    const tx = TransactionBuilder.fromXDR(unsignedXdr, NETWORK_PASSPHRASE);
    tx.sign(kp);
    const signedXdr = tx.toXDR();
    const result = await this.call<{ status?: string; hash?: string; ledger?: number; contractId?: string }>(
      '/helper/send-transaction',
      { signedXdr },
    );
    return { txHash: result.hash ?? '', ledger: result.ledger, contractId: result.contractId };
  }

  /**
   * Despliega el contrato escrow Single-Release de TW.
   * El token del bono es el asset custodiado; el comprador es el receiver.
   */
  async deployEscrow(input: {
    bondId: string;
    bondAssetCode: string;
    sellerAddress: string;
    buyerAddress: string;
    transferId: string;
    amountUsdc: number;
  }): Promise<{ contractId: string; deployTx: string }> {
    // Asegura que el comprador tenga trustline al asset del bono antes del deploy.
    // TW necesita poder enviarle el token al liberar.
    // TW en dev solo acepta USDC — aseguramos trustline USDC al vendedor (receiver del USDC)
    try {
      this.logger.log(`TW: asegurando trustline USDC para seller ${input.sellerAddress}…`);
      await this.stellar.ensureUsdcTrustline(input.sellerAddress);
      await new Promise((r) => setTimeout(r, 3000));
      this.logger.log(`TW: trustline USDC lista para seller`);
    } catch (e) {
      throw new Error(`Trustline USDC para vendedor falló: ${(e as Error).message}`);
    }

    const body = {
      engagementId: input.transferId,
      title: `VELAR bond ${input.bondId}`.slice(0, 64),
      description: `Venta del bono VELAR ${input.bondId}`,
      roles: {
        approver: this.platformAddress,
        serviceProvider: input.buyerAddress,   // comprador "provee el pago" (USDC)
        platformAddress: this.platformAddress,
        releaseSigner: this.platformAddress,
        disputeResolver: this.platformAddress,
        receiver: input.sellerAddress,          // vendedor recibe el USDC al liberar
      },
      milestones: [{
        description: `Pago por bono ${input.bondId}`,
      }],
      amount: input.amountUsdc,
      platformFee: 0,
      trustline: {
        address: this.stellar.usdcIssuer,
        symbol: 'USDC',
      },
      signer: this.platformAddress,
    };

    const deployRes = await this.call<{ unsignedTransaction: string }>('/deployer/single-release', body);
    const submitRes = await this.signAndSubmit(deployRes.unsignedTransaction, this.platformAddress);

    if (!submitRes.contractId) {
      this.logger.warn(`TW deploy sin contractId en respuesta: ${JSON.stringify(submitRes).slice(0, 200)}`);
    }

    const contractId = submitRes.contractId ?? `pending-${input.transferId}`;
    this.logger.log(`TW escrow desplegado: ${contractId} (bond ${input.bondId})`);
    return { contractId, deployTx: submitRes.txHash };
  }

  /**
   * El comprador deposita USDC en el contrato TW (el pago queda bloqueado).
   * El bono sigue moviéndose por Stellar Classic (lockInEscrow del backend).
   */
  async fundEscrow(contractId: string, buyerAddress: string, amountUsdc: number): Promise<string> {
    const { unsignedTransaction } = await this.call<{ unsignedTransaction: string }>(
      '/escrow/single-release/fund-escrow',
      {
        contractId,
        signer: buyerAddress,
        amount: amountUsdc,
      },
    );
    const { txHash } = await this.signAndSubmit(unsignedTransaction, buyerAddress);
    this.logger.log(`TW fundEscrow OK: ${amountUsdc} USDC bloqueados (contrato ${contractId}, tx ${txHash})`);
    return txHash;
  }

  /**
   * Marca el milestone como completado cuando el comprador registra el pago off-chain.
   */
  async markMilestoneCompleted(
    contractId: string,
    buyerAddress: string,
    evidence?: string,
  ): Promise<string> {
    const { unsignedTransaction } = await this.call<{ unsignedTransaction: string }>(
      '/escrow/single-release/change-milestone-status',
      {
        contractId,
        milestoneIndex: '0',
        newStatus: 'completed',
        newEvidence: (evidence ?? 'pago registrado off-chain').slice(0, 200),
        serviceProvider: buyerAddress,
      },
    );
    const { txHash } = await this.signAndSubmit(unsignedTransaction, this.platformAddress);
    return txHash;
  }

  /**
   * La plataforma aprueba el milestone (el TSE/vendedor confirmó el pago).
   */
  async approveMilestone(contractId: string): Promise<string> {
    const { unsignedTransaction } = await this.call<{ unsignedTransaction: string }>(
      '/escrow/single-release/approve-milestone',
      {
        contractId,
        milestoneIndex: '0',
        approver: this.platformAddress,
      },
    );
    const { txHash } = await this.signAndSubmit(unsignedTransaction, this.platformAddress);
    return txHash;
  }

  /**
   * TW libera el token del bono al comprador (receiver del contrato).
   * Se llama después de approveMilestone.
   */
  async releaseFunds(contractId: string): Promise<string> {
    const { unsignedTransaction } = await this.call<{ unsignedTransaction: string }>(
      '/escrow/single-release/release-funds',
      {
        contractId,
        releaseSigner: this.platformAddress,
      },
    );
    const { txHash } = await this.signAndSubmit(unsignedTransaction, this.platformAddress);
    this.logger.log(`TW releaseFunds OK: ${txHash} (contrato ${contractId})`);
    return txHash;
  }

  /**
   * Cancela el escrow abriendo una disputa y resolviéndola a favor del vendedor.
   * El token del bono vuelve al vendedor (serviceProvider del contrato).
   */
  async returnToSeller(contractId: string, sellerAddress: string): Promise<string> {
    // 1. Abrir disputa (firmado por la plataforma como disputeResolver)
    const { unsignedTransaction: disputeXdr } = await this.call<{ unsignedTransaction: string }>(
      '/escrow/single-release/dispute-escrow',
      {
        contractId,
        signer: this.platformAddress,
      },
    );
    await this.signAndSubmit(disputeXdr, this.platformAddress);

    // 2. Resolver disputa devolviendo el token completo al vendedor
    const { unsignedTransaction: resolveXdr } = await this.call<{ unsignedTransaction: string }>(
      '/escrow/single-release/resolve-dispute',
      {
        contractId,
        disputeResolver: this.platformAddress,
        distributions: [{ address: sellerAddress, amount: 1 }],
      },
    );
    const { txHash } = await this.signAndSubmit(resolveXdr, this.platformAddress);
    this.logger.log(`TW returnToSeller OK: ${txHash} (contrato ${contractId})`);
    return txHash;
  }

  contractExplorerUrl(contractId: string): string {
    return explorerContractUrl(contractId);
  }

  txExplorerUrl(txHash: string): string {
    return explorerTxUrl(txHash);
  }
}
