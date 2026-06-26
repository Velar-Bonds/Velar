import { Test, TestingModule } from '@nestjs/testing';
import { PartiesService } from './parties.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { WalletService } from '../escrow/wallet.service';
import { AuditService } from '../audit/audit.service';

describe('PartiesService', () => {
  let service: PartiesService;
  let audit: AuditService;
  let walletCreateRecord: jest.Mock;
  let fromMock: jest.Mock;

  beforeEach(async () => {
    walletCreateRecord = jest.fn();
    fromMock = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartiesService,
        {
          provide: SupabaseService,
          useValue: { admin: { from: fromMock } },
        },
        {
          provide: WalletService,
          useValue: { createWalletRecord: walletCreateRecord },
        },
        {
          provide: AuditService,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(PartiesService);
    audit = module.get(AuditService);
  });

  describe('create()', () => {
    it('emite PARTY_CREATED con code, name y stellarWallet', async () => {
      walletCreateRecord.mockResolvedValue({
        publicKey: 'GABC123',
        status: 'funded',
        network: 'testnet',
      });
      fromMock.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { id: 'party-1', code: 'PA', name: 'Partido Aurora', stellar_wallet: 'GABC123' },
              error: null,
            }),
          })),
        })),
      });

      await service.create({ code: 'PA', name: 'Partido Aurora' }, 'tse-1');

      expect(audit.emit).toHaveBeenCalledWith({
        type: 'party_created',
        actorId: 'tse-1',
        payload: { code: 'PA', name: 'Partido Aurora', stellarWallet: 'GABC123' },
      });
    });

    it('emite PARTY_CREATED incluso en fallback insert con stellarWallet null', async () => {
      walletCreateRecord.mockRejectedValue(new Error('Friendbot falló'));
      fromMock
        .mockReturnValueOnce({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: null, error: { message: 'schema cache miss on column "stellar_wallet"' } }),
            })),
          })),
        })
        .mockReturnValueOnce({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'party-2', code: 'PB', name: 'Partido Beta' },
                error: null,
              }),
            })),
          })),
        });

      await service.create({ code: 'PB', name: 'Partido Beta' }, 'tse-1');

      expect(audit.emit).toHaveBeenCalledWith({
        type: 'party_created',
        actorId: 'tse-1',
        payload: { code: 'PB', name: 'Partido Beta', stellarWallet: null },
      });
    });
  });
});
