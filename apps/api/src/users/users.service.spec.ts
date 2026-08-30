import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { WalletReconciliationService } from './wallet-reconciliation.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { WalletService } from '../escrow/wallet.service';
import { AuditService } from '../audit/audit.service';

/**
 * Directorio de usuarios (paginación/búsqueda/filtro) y administración de
 * roles (individual y en lote), contra un SupabaseService mockeado.
 * Sin base de datos ni credenciales.
 */
function chain(result: { data?: any; error?: any; count?: number | null }) {
  const obj: any = {
    select: jest.fn(() => obj),
    update: jest.fn(() => obj),
    eq: jest.fn(() => obj),
    ilike: jest.fn(() => obj),
    or: jest.fn(() => obj),
    order: jest.fn(() => obj),
    range: jest.fn(() => Promise.resolve(result)),
    single: jest.fn(() => Promise.resolve(result)),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return obj;
}

describe('UsersService', () => {
  let service: UsersService;
  let fromMock: jest.Mock;
  let audit: { emit: jest.Mock; getUserAuditTrail: jest.Mock };

  beforeEach(async () => {
    fromMock = jest.fn();
    audit = { emit: jest.fn(), getUserAuditTrail: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: SupabaseService, useValue: { admin: { from: fromMock } } },
        { provide: WalletService, useValue: { createWalletRecord: jest.fn() } },
        { provide: AuditService, useValue: audit },
        { provide: WalletReconciliationService, useValue: { retryProfile: jest.fn() } },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('listUsers', () => {
    it('rechaza roles que no son tse/admin', async () => {
      await expect(service.listUsers('comprador' as any)).rejects.toThrow(ForbiddenException);
      expect(fromMock).not.toHaveBeenCalled();
    });

    it('devuelve una respuesta paginada con page/limit/total', async () => {
      const rows = [{ id: 'u1', full_name: 'Ana' }, { id: 'u2', full_name: 'Beto' }];
      fromMock.mockReturnValueOnce(chain({ data: rows, count: 42, error: null }));

      const result = await service.listUsers('admin', '2', '20');

      expect(result).toEqual({ data: rows, total: 42, page: 2, limit: 20 });
      const q = fromMock.mock.results[0].value;
      expect(q.range).toHaveBeenCalledWith(20, 39);
    });

    it('filtra por rol con eq()', async () => {
      const q = chain({ data: [], count: 0, error: null });
      fromMock.mockReturnValueOnce(q);

      await service.listUsers('admin', undefined, undefined, 'comprador' as any);

      expect(q.eq).toHaveBeenCalledWith('role', 'comprador');
    });

    it('busca por nombre/email con or()/ilike vía OR string', async () => {
      const q = chain({ data: [], count: 0, error: null });
      fromMock.mockReturnValueOnce(q);

      await service.listUsers('tse', undefined, undefined, undefined, 'ana');

      expect(q.or).toHaveBeenCalledWith('full_name.ilike.%ana%,email.ilike.%ana%');
    });

    it('propaga errores de Supabase como BadRequestException', async () => {
      fromMock.mockReturnValueOnce(chain({ data: null, count: null, error: { message: 'boom' } }));
      await expect(service.listUsers('admin')).rejects.toThrow(BadRequestException);
    });
  });

  describe('setRole', () => {
    it('rechaza si el actor no es admin', async () => {
      await expect(service.setRole('u1', 'tse' as any, 'tse' as any, 'actor-1'))
        .rejects.toThrow(ForbiddenException);
      expect(fromMock).not.toHaveBeenCalled();
    });

    it('actualiza el rol y audita el cambio con el admin como actor', async () => {
      const row = { id: 'u1', role: 'tse' };
      fromMock.mockReturnValueOnce(chain({ data: row, error: null }));

      const result = await service.setRole('u1', 'tse' as any, 'admin' as any, 'admin-1');

      expect(result).toEqual(row);
      expect(audit.emit).toHaveBeenCalledWith({
        type: 'user_role_changed',
        actorId: 'admin-1',
        payload: { targetUserId: 'u1', newRole: 'tse' },
      });
    });

    it('no audita si Supabase falla', async () => {
      fromMock.mockReturnValueOnce(chain({ data: null, error: { message: 'not found' } }));
      await expect(service.setRole('ghost', 'tse' as any, 'admin' as any, 'admin-1'))
        .rejects.toThrow(BadRequestException);
      expect(audit.emit).not.toHaveBeenCalled();
    });
  });

  describe('bulkSetRole', () => {
    it('rechaza si el actor no es admin', async () => {
      await expect(service.bulkSetRole(['u1', 'u2'], 'tse' as any, 'tse' as any, 'actor-1'))
        .rejects.toThrow(ForbiddenException);
      expect(fromMock).not.toHaveBeenCalled();
    });

    it('actualiza cada usuario y audita cada cambio individualmente', async () => {
      fromMock
        .mockReturnValueOnce(chain({ data: { id: 'u1' }, error: null }))
        .mockReturnValueOnce(chain({ data: { id: 'u2' }, error: null }));

      const result = await service.bulkSetRole(['u1', 'u2'], 'comprador' as any, 'admin' as any, 'admin-1');

      expect(result).toEqual({ ok: true, updated: ['u1', 'u2'] });
      expect(audit.emit).toHaveBeenCalledTimes(2);
      expect(audit.emit).toHaveBeenNthCalledWith(1, {
        type: 'user_role_changed',
        actorId: 'admin-1',
        payload: { targetUserId: 'u1', newRole: 'comprador' },
      });
      expect(audit.emit).toHaveBeenNthCalledWith(2, {
        type: 'user_role_changed',
        actorId: 'admin-1',
        payload: { targetUserId: 'u2', newRole: 'comprador' },
      });
    });

    it('omite los ids que fallan sin abortar el lote ni auditarlos', async () => {
      fromMock
        .mockReturnValueOnce(chain({ data: null, error: { message: 'not found' } }))
        .mockReturnValueOnce(chain({ data: { id: 'u2' }, error: null }));

      const result = await service.bulkSetRole(['ghost', 'u2'], 'comprador' as any, 'admin' as any, 'admin-1');

      expect(result).toEqual({ ok: true, updated: ['u2'] });
      expect(audit.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserAuditTrail', () => {
    it('rechaza roles que no son tse/admin', async () => {
      await expect(service.getUserAuditTrail('u1', 'comprador' as any))
        .rejects.toThrow(ForbiddenException);
      expect(audit.getUserAuditTrail).not.toHaveBeenCalled();
    });

    it('delega en AuditService.getUserAuditTrail', async () => {
      const events = [{ id: 'e1', type: 'user_role_changed' }];
      audit.getUserAuditTrail.mockResolvedValueOnce(events);

      const result = await service.getUserAuditTrail('u1', 'admin' as any);

      expect(audit.getUserAuditTrail).toHaveBeenCalledWith('u1');
      expect(result).toBe(events);
    });
  });
});
