'use client';

import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginatedResponse } from '@velar/types';
import { cn } from './cn.js';
import { Button } from './Button.js';
import { Spinner, EmptyState, Alert } from './feedback.js';

export type TableSortDirection = 'asc' | 'desc';

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | null | undefined;
  render?: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export interface TablePagination {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  getRowId: (row: T) => string;
  pagination?: TablePagination;
  loading?: boolean;
  error?: ReactNode;
  emptyState?: ReactNode;
  sortKey?: string;
  sortDirection?: TableSortDirection;
  onSortChange?: (key: string, direction: TableSortDirection) => void;
  className?: string;
  tableClassName?: string;
  rowClassName?: string | ((row: T) => string | undefined);
  caption?: string;
}

function getNextSortDirection(
  currentKey: string | undefined,
  currentDirection: TableSortDirection | undefined,
  key: string,
): TableSortDirection {
  if (currentKey !== key) return 'asc';
  return currentDirection === 'asc' ? 'desc' : 'asc';
}

function sortRows<T>(
  data: T[],
  column: TableColumn<T>,
  direction: TableSortDirection,
): T[] {
  if (!column.sortValue) return data;

  return [...data].sort((a, b) => {
    const aValue = column.sortValue?.(a);
    const bValue = column.sortValue?.(b);

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    let result: number;

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      result = aValue - bValue;
    } else {
      result = String(aValue).localeCompare(String(bValue));
    }

    return direction === 'asc' ? result : -result;
  });
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction?: TableSortDirection;
}) {
  if (!active) {
    return <ChevronsUpDown size={14} aria-hidden />;
  }

  return direction === 'asc'
    ? <ChevronUp size={14} aria-hidden />
    : <ChevronDown size={14} aria-hidden />;
}

export function Table<T>({
  data,
  columns,
  getRowId,
  pagination,
  loading = false,
  error,
  emptyState,
  sortKey,
  sortDirection = 'asc',
  onSortChange,
  className,
  tableClassName,
  rowClassName,
  caption,
}: TableProps<T>) {
  const sortedData =
    sortKey && !onSortChange
      ? (() => {
          const column = columns.find((item) => item.key === sortKey);
          return column?.sortValue
            ? sortRows(data, column, sortDirection)
            : data;
        })()
      : data;

  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable) return;

    const direction = getNextSortDirection(
      sortKey,
      sortDirection,
      column.key,
    );

    onSortChange?.(column.key, direction);
  };

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
    : 1;

  const canGoPrevious = pagination ? pagination.page > 1 : false;
  const canGoNext = pagination ? pagination.page < totalPages : false;

  return (
    <div className={cn('w-full overflow-hidden', className)}>
      {caption && <p className="sr-only">{caption}</p>}

      <div className="overflow-x-auto">
        <table
          className={cn('w-full text-left text-sm', tableClassName)}
          aria-busy={loading || undefined}
        >
          {caption && <caption className="sr-only">{caption}</caption>}

          <thead className="border-b border-outline-variant/30 bg-surface-container-low/60 text-[11px] uppercase tracking-wide text-on-surface-variant">
            <tr>
              {columns.map((column) => {
                const sortable = column.sortable && Boolean(onSortChange || column.sortValue);
                const active = sortKey === column.key;

                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn('px-5 py-3', column.headerClassName)}
                    aria-sort={
                      sortable && active
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : sortable
                          ? 'none'
                          : undefined
                    }
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column)}
                        className="inline-flex min-h-8 items-center gap-1 rounded-md font-inherit outline-none transition-colors hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={`Ordenar por ${String(column.header)}`}
                      >
                        <span>{column.header}</span>
                        <SortIcon active={active} direction={sortDirection} />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-outline-variant/20">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center text-on-surface-variant"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Spinner size={18} />
                    <span>Cargando…</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-6">
                  <Alert tone="error">{error}</Alert>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-6">
                  {emptyState ?? (
                    <EmptyState
                      title="No hay datos para mostrar"
                      description="No se encontraron registros."
                    />
                  )}
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr
                  key={getRowId(row)}
                  className={cn(
                    'transition-colors hover:bg-primary/[0.02]',
                    typeof rowClassName === 'function'
                      ? rowClassName(row)
                      : rowClassName,
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn('px-5 py-3.5', column.cellClassName)}
                    >
                      {column.render
                        ? column.render(row)
                        : String(
                            (row as Record<string, unknown>)[column.key] ?? '',
                          )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 && (
        <div
          className="flex items-center justify-between border-t border-outline-variant/20 px-5 py-3"
          aria-label="Paginación"
        >
          <p className="text-xs text-on-surface-variant">
            Página {pagination.page} de {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!canGoPrevious}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              aria-label="Página anterior"
              leftIcon={<ChevronLeft size={14} aria-hidden />}
            >
              Anterior
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!canGoNext}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              aria-label="Página siguiente"
              rightIcon={<ChevronRight size={14} aria-hidden />}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export interface DataTableProps<T> extends TableProps<T> {
  response?: PaginatedResponse<T>;
}

export function DataTable<T>({
  response,
  pagination,
  data,
  ...props
}: DataTableProps<T>) {
  const resolvedData = response?.data ?? data;

  const resolvedPagination = response
    ? {
        page: response.page,
        limit: response.limit,
        total: response.total,
        onPageChange: pagination?.onPageChange ?? (() => {}),
      }
    : pagination;

  return (
    <Table
      {...props}
      data={resolvedData}
      pagination={resolvedPagination}
    />
  );
}
