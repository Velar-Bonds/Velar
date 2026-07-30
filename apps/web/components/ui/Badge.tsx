/**
 * Badge / Tag — etiquetas de estado y metadatos.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

const TONE: Record<Tone, string> = {
  neutral: 'border-outline-variant bg-surface-container text-on-surface-variant',
  primary: 'border-primary-container/30 bg-primary-fixed text-primary-container',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-[color:var(--velar-warning)]',
  error: 'border-error/30 bg-error-container text-error',
  info: 'border-primary-container/30 bg-primary-fixed text-primary',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** Muestra un punto de color a la izquierda. */
  dot?: boolean;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', dot, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
        TONE[tone],
        className,
      )}
      {...rest}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />}
      {children}
    </span>
  );
}

/** Tag: variante cuadrada para keywords/filtros. */
export function Tag({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
        TONE[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
