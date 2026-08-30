import { paginationLabel, paginatedQuery } from './pagination';

describe('pagination helpers for the user directory', () => {
  it('normalizes a positive query', () => {
    expect(paginatedQuery(2, 20)).toBe('page=2&limit=20');
  });

  it('labels the final page correctly', () => {
    expect(paginationLabel(3, 20, 42)).toBe('Mostrando 41–42 de 42');
  });
});
