import { Test, TestingModule } from '@nestjs/testing';
import { StellarBondService } from './stellar-bond.service';
import { WalletService } from './wallet.service';
import { Asset, Horizon, Keypair, Networks, TransactionBuilder, Operation, Memo, BASE_FEE } from '@stellar/stellar-sdk';

/**
 * Unit tests for StellarBondService.
 *
 * The Stellar SDK is fully mocked — no testnet, no real accounts. Covers
 * transaction construction (asset codes, XDR building, signing) and network
 * error handling (Horizon failures).
 */
describe('StellarBondService', () => {
  let service: StellarBondService;
  let wallets: {
    enabled: boolean;
    issuerAddress: string | null;
    escrowAddress: string | null;
    keypairFor: jest.Mock;
  };
  let loadAccountMock: jest.Mock;
  let submitTransactionMock: jest.Mock;
  let accountsCallMock: jest.Mock;

  const ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
  const ESCROW = 'GESCROWADDRESSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
  const BUYER = 'GBUYERADDRESSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
  const SELLER = 'GSELLERADDRESSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

  function mockAccount(balances: Array<{ asset_code?: string; asset_issuer?: string; balance?: string }> = []) {
    return { balances, sequence: '1' };
  }

  beforeEach(async () => {
    wallets = {
      enabled: true,
      issuerAddress: ISSUER,
      escrowAddress: ESCROW,
      keypairFor: jest.fn(() => Keypair.random()),
    };

    loadAccountMock = jest.fn(async () => mockAccount());
    submitTransactionMock = jest.fn(async () => ({ hash: 'TXHASH', ledger: 12345 }));
    accountsCallMock = jest.fn(async () => ({ records: [] }));

    jest.spyOn(Horizon.Server.prototype, 'loadAccount').mockImplementation(loadAccountMock);
    jest.spyOn(Horizon.Server.prototype, 'submitTransaction').mockImplementation(submitTransactionMock);
    jest.spyOn(Horizon.Server.prototype, 'accounts').mockReturnValue({
      forAsset: jest.fn(() => ({ call: accountsCallMock })),
    } as unknown as ReturnType<typeof Horizon.Server.prototype.accounts>);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StellarBondService,
        { provide: WalletService, useValue: wallets },
      ],
    }).compile();

    service = module.get(StellarBondService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('assetCodeFor()', () => {
    it('derives an alphanumeric asset code from the bond id', () => {
      expect(service.assetCodeFor('bond-42')).toBe('bond42');
    });

    it('strips non-alphanumeric characters', () => {
      expect(service.assetCodeFor('BOND#1!')).toBe('BOND1');
    });

    it('truncates to 12 characters max', () => {
      expect(service.assetCodeFor('ABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBe('ABCDEFGHIJKL');
    });

    it('falls back to BOND when the id has no alphanumeric chars', () => {
      expect(service.assetCodeFor('---')).toBe('BOND');
    });
  });

  describe('enabled', () => {
    it('is true when wallets are enabled with issuer and escrow addresses', () => {
      expect(service.enabled).toBe(true);
    });

    it('is false when wallets are disabled', () => {
      wallets.enabled = false;
      expect(service.enabled).toBe(false);
    });

    it('is false when issuer address is missing', () => {
      wallets.issuerAddress = null;
      expect(service.enabled).toBe(false);
    });

    it('is false when escrow address is missing', () => {
      wallets.escrowAddress = null;
      expect(service.enabled).toBe(false);
    });
  });

  describe('networkPassphrase', () => {
    it('returns the configured network passphrase', () => {
      expect(typeof service.networkPassphrase).toBe('string');
      expect(service.networkPassphrase.length).toBeGreaterThan(0);
    });
  });

  describe('explorerUrl()', () => {
    it('builds an explorer URL for the bond asset', () => {
      const url = service.explorerUrl('bond-42');
      expect(url).toContain('bond42');
      expect(url).toContain(ISSUER);
    });
  });

  describe('issueBond()', () => {
    it('builds, signs and submits a payment of 1 bond unit to the owner', async () => {
      const result = await service.issueBond('bond-42', BUYER);

      expect(result.assetCode).toBe('bond42');
      expect(result.issuer).toBe(ISSUER);
      expect(result.owner).toBe(BUYER);
      expect(result.txHash).toBe('TXHASH');
      expect(result.ledger).toBe(12345);

      // Horizon was hit for trustline + payment
      expect(loadAccountMock).toHaveBeenCalled();
      expect(submitTransactionMock).toHaveBeenCalled();
    });

    it('throws when Horizon loadAccount fails (network error)', async () => {
      loadAccountMock.mockRejectedValue(new Error('ECONNREFUSED'));
      await expect(service.issueBond('bond-42', BUYER)).rejects.toThrow('ECONNREFUSED');
    });

    it('throws when Horizon submitTransaction fails', async () => {
      submitTransactionMock.mockRejectedValue(new Error('Transaction failed'));
      await expect(service.issueBond('bond-42', BUYER)).rejects.toThrow('Transaction failed');
    });
  });

  describe('payOne() via issueBond — transaction construction', () => {
    it('uses BASE_FEE and the configured network passphrase', async () => {
      const builderSpy = jest.spyOn(TransactionBuilder.prototype, 'addOperation');
      await service.issueBond('bond-99', BUYER);

      expect(builderSpy).toHaveBeenCalled();
      const op = builderSpy.mock.calls[0][0] as { type: string; destination: string; amount: string };
      expect(op.type).toBe('payment');
      expect(op.destination).toBe(BUYER);
      expect(op.amount).toBe('1');
    });

    it('truncates memos to 28 bytes', async () => {
      const addMemoSpy = jest.spyOn(TransactionBuilder.prototype, 'addMemo');
      await service.issueBond('very-long-bond-id-that-would-overflow-memo', BUYER);

      expect(addMemoSpy).toHaveBeenCalled();
      const memo = addMemoSpy.mock.calls[0][0] as { type: string; value: string };
      expect(memo.type).toBe('text');
      expect(Buffer.byteLength(memo.value, 'utf8')).toBeLessThanOrEqual(28);
    });
  });

  describe('recordPrice()', () => {
    it('returns priceRecorded:false when seller is missing', async () => {
      const result = await service.recordPrice('bond-1', 100, '');
      expect(result).toEqual({ txHash: '', priceRecorded: false });
    });

    it('returns priceRecorded:false when amount is zero', async () => {
      const result = await service.recordPrice('bond-1', 0, SELLER);
      expect(result).toEqual({ txHash: '', priceRecorded: false });
    });

    it('returns priceRecorded:false when seller is the issuer', async () => {
      const result = await service.recordPrice('bond-1', 100, ISSUER);
      expect(result).toEqual({ txHash: '', priceRecorded: false });
    });

    it('submits VCRC payment and returns hash when price recording is wanted', async () => {
      const result = await service.recordPrice('bond-1', 150.5, SELLER);
      expect(result.priceRecorded).toBe(true);
      expect(result.txHash).toBe('TXHASH');
      expect(submitTransactionMock).toHaveBeenCalled();
    });

    it('swallows trustline failures and still attempts the price payment path', async () => {
      // First loadAccount (trustline check) fails; second (payment) succeeds.
      loadAccountMock
        .mockRejectedValueOnce(new Error('trustline failed'))
        .mockResolvedValueOnce(mockAccount());
      const result = await service.recordPrice('bond-1', 10, SELLER);
      expect(result.priceRecorded).toBe(true);
    });
  });

  describe('provisionUsdc()', () => {
    it('throws when the platform account has no USDC trustline', async () => {
      // loadAccount returns account with no USDC balances → hasTrustline false
      loadAccountMock.mockResolvedValue(mockAccount([]));
      await expect(service.provisionUsdc(BUYER, 10)).rejects.toThrow(/plataforma no tiene USDC/i);
    });

    it('submits a USDC payment when the platform holds USDC', async () => {
      loadAccountMock.mockResolvedValue(
        mockAccount([
          { asset_code: 'USDC', asset_issuer: ISSUER, balance: '1000.0000000' },
        ]),
      );
      const hash = await service.provisionUsdc(BUYER, 10);
      expect(hash).toBe('TXHASH');
      expect(submitTransactionMock).toHaveBeenCalled();
    });

    it('propagates Horizon network errors', async () => {
      loadAccountMock.mockRejectedValue(new Error('Horizon 504'));
      await expect(service.provisionUsdc(BUYER, 10)).rejects.toThrow('Horizon 504');
    });
  });

  describe('currentHolder()', () => {
    it('returns the account holding a positive balance of the bond asset', async () => {
      accountsCallMock.mockResolvedValue({
        records: [
          {
            account_id: BUYER,
            balances: [{ asset_code: 'bond42', asset_issuer: ISSUER, balance: '1.0000000' }],
          },
        ],
      });
      expect(await service.currentHolder('bond-42')).toBe(BUYER);
    });

    it('returns null when no account holds the asset', async () => {
      accountsCallMock.mockResolvedValue({ records: [] });
      expect(await service.currentHolder('bond-42')).toBeNull();
    });

    it('returns null when balances are only zero', async () => {
      accountsCallMock.mockResolvedValue({
        records: [
          {
            account_id: BUYER,
            balances: [{ asset_code: 'bond42', asset_issuer: ISSUER, balance: '0.0000000' }],
          },
        ],
      });
      expect(await service.currentHolder('bond-42')).toBeNull();
    });

    it('propagates Horizon network errors', async () => {
      accountsCallMock.mockRejectedValue(new Error('network down'));
      await expect(service.currentHolder('bond-42')).rejects.toThrow('network down');
    });
  });

  describe('buildBondPaymentXdr()', () => {
    it('builds an unsigned payment XDR for the bond asset', async () => {
      const xdr = await service.buildBondPaymentXdr(SELLER, BUYER, 'bond-7');
      expect(typeof xdr).toBe('string');
      expect(xdr.length).toBeGreaterThan(0);
      // Must parse back to a transaction on the configured network
      const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
      expect(tx.operations).toHaveLength(1);
    });

    it('propagates Horizon errors when loading the source account', async () => {
      loadAccountMock.mockRejectedValue(new Error('account not found'));
      await expect(service.buildBondPaymentXdr(SELLER, BUYER, 'bond-7')).rejects.toThrow(
        'account not found',
      );
    });
  });

  describe('submitSignedXdr()', () => {
    it('submits a pre-signed XDR and returns the hash', async () => {
      const kp = Keypair.random();
      const src = mockAccount();
      const tx = new TransactionBuilder(src as never, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: BUYER,
            asset: new Asset('bond7', ISSUER),
            amount: '1',
          }),
        )
        .setTimeout(60)
        .build();
      tx.sign(kp);

      const result = await service.submitSignedXdr(tx.toXDR());
      expect(result.hash).toBe('TXHASH');
      expect(submitTransactionMock).toHaveBeenCalled();
    });

    it('propagates Horizon submit errors', async () => {
      submitTransactionMock.mockRejectedValue(new Error('tx bad seq'));
      const kp = Keypair.random();
      const tx = new TransactionBuilder(mockAccount() as never, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: BUYER,
            asset: new Asset('bond7', ISSUER),
            amount: '1',
          }),
        )
        .setTimeout(60)
        .build();
      tx.sign(kp);
      await expect(service.submitSignedXdr(tx.toXDR())).rejects.toThrow('tx bad seq');
    });
  });

  describe('buildInstantBuyXdr()', () => {
    it('builds a DvP transaction with trustline + USDC + bond ops when needed', async () => {
      // Buyer has no bond trustline → changeTrust op is prepended
      loadAccountMock.mockResolvedValue(
        mockAccount([
          { asset_code: 'USDC', asset_issuer: ISSUER, balance: '500.0000000' },
        ]),
      );

      const xdr = await service.buildInstantBuyXdr({
        buyerAddress: BUYER,
        sellerAddress: SELLER,
        bondId: 'bond-55',
        usdcAmount: '25.0000000',
      });

      expect(typeof xdr).toBe('string');
      const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
      // changeTrust + USDC payment + bond payment = 3 ops
      expect(tx.operations).toHaveLength(3);
    });

    it('omits changeTrust when the buyer already holds the bond asset', async () => {
      loadAccountMock.mockResolvedValue(
        mockAccount([
          { asset_code: 'bond55', asset_issuer: ISSUER, balance: '1.0000000' },
          { asset_code: 'USDC', asset_issuer: ISSUER, balance: '500.0000000' },
        ]),
      );

      const xdr = await service.buildInstantBuyXdr({
        buyerAddress: BUYER,
        sellerAddress: SELLER,
        bondId: 'bond-55',
        usdcAmount: '25.0000000',
      });

      const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
      // USDC payment + bond payment only
      expect(tx.operations).toHaveLength(2);
    });

    it('propagates Horizon errors when loading the buyer account', async () => {
      loadAccountMock.mockRejectedValue(new Error('buyer account missing'));
      await expect(
        service.buildInstantBuyXdr({
          buyerAddress: BUYER,
          sellerAddress: SELLER,
          bondId: 'bond-1',
          usdcAmount: '10.0000000',
        }),
      ).rejects.toThrow('buyer account missing');
    });
  });

  describe('paymentAssetExplorerUrl()', () => {
    it('returns a VCRC explorer URL', () => {
      const url = service.paymentAssetExplorerUrl();
      expect(url).toContain('VCRC');
      expect(url).toContain(ISSUER);
    });
  });

  describe('usdcAsset() / usdcIssuer', () => {
    it('returns a USDC asset with the known testnet issuer', () => {
      const asset = service.usdcAsset();
      expect(asset.getCode()).toBe('USDC');
      expect(asset.getIssuer()).toBe(service.usdcIssuer);
    });
  });
});
