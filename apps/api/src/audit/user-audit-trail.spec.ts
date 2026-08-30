import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { SupabaseService } from '../common/supabase/supabase.service';

/**
 * Trazabilidad de auditoría por usuario (parte de la administración de
 * usuarios): eventos donde el usuario fue actor o el objetivo de una acción
 * de un admin (payload.targetUserId), como cambios de rol o (des)activación.
 */
function chain(result: { data?: any; error?: any }) {
  const obj: any = {
    select: jest.fn(() => obj),
    or: jest.fn(() => obj),
    order: jest.fn(() => Promise.resolve(result)),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return obj;
}

describe('AuditService.getUserAuditTrail', () => {
  let service: AuditService;
  let fromMock: jest.Mock;

  beforeEach(async () => {
    fromMock = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: SupabaseService, useValue: { admin: { from: fromMock } } },
      ],
    }).compile();
    service = module.get(AuditService);
  });

  it('filtra por actor_id o payload.targetUserId con un OR', async () => {
    const q = chain({ data: [], error: null });
    fromMock.mockReturnValueOnce(q);

    await service.getUserAuditTrail('user-1');

    expect(q.or).toHaveBeenCalledWith('actor_id.eq.user-1,payload->>targetUserId.eq.user-1');
  });

  it('mapea las filas al shape AuditEvent, más recientes primero', async () => {
    const rows = [
      { id: 'e2', bond_token_id: null, transfer_id: null, type: 'user_role_changed', actor_id: 'admin-1', payload: { targetUserId: 'user-1', newRole: 'tse' }, tx_hash: null, created_at: '2026-06-02T00:00:00Z' },
      { id: 'e1', bond_token_id: null, transfer_id: null, type: 'auth_account_deactivated', actor_id: 'admin-1', payload: { targetUserId: 'user-1' }, tx_hash: null, created_at: '2026-06-01T00:00:00Z' },
    ];
    fromMock.mockReturnValueOnce(chain({ data: rows, error: null }));

    const result = await service.getUserAuditTrail('user-1');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'e2', type: 'user_role_changed', actorId: 'admin-1', payload: { targetUserId: 'user-1', newRole: 'tse' } });
  });

  it('propaga errores de Supabase como BadRequestException', async () => {
    fromMock.mockReturnValueOnce(chain({ data: null, error: { message: 'boom' } }));
    await expect(service.getUserAuditTrail('user-1')).rejects.toThrow(BadRequestException);
  });
});
