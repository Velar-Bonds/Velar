import { TransactionBuilder } from '@stellar/stellar-sdk';
import { TrustlessWorkService } from './trustless-work.service';
import { WalletService } from './wallet.service';
import { StellarBondService } from './stellar-bond.service';

describe('TrustlessWorkService', () => {
  const ORIGINAL_ENV = process.env;
  let walletServiceMock: jest.Mocked<Pick<WalletService, 'keypairFor'>>;
  let stellarBondServiceMock: jest.Mocked<Pick<StellarBondService, 'ensureUsdcTrustline' | 'usdcIssuer'>>;
  let fetchMock: jest.Mock;
  let mockTx: { sign: jest.Mock; toXDR: jest.Mock };

  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      TRUSTLESS_WORK_API_URL: 'https://tw.example.com',
      TRUSTLESS_WORK_API_KEY: 'test-tw-api-key',
      TRUSTLESS_WORK_PLATFORM_ADDRESS: 'GPLATFORMADDRESS1234567890',
    };

    walletServiceMock = {
      keypairFor: jest.fn().mockReturnValue({ publicKey: () => 'GSIGNER' } as any),
    };

    stellarBondServiceMock = {
      ensureUsdcTrustline: jest.fn().mockResolvedValue(undefined),
      usdcIssuer: 'GUSDCISSUER1234567890',
    } as any;

    mockTx = {
      sign: jest.fn(),
      toXDR: jest.fn().mockReturnValue('SIGNED_XDR_PAYLOAD'),
    };
    jest.spyOn(TransactionBuilder, 'fromXDR').mockReturnValue(mockTx as any);

    fetchMock = jest.fn();
    global.fetch = fetchMock as any;

    // Bypass the 3000ms wait inside deployEscrow during unit tests
    jest.spyOn(global, 'setTimeout').mockImplementation(((cb: (...args: any[]) => void) => {
      cb();
      return 0 as any;
    }) as any);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.restoreAllMocks();
  });

  function createService(): TrustlessWorkService {
    return new TrustlessWorkService(
      walletServiceMock as unknown as WalletService,
      stellarBondServiceMock as unknown as StellarBondService,
    );
  }

  function mockFetchJson(payload: unknown, ok = true, status = 200) {
    fetchMock.mockResolvedValueOnce({
      ok,
      status,
      json: jest.fn().mockResolvedValue(payload),
      text: jest.fn().mockResolvedValue(typeof payload === 'string' ? payload : JSON.stringify(payload)),
    });
  }

  describe('enabled', () => {
    it('returns true when URL, API key, and platform address are configured', () => {
      const service = createService();
      expect(service.enabled).toBe(true);
    });

    it('returns false when any required environment variable is missing', () => {
      delete process.env.TRUSTLESS_WORK_API_KEY;
      const service = createService();
      expect(service.enabled).toBe(false);
    });
  });

  describe('deployEscrow', () => {
    it('ensures seller USDC trustline, deploys single-release escrow, and signs/submits the transaction', async () => {
      const service = createService();
      mockFetchJson({ unsignedTransaction: 'UNSIGNED_DEPLOY_XDR' });
      mockFetchJson({ hash: 'tx-deploy-123', ledger: 100, contractId: 'CESCROW123' });

      const result = await service.deployEscrow({
        bondId: 'BOND-01',
        bondAssetCode: 'VEL01',
        sellerAddress: 'GSELLER123',
        buyerAddress: 'GBUYER123',
        transferId: 'tr-001',
        amountUsdc: 500,
      });

      expect(stellarBondServiceMock.ensureUsdcTrustline).toHaveBeenCalledWith('GSELLER123');
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://tw.example.com/deployer/single-release',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'x-api-key': 'test-tw-api-key',
            'Content-Type': 'application/json',
          },
        }),
      );
      expect(walletServiceMock.keypairFor).toHaveBeenCalledWith('GPLATFORMADDRESS1234567890');
      expect(mockTx.sign).toHaveBeenCalled();
      expect(result).toEqual({ contractId: 'CESCROW123', deployTx: 'tx-deploy-123' });
    });

    it('falls back to pending-<transferId> when contractId is omitted in send-transaction response', async () => {
      const service = createService();
      mockFetchJson({ unsignedTransaction: 'UNSIGNED_DEPLOY_XDR' });
      mockFetchJson({ hash: 'tx-deploy-no-cid' });

      const result = await service.deployEscrow({
        bondId: 'BOND-02',
        bondAssetCode: 'VEL02',
        sellerAddress: 'GSELLER123',
        buyerAddress: 'GBUYER123',
        transferId: 'tr-002',
        amountUsdc: 250,
      });

      expect(result).toEqual({ contractId: 'pending-tr-002', deployTx: 'tx-deploy-no-cid' });
    });

    it('throws a descriptive error if ensureUsdcTrustline fails', async () => {
      const service = createService();
      stellarBondServiceMock.ensureUsdcTrustline.mockRejectedValueOnce(new Error('Horizon timeout'));

      await expect(
        service.deployEscrow({
          bondId: 'BOND-01',
          bondAssetCode: 'VEL01',
          sellerAddress: 'GSELLER123',
          buyerAddress: 'GBUYER123',
          transferId: 'tr-003',
          amountUsdc: 100,
        }),
      ).rejects.toThrow('Trustline USDC para vendedor falló: Horizon timeout');
    });
  });

  describe('escrow lifecycle operations', () => {
    it('fundEscrow requests unsigned XDR, signs with buyer keypair, and returns txHash', async () => {
      const service = createService();
      mockFetchJson({ unsignedTransaction: 'UNSIGNED_FUND_XDR' });
      mockFetchJson({ hash: 'tx-fund-001' });

      const txHash = await service.fundEscrow('CESCROW123', 'GBUYER123', 500);

      expect(txHash).toBe('tx-fund-001');
      expect(walletServiceMock.keypairFor).toHaveBeenCalledWith('GBUYER123');
    });

    it('markMilestoneCompleted sends completed status with truncated evidence and signs with platform keypair', async () => {
      const service = createService();
      mockFetchJson({ unsignedTransaction: 'UNSIGNED_MARK_XDR' });
      mockFetchJson({ hash: 'tx-mark-001' });

      const txHash = await service.markMilestoneCompleted('CESCROW123', 'GBUYER123', 'sha256:abc');

      expect(txHash).toBe('tx-mark-001');
      const [, init] = fetchMock.mock.calls[0];
      expect(JSON.parse(init.body)).toEqual({
        contractId: 'CESCROW123',
        milestoneIndex: '0',
        newStatus: 'completed',
        newEvidence: 'sha256:abc',
        serviceProvider: 'GBUYER123',
      });
    });

    it('approveMilestone and releaseFunds sign and submit platform transactions', async () => {
      const service = createService();
      mockFetchJson({ unsignedTransaction: 'UNSIGNED_APPROVE_XDR' });
      mockFetchJson({ hash: 'tx-approve-001' });
      mockFetchJson({ unsignedTransaction: 'UNSIGNED_RELEASE_XDR' });
      mockFetchJson({ hash: 'tx-release-001' });

      await expect(service.approveMilestone('CESCROW123')).resolves.toBe('tx-approve-001');
      await expect(service.releaseFunds('CESCROW123')).resolves.toBe('tx-release-001');
    });

    it('returnToSeller opens a dispute and resolves it in favor of the seller', async () => {
      const service = createService();
      mockFetchJson({ unsignedTransaction: 'UNSIGNED_DISPUTE_XDR' });
      mockFetchJson({ hash: 'tx-dispute-001' });
      mockFetchJson({ unsignedTransaction: 'UNSIGNED_RESOLVE_XDR' });
      mockFetchJson({ hash: 'tx-resolve-001' });

      const txHash = await service.returnToSeller('CESCROW123', 'GSELLER123');

      expect(txHash).toBe('tx-resolve-001');
      expect(fetchMock).toHaveBeenCalledTimes(4);
      const [, resolveInit] = fetchMock.mock.calls[2];
      expect(JSON.parse(resolveInit.body)).toEqual({
        contractId: 'CESCROW123',
        disputeResolver: 'GPLATFORMADDRESS1234567890',
        distributions: [{ address: 'GSELLER123', amount: 1 }],
      });
    });
  });

  describe('HTTP errors and network timeouts', () => {
    it('throws an error with status code and response excerpt when Trustless Work returns non-2xx', async () => {
      const service = createService();
      mockFetchJson('Gateway Timeout from upstream Soroban node', false, 504);

      await expect(service.approveMilestone('CESCROW123')).rejects.toThrow(
        'TrustlessWork /escrow/single-release/approve-milestone 504: Gateway Timeout from upstream Soroban node',
      );
    });

    it('propagates network/timeout rejections when fetch aborts or times out', async () => {
      const service = createService();
      const timeoutError = new Error('The operation was aborted due to timeout');
      timeoutError.name = 'TimeoutError';
      fetchMock.mockRejectedValueOnce(timeoutError);

      await expect(service.releaseFunds('CESCROW123')).rejects.toThrow(
        'The operation was aborted due to timeout',
      );
    });
  });

  describe('explorer URL helpers', () => {
    it('returns formatted contract and transaction explorer URLs', () => {
      const service = createService();
      expect(service.contractExplorerUrl('CCONTRACT123')).toContain('CCONTRACT123');
      expect(service.txExplorerUrl('txhash123')).toContain('txhash123');
    });
  });
});
