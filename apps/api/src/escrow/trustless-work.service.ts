import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { Networks, TransactionBuilder } from '@stellar/stellar-sdk';
import { WalletService } from './wallet.service';
import { StellarBondService } from './stellar-bond.service';

/**
 * Trustless Work usado como CANASTA DE COORDINACIÓN on-chain (no maneja dinero).
 *
 * Cada venta de bono crea un contrato escrow Single-Release que registra:
 *   - createEscrow             a  contractDeploy en Stellar Expert
 *   - changeMilestoneStatus    a  "completed" cuando el comprador paga off-chain
 *   - approveMilestone         a  cuando el vendedor/TSE confirma el pago
 *
 * Nunca llamamos a fundEscrow ni releaseFunds : el movimiento del token bono
 * sigue por Classic Asset (issuer  a  escrow wallet  a  nuevo dueño). Trustless
 * Work solo deja huella pública del lifecycle del trade.
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

  private async getJSON<T = any>(path: string): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      headers: { 'x-api-key': this.apiKey },
    });
    if (!res.ok) throw new Error(`TrustlessWork GET ${path} ${res.status}`);
    return res.json() as Promise<T>;
  }

  /** Firma un XDR con la wallet de plataforma y lo manda vía Trustless Work. */
  private async signAndSubmit(unsignedXdr: string, signerAddress?: string): Promise<{ txHash: string; ledger?: number; contractId?: string }> {
    const signer = signerAddress ?? this.platformAddress;
    const kp = this.wallets.keypairFor(signer);
    const tx = TransactionBuilder.fromXDR(unsignedXdr, Networks.TESTNET);
    tx.sign(kp);
    const signedXdr = tx.toXDR();
    const result = await this.call<{ status?: string; hash?: string; ledger?: number; contractId?: string }>(
      '/helper/send-transaction',
      { signedXdr },
    );
    return { txHash: result.hash ?? '', ledger: result.ledger, contractId: result.contractId };
  }

  /**
   * Crea un escrow Single-Release como canasta de coordinación.
   * No requiere fondeo. El amount se registra como referencia pero
   * el contrato nunca recibe dinero.
   */
  async createCoordinationEscrow(input: {
    bondId: string;
    sellerAddress: string;
    buyerAddress: string;
    amountCRC: number;
    transferId: string;
  }): Promise<{ contractId: string; deployTx?: string }> {
    const body = {
      engagementId: input.transferId,
      title: `VELAR bond ${input.bondId}`.slice(0, 64),
      description: `Coordinacion de venta del bono VELAR ${input.bondId}`,
      roles: {
        approver: this.platformAddress,
        serviceProvider: input.sellerAddress,
        platformAddress: this.platformAddress,
        releaseSigner: this.platformAddress,
        disputeResolver: this.platformAddress,
        receiver: input.sellerAddress,
      },
      milestones: [{
        description: `Transferencia del bono ${input.bondId}`,
      }],
      // amount referencial : el escrow nunca se fondea, es solo coordinación
      amount: Number(input.amountCRC) || 1,
      platformFee: 0,
      trustline: {
        address: this.wallets.issuerAddress,
        symbol: 'VCRC',
      },
      signer: this.platformAddress,
    };

    // Trustless Work valida que el receiver tenga trustline al asset antes
    // de crear el escrow. Aseguramos la trustline VCRC y damos tiempo de
    // propagación en Horizon antes de continuar.
    try {
      this.logger.log(`TW: asegurando trustline VCRC para receiver ${input.sellerAddress}…`);
      await this.stellar.ensureVcrcTrustline(input.sellerAddress);
      // Pausa breve para que Horizon propague la trustline antes de que
      // Trustless Work la lea con su propia consulta.
      await new Promise((r) => setTimeout(r, 2500));
      this.logger.log(`TW: trustline VCRC lista para ${input.sellerAddress}`);
    } catch (e) {
      this.logger.warn(`TW: trustline VCRC falló: ${(e as Error).message}`);
    }

    const deployRes = await this.call<{ unsignedTransaction: string }>('/deployer/single-release', body);
    const submitRes = await this.signAndSubmit(deployRes.unsignedTransaction);

    if (!submitRes.contractId) {
      this.logger.warn(`TW deploy ok pero send-transaction no devolvió contractId: ${JSON.stringify(submitRes).slice(0, 200)}`);
    }
    return {
      contractId: submitRes.contractId ?? `pending-${input.transferId}`,
      deployTx: submitRes.txHash,
    };
  }

  /** Marca el milestone como completado (vendedor "entregó" el bono). */
  async markMilestoneCompleted(contractId: string, evidence?: string): Promise<string> {
    const { unsignedTransaction } = await this.call<{ unsignedTransaction: string }>(
      '/escrow/single-release/change-milestone-status',
      {
        contractId,
        milestoneIndex: 0,
        newStatus: 'completed',
        newEvidence: (evidence ?? 'bono transferido on-chain').slice(0, 200),
        signer: this.platformAddress,
      },
    );
    const { txHash } = await this.signAndSubmit(unsignedTransaction);
    return txHash;
  }

  /** Approver valida el milestone. */
  async approveMilestone(contractId: string): Promise<string> {
    const { unsignedTransaction } = await this.call<{ unsignedTransaction: string }>(
      '/escrow/single-release/approve-milestone',
      {
        contractId,
        milestoneIndex: 0,
        newFlag: true,
        signer: this.platformAddress,
      },
    );
    const { txHash } = await this.signAndSubmit(unsignedTransaction);
    return txHash;
  }

  /** URL al contrato escrow en Stellar Expert. */
  contractExplorerUrl(contractId: string): string {
    return `https://stellar.expert/explorer/testnet/contract/${contractId}`;
  }

  /** URL a la tx en Stellar Expert. */
  txExplorerUrl(txHash: string): string {
    return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
  }
}
