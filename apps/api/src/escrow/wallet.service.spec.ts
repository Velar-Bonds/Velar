import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { AuditService } from '../audit/audit.service';

describe('WalletService', () => {
  let service: WalletService;
  let audit: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: AuditService,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(WalletService);
    audit = module.get(AuditService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createWalletRecord()', () => {
    it('emite WALLET_PROVISIONED después de crear wallet', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());
      const result = await service.createWalletRecord('test:user');

      expect(audit.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'wallet_provisioned',
          payload: expect.objectContaining({
            label: 'test:user',
            publicKey: result.publicKey,
            status: 'funded',
            network: 'testnet',
          }),
        }),
      );
    });

    it('emite WALLET_PROVISIONED con status failed si friendbot falla', async () => {
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Friendbot error'));
      const result = await service.createWalletRecord('test:user2');

      expect(audit.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'wallet_provisioned',
          payload: expect.objectContaining({
            label: 'test:user2',
            publicKey: result.publicKey,
            status: 'failed',
          }),
        }),
      );
    });
  });
});
