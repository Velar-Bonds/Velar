'use client';
/**
 * Tooltip — descripción emergente accesible (hover + focus, Escape para cerrar).
 * CSS puro para posición; se muestra en focus para soporte de teclado.
 */
import { useId, useState, type ReactNode } from 'react';
import { cn } from './cn';

type Side = 'top' | 'bottom' | 'left' | 'right';

const SIDE: Record<Side, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
  right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
};

export function Tooltip({ label, side = 'top', children, className }: { label: ReactNode; side?: Side; children: ReactNode; className?: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      <span
        role="tooltip"
        id={id}
        hidden={!open}
        className={cn(
          'pointer-events-none absolute z-50 w-max max-w-xs rounded-lg bg-inverse-surface px-2.5 py-1.5 text-xs font-medium text-inverse-on-surface shadow-lg',
          SIDE[side],
        )}
      >
        {label}
      </span>
    </span>
  );
}
