import { paginationLabel } from '../lib/pagination';

type Props = {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

export function PaginationControls({ page, limit, total, onPageChange, disabled }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-variant/30 px-4 py-3 text-sm">
      <p className="text-xs text-on-surface-variant">{paginationLabel(page, limit, total)}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || !canPrev}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-xs text-on-surface-variant">Página {page} de {totalPages}</span>
        <button
          type="button"
          disabled={disabled || !canNext}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
