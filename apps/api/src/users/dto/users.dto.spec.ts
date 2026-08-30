import { BulkSetRoleDto } from './users.dto';

describe('BulkSetRoleDto', () => {
  it('expone los campos requeridos por la operación en lote', () => {
    const dto = new BulkSetRoleDto();
    dto.userIds = ['user-1'];
    dto.role = 'comprador';
    expect(dto).toMatchObject({ userIds: ['user-1'], role: 'comprador' });
  });
});
