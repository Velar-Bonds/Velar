import { Test, TestingModule } from '@nestjs/testing';
import { TransfersService } from './transfers.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { StellarBondService } from '../escrow/stellar-bond.service';
import { TrustlessWorkService } from '../escrow/trustless-work.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('TransfersService', () => {
  let service: TransfersService;
  let audit: { emit: jest.Mock };
  let notifications: { emit: jest.Mock };
  let fromMock: jest.Mock;

  beforeEach(async () => {
    audit = { emit: jest.fn() };
    notifications = { emit: jest.fn() };
    fromMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransfersService,
        { provide: SupabaseService, useValue: { admin: { from: fromMock } } },
        { provide: AuditService, useValue: audit },
        { provide: StellarBondService, useValue: { enabled: false } },
        { provide: TrustlessWorkService, useValue: { enabled: false } },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(TransfersService);
  });

  it('emits COUNTER_OFFER_SENT in counterOffer()', async () => {
    fromMock
      .mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'transfer-1',
                bond_token_id: 'bond-1',
                from_owner: 'seller-1',
                to_owner: 'buyer-1',
                status: 'solicitada',
              },
            }),
          })),
        })),
      })
      .mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'transfer-1', status: 'contraoferta', counter_offer_amount: 1500 },
                error: null,
              }),
            })),
          })),
        })),
      });

    await service.counterOffer('transfer-1', 1500, 'new amount', 'seller-1');

    expect(audit.emit).toHaveBeenCalledWith({
      type: 'counter_offer_sent',
      bondTokenId: 'bond-1',
      transferId: 'transfer-1',
      actorId: 'seller-1',
      payload: { counterOfferAmount: 1500, message: 'new amount' },
    });
  });
});
