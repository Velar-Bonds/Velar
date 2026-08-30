import { UsersController } from './users.controller';

describe('UsersController user administration routes', () => {
  const users = { listUsers: jest.fn(), bulkSetRole: jest.fn(), getUserAuditTrail: jest.fn() } as any;
  const controller = new UsersController(users);
  const actor = { id: 'admin-1', profile: { role: 'admin' } };

  it('pasa filtros y paginación al servicio', () => {
    controller.listAll('2', '20', 'comprador', 'ana', actor);
    expect(users.listUsers).toHaveBeenCalledWith('admin', '2', '20', 'comprador', 'ana');
  });

  it('conserva el actor de una asignación masiva', () => {
    controller.bulkSetRole({ userIds: ['u1'], role: 'tse' }, actor);
    expect(users.bulkSetRole).toHaveBeenCalledWith(['u1'], 'tse', 'admin', 'admin-1');
  });
});
