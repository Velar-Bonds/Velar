import { PaginatedResponse } from '@velar/types';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;

export function paginatedQuery(page = DEFAULT_PAGE, limit = DEFAULT_LIMIT) {
  const p = Math.max(1, page);
  const l = Math.max(1, limit);
  return `page=${p}&limit=${l}`;
}

export function isPaginated<T>(value: unknown): value is PaginatedResponse<T> {
  return (
    !!value &&
    typeof value === 'object' &&
    Array.isArray((value as PaginatedResponse<T>).data) &&
    typeof (value as PaginatedResponse<T>).total === 'number'
  );
}

export function unwrapPaginated<T>(value: T[] | PaginatedResponse<T> | unknown): T[] {
  if (isPaginated<T>(value)) return value.data;
  return Array.isArray(value) ? (value as T[]) : [];
}

export function paginationMeta(value: unknown, fallbackLength = 0) {
  if (isPaginated(value)) {
    return { page: value.page, limit: value.limit, total: value.total };
  }
  const total = fallbackLength;
  return { page: DEFAULT_PAGE, limit: total || DEFAULT_LIMIT, total };
}

export function paginationLabel(page: number, limit: number, total: number) {
  if (total === 0) return 'Mostrando 0 de 0';
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return `Mostrando ${start}–${end} de ${total}`;
}

export function hasNextPage(page: number, limit: number, total: number) {
  return page * limit < total;
}

export function hasPrevPage(page: number) {
  return page > 1;
}
