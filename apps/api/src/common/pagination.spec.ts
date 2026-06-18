import { parsePagination, paginatedResponse } from './pagination';

describe('parsePagination', () => {
  it('usa page=1 y limit=20 por defecto', () => {
    expect(parsePagination(undefined, undefined)).toEqual({ page: 1, limit: 20, from: 0, to: 19 });
  });

  it('calcula el rango para page=2 y limit=5', () => {
    expect(parsePagination('2', '5')).toEqual({ page: 2, limit: 5, from: 5, to: 9 });
  });

  it('limita valores invalidos', () => {
    expect(parsePagination('0', '-1')).toEqual({ page: 1, limit: 1, from: 0, to: 0 });
    expect(parsePagination('1', '500').limit).toBe(100);
  });
});

describe('paginatedResponse', () => {
  it('devuelve la forma PaginatedResponse', () => {
    expect(paginatedResponse(['a', 'b'], 12, 2, 5)).toEqual({
      data: ['a', 'b'],
      total: 12,
      page: 2,
      limit: 5,
    });
  });
});
