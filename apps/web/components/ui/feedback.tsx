/**
 * Feedback — Spinner, Skeleton, Alert, EmptyState.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from './cn';

export function Spinner({ size = 16, className, label = 'Cargando' }: { size?: number; className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-block animate-[spin_0.65s_linear_infinite] rounded-full border-2 border-current border-t-transparent align-[-2px]', className)}
      style={{ width: size, height: size }}
    />
  );
}

/** Bloque de carga. `rounded`/`h`/`w` vía className. */
export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-surface-container-highest/60', className)}
      {...rest}
    />
  );
}

type AlertTone = 'info' | 'success' | 'warning' | 'error';

const ALERT: Record<AlertTone, { cls: string; Icon: typeof Info }> = {
  info: { cls: 'border-primary-container/25 bg-primary-fixed text-on-surface', Icon: Info },
  success: { cls: 'border-success/25 bg-success/10 text-on-surface', Icon: CheckCircle2 },
  warning: { cls: 'border-[color:var(--velar-warning)]/30 bg-[color:var(--velar-warning)]/10 text-on-surface', Icon: AlertTriangle },
  error: { cls: 'border-error/30 bg-error-container text-on-surface', Icon: XCircle },
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
}

export function Alert({ tone = 'info', title, className, children, ...rest }: AlertProps) {
  const { cls, Icon } = ALERT[tone];
  return (
    <div role="alert" className={cn('flex gap-3 rounded-xl border p-3.5 text-sm', cls, className)} {...rest}>
      <Icon size={18} className="mt-0.5 flex-shrink-0 opacity-80" aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'text-on-surface-variant')}>{children}</div>}
      </div>
    </div>
  );
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('velar-empty flex flex-col items-center gap-2 px-6 py-12 text-center', className)}>
      {icon && <div className="mb-1 text-on-surface-variant opacity-70">{icon}</div>}
      <p className="font-semibold text-on-surface">{title}</p>
      {description && <p className="max-w-sm text-sm text-on-surface-variant">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
