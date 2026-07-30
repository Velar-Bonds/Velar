'use client';
/**
 * Form primitives — Field, Label, Input, Textarea, Select, Checkbox, Radio, Switch.
 * Accesibles: label asociada, aria-invalid, aria-describedby para errores/ayuda.
 */
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

const CONTROL = 'w-full rounded-xl border border-outline-variant/40 bg-surface px-3.5 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/60 focus:border-primary-container focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary-container)_12%,transparent)] disabled:cursor-not-allowed disabled:opacity-60';

/** Campo con label, texto de ayuda y error. Envuelve cualquier control. */
export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
  htmlFor,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="field-label">
          {label}
          {required && <span className="ml-0.5 text-error">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ invalid, className, ...rest }, ref) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={cn(CONTROL, invalid && 'border-error focus:border-error', className)} {...rest} />;
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ invalid, className, ...rest }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(CONTROL, 'min-h-24 resize-y', invalid && 'border-error focus:border-error', className)} {...rest} />;
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ invalid, className, children, ...rest }, ref) {
  return (
    <select ref={ref} aria-invalid={invalid || undefined} className={cn(CONTROL, 'cursor-pointer pr-9', invalid && 'border-error', className)} {...rest}>
      {children}
    </select>
  );
});

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
}
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, className, id, ...rest }, ref) {
  const gid = useId();
  const cid = id ?? gid;
  return (
    <label htmlFor={cid} className={cn('inline-flex cursor-pointer items-center gap-2 text-sm text-on-surface', className)}>
      <input ref={ref} id={cid} type="checkbox" className="h-4 w-4 rounded border-outline-variant text-primary-container accent-[color:var(--color-primary-container)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container" {...rest} />
      {label}
    </label>
  );
});

export const Radio = forwardRef<HTMLInputElement, CheckboxProps>(function Radio({ label, className, id, ...rest }, ref) {
  const gid = useId();
  const rid = id ?? gid;
  return (
    <label htmlFor={rid} className={cn('inline-flex cursor-pointer items-center gap-2 text-sm text-on-surface', className)}>
      <input ref={ref} id={rid} type="radio" className="h-4 w-4 border-outline-variant accent-[color:var(--color-primary-container)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container" {...rest} />
      {label}
    </label>
  );
});

/** Switch accesible (checkbox estilizado como toggle). */
export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
}
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch({ label, className, id, checked, ...rest }, ref) {
  const gid = useId();
  const sid = id ?? gid;
  return (
    <label htmlFor={sid} className={cn('inline-flex cursor-pointer items-center gap-2.5 text-sm text-on-surface', className)}>
      <span className="relative inline-flex h-5 w-9 flex-shrink-0 items-center">
        <input ref={ref} id={sid} type="checkbox" checked={checked} className="peer sr-only" {...rest} />
        <span className="absolute inset-0 rounded-full bg-outline transition peer-checked:bg-primary-container peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-container" />
        <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
      </span>
      {label}
    </label>
  );
});
