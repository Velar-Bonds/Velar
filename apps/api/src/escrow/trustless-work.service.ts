import { Injectable, Logger } from '@nestjs/common';
import { Networks, TransactionBuilder } from '@stellar/stellar-sdk';
import { WalletService } from './wallet.service';

/**
 * Trustless Work usado como CANASTA DE COORDINACIÓN on-chain (no maneja dinero).
 *
 * Cada venta de bono crea un contrato escrow Single-Release que registra:
 *   - createEscrow            → contractDeploy en Stellar Expert
 *   - changeMilestoneStatus   → "completed" cuando el comprador paga off-chain
 *   - approveMilestone        → cuando el vendedor/TSE confirma el pago
 *
 * Nunca llamamos a fundEscrow ni releaseFunds — el movimiento del token bono
 * sigue por Classic Asset (issuer → escrow wallet → nuevo dueño). Trustless
 * Work solo deja huella pública del lifecycle del trade.
 */
@Injectable()
export class TrustlessWorkService {
  private readonly logger = new Logger(TrustlessWorkService.name);
  private readonly base = process.env.TRUSTLESS_WORK_API_URL ?? '';
  private readonly apiKey = process.env.TRUSTLESS_WORK_API_KEY ?? '';
  private readonly platformAddress = process.env.TRUSTLESS_WORK_PLATFORM_ADDRESS ?? '';

  constructor(private wallets: WalletService) {}

  get enabled(): boolean {
    return !!(this.base && this.apiKey && this.platformAddress);
  }

  private async call<T = any>(path: string, body: any): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`TrustlessWork ${path} ${res.status}: ${err.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  }

  private async getJSON<T = any>(path: string): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
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
      // amount referencial — el escrow nunca se fondea, es solo coordinación
      amount: (input.amountCRC || 0).toFixed(7),
      platformFee: '0',
      trustline: {
        address: this.wallets.issuerAddress,
        assetCode: 'VCRC',
      },
      receiverMemo: input.bondId.slice(0, 28),
      signer: this.platformAddress,
    };

    const { unsignedTransaction } = await this.call<{ unsignedTransaction: string }>(
      '/deployer/single-release',
      body,
    );
    const { txHash, contractId: deployedId } = await this.signAndSubmit(unsignedTransaction);

    // Si la respuesta del helper no trae el contractId, lo obtenemos por engagementId
    let contractId = deployedId;
    if (!contractId) {
      try {
        const esc = await this.getJSON<{ contractId?: string }>(
          `/escrow/single-release/get-escrow-by-engagement-id?engagementId=${encodeURIComponent(input.transferId)}`,
        );
        contractId = esc.contractId;
      } catch {}
    }

    if (!contractId) throw new Error('TrustlessWork no devolvió contractId');
    return { contractId, deployTx: txHash };
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
