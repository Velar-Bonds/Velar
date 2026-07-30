/**
 * Card — contenedor de superficie. Reutiliza `.velar-card` / `.velar-card-soft`.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `soft` usa la superficie tenue y radio medio. */
  variant?: 'default' | 'soft';
  /** Añade elevación en hover (usa `.velar-hover-card`). */
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PAD: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ variant = 'default', interactive, padding = 'md', className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        variant === 'soft' ? 'velar-card-soft' : 'velar-card',
        interactive && 'velar-hover-card',
        PAD[padding],
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-3 flex items-center justify-between gap-3', className)} {...rest} />;
}

export function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement> & { children: ReactNode }) {
  return (
    <h3 className={cn('text-base font-semibold text-on-surface', className)} {...rest}>
      {children}
    </h3>
  );
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-4 flex items-center gap-2', className)} {...rest} />;
}
