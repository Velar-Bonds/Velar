'use client';
import type { ReactNode } from 'react';
import { colorVar } from '../../ui/tokens';

/**
 * Shared chart wrapper (issue #44): title/description, an accessible SVG
 * region (`role="img"`, `aria-label`), and a screen-reader-only `<table>`
 * fallback with the exact same data — always in the DOM, no toggle needed.
 */

/**
 * Recharts' `<Tooltip>` ships a hardcoded white content box by default —
 * unreadable on the dark theme. Pass this to every `<Tooltip>` so it follows
 * the theme like the rest of the chart.
 */
export const chartTooltipStyle = {
  contentStyle: {
    background: colorVar('surface'),
    border: `1px solid ${colorVar('outlineVariant')}`,
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: colorVar('onSurface') },
  itemStyle: { color: colorVar('onSurface') },
  /** Recharts' default hover "cursor" is an opaque gray box — themed + translucent instead. */
  cursor: { fill: colorVar('outline'), opacity: 0.15 },
} as const;

export interface ChartTableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => string;
}

export function ChartTableFallback<T>({
  rows,
  columns,
  caption,
}: {
  rows: T[];
  columns: ChartTableColumn<T>[];
  caption: string;
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} scope="col">{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((c) => (
              <td key={c.key}>{c.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ChartFrame({
  title,
  description,
  children,
  table,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  table: ReactNode;
}) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="mb-1 font-semibold" style={{ fontFamily: 'Geist' }}>{title}</h3>
      {description && <p className="mb-4 text-xs text-on-surface-variant">{description}</p>}
      <div role="img" aria-label={description ?? title}>
        {children}
      </div>
      {table}
    </div>
  );
}
