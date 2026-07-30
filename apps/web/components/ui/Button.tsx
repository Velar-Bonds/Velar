'use client';
/**
 * Button / IconButton — acción primaria de la UI.
 * Reutiliza el sistema `.btn-*` ya definido en globals.css (variantes, loading,
 * focus, reduced-motion) para no duplicar estilos y mantener consistencia.
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'ghost' | 'success' | 'danger' | 'warn' | 'ghost-danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn-action',
  ghost: 'btn-ghost',
  success: 'btn-action btn-success',
  danger: 'btn-action btn-danger',
  warn: 'btn-action btn-warn',
  'ghost-danger': 'btn-ghost btn-ghost-danger',
};

const SIZE_CLASS: Record<Size, string> = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Muestra spinner y bloquea el botón. */
  loading?: boolean;
  /** Ocupa todo el ancho disponible. */
  block?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, block, leftIcon, rightIcon, disabled, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        block && 'btn-block',
        loading && 'btn-loading',
        className,
      )}
      {...rest}
    >
      {loading && <span className="btn-spinner" aria-hidden />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Etiqueta accesible obligatoria (el botón solo tiene un icono). */
  'aria-label': string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', size = 'md', className, children, ...rest },
  ref,
) {
  const dim = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  return (
    <button
      ref={ref}
      className={cn(VARIANT_CLASS[variant], '!px-0', dim, className)}
      {...rest}
    >
      {children}
    </button>
  );
});
