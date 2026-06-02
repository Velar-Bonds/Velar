import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InitEscrowParams } from '@velar/types';

const BASE_URL = 'https://api.trustlesswork.com';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);
  private readonly headers: Record<string, string>;

  constructor(private cfg: ConfigService) {
    this.headers = {
      Authorization: `Bearer ${this.cfg.getOrThrow('TRUSTLESS_WORK_API_KEY')}`,
      'Content-Type': 'application/json',
    };
  }

  async initEscrow(params: InitEscrowParams) {
    const body = {
      title: params.title,
      engagementId: params.transferId,
      client: params.buyer,
      serviceProvider: params.seller,
      approver: params.approver,
      amount: String(params.amount),
      platformAddress: this.cfg.get('TRUSTLESS_WORK_PLATFORM_ADDRESS', ''),
      platformFee: '0',
      releaseSigner: params.approver,
      disputeResolver: params.approver,
      milestones: [
        { description: `Bond transfer: ${params.bondTokenId}`, status: 'pending' },
      ],
    };
    const { data } = await axios.post(`${BASE_URL}/escrow/initialize-escrow`, body, {
      headers: this.headers,
    });
    this.logger.log(`Escrow initialized: ${JSON.stringify(data)}`);
    return data as { contractId?: string; unsignedTransaction?: string };
  }

  async fundEscrow(contractId: string, signer: string) {
    const { data } = await axios.post(`${BASE_URL}/escrow/fund-escrow`, { contractId, signer }, { headers: this.headers });
    return data;
  }

  async approveEscrow(contractId: string, signer: string) {
    const { data } = await axios.post(`${BASE_URL}/escrow/approve-escrow`, { contractId, signer }, { headers: this.headers });
    return data;
  }

  async releaseEscrow(contractId: string, signer: string) {
    const { data } = await axios.post(`${BASE_URL}/escrow/release-escrow`, { contractId, signer }, { headers: this.headers });
    return data;
  }

  async refundEscrow(contractId: string, signer: string) {
    const { data } = await axios.post(`${BASE_URL}/escrow/refund-escrow`, { contractId, signer }, { headers: this.headers });
    return data;
  }

  async getEscrow(contractId: string) {
    const { data } = await axios.get(`${BASE_URL}/escrow/${contractId}`, { headers: this.headers });
    return data;
  }
}
