import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { InitEscrowParams } from '@velar/types';
import { WalletService } from './wallet.service';

/**
 * Integración real con Trustless Work (escrow single-release sobre Stellar testnet).
 *
 * Patrón de cada operación on-chain:
 *   1. POST al endpoint de TW → devuelve `unsignedTransaction` (XDR).
 *   2. Firmamos el XDR con la wallet del rol correspondiente (custodia asistida).
 *   3. POST /helper/send-transaction con el XDR firmado → confirma on-chain.
 *
 * USDC testnet issuer usado para el trustline.
 */
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);
  private readonly http: AxiosInstance;

  constructor(
    private cfg: ConfigService,
    private wallets: WalletService,
  ) {
    this.http = axios.create({
      baseURL: this.cfg.get(
        'TRUSTLESS_WORK_API_URL',
        'https://dev.api.trustlesswork.com',
      ),
      headers: {
        'x-api-key': this.cfg.getOrThrow('TRUSTLESS_WORK_API_KEY'),
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  get enabled(): boolean {
    return this.wallets.enabled;
  }

  /** Firma un XDR con la wallet indicada y lo envía a la red vía TW. */
  private async signAndSend(unsignedXdr: string, signerAddress: string) {
    const signedXdr = this.wallets.signXdr(unsignedXdr, signerAddress);
    const { data } = await this.http.post('/helper/send-transaction', { signedXdr });
    return data as { status?: string; contractId?: string; txHash?: string };
  }

  /**
   * Despliega el escrow on-chain. La plataforma es el `signer` del deploy.
   * Devuelve el contractId real del escrow desplegado.
   */
  async initEscrow(params: InitEscrowParams): Promise<{ contractId?: string; txHash?: string }> {
    const platform = this.wallets.platformAddress;
    if (!platform) throw new Error('Sin wallet de plataforma en custodia');

    const body = {
      signer: platform,
      engagementId: params.transferId,
      title: params.title,
      description: `VELAR bond ${params.bondTokenId}`,
      amount: params.amount,
      platformFee: 0,
      roles: {
        approver: params.approver,
        serviceProvider: params.seller,
        platformAddress: platform,
        releaseSigner: params.approver,
        disputeResolver: params.approver,
        receiver: params.seller,
      },
      milestones: [{ description: `Pago del bono ${params.bondTokenId}` }],
      trustline: { address: USDC_ISSUER, symbol: 'USDC' },
    };

    const { data } = await this.http.post('/deployer/single-release', body);
    if (!data?.unsignedTransaction) {
      throw new Error('deploy sin unsignedTransaction');
    }
    const sent = await this.signAndSend(data.unsignedTransaction, platform);
    this.logger.log(`Escrow desplegado: ${sent.contractId}`);
    return { contractId: sent.contractId, txHash: sent.txHash };
  }

  /** El comprador (buyer) fondea el escrow con USDC. */
  async fundEscrow(contractId: string, funderAddress: string, amount: number) {
    const { data } = await this.http.post('/escrow/single-release/fund-escrow', {
      contractId,
      signer: funderAddress,
      amount,
    });
    return this.signAndSend(data.unsignedTransaction, funderAddress);
  }

  /** El serviceProvider (vendedor) marca el hito como completado. */
  async markMilestoneDone(contractId: string, serviceProvider: string, evidence: string) {
    const { data } = await this.http.post('/escrow/single-release/change-milestone-status', {
      contractId,
      milestoneIndex: '0',
      newStatus: 'Completed',
      newEvidence: evidence,
      serviceProvider,
    });
    return this.signAndSend(data.unsignedTransaction, serviceProvider);
  }

  /** El approver aprueba el hito. */
  async approveMilestone(contractId: string, approver: string) {
    const { data } = await this.http.post('/escrow/single-release/approve-milestone', {
      contractId,
      milestoneIndex: '0',
      approver,
    });
    return this.signAndSend(data.unsignedTransaction, approver);
  }

  /** El releaseSigner libera los fondos al receiver. */
  async releaseEscrow(contractId: string, releaseSigner: string) {
    const { data } = await this.http.post('/escrow/single-release/release-funds', {
      contractId,
      releaseSigner,
    });
    return this.signAndSend(data.unsignedTransaction, releaseSigner);
  }

  async getEscrow(contractId: string) {
    const { data } = await this.http.get('/helper/get-escrow-by-contract-ids', {
      params: { contractIds: contractId },
    });
    return data;
  }
}
