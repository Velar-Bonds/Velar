import { Test, TestingModule } from '@nestjs/testing';
import { BondsService } from './bonds.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { StellarBondService } from '../escrow/stellar-bond.service';
import { WalletService } from '../escrow/wallet.service';
import { SorobanBondService } from '../escrow/soroban-bond.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('BondsService', () => {
  let service: BondsService;
  let audit: { emit: jest.Mock };
  let fromMock: jest.Mock;

  beforeEach(async () => {
    audit = { emit: jest.fn() };
    fromMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BondsService,
        { provide: SupabaseService, useValue: { admin: { from: fromMock } } },
        { provide: AuditService, useValue: audit },
        { provide: StellarBondService, useValue: { enabled: false } },
        { provide: WalletService, useValue: {} },
        { provide: SorobanBondService, useValue: { enabled: false } },
        { provide: NotificationsService, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get(BondsService);
  });

  it('emits BOND_PUBLISHED with previous status when publish succeeds', async () => {
    fromMock
      .mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                token_id: 'bond-1',
                current_owner: 'owner-1',
                status: 'activo',
              },
              error: null,
            }),
          })),
        })),
      })
      .mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { token_id: 'bond-1', status: 'en_venta' },
                error: null,
              }),
            })),
          })),
        })),
      });

    const result = await service.publish('bond-1', 'owner-1');

    expect(result.status).toBe('en_venta');
    expect(audit.emit).toHaveBeenCalledWith({
      type: 'bond_published',
      bondTokenId: 'bond-1',
      actorId: 'owner-1',
      payload: { previousStatus: 'activo', paymentMethods: ['sinpe', 'transferencia'] },
    });
  });
});
