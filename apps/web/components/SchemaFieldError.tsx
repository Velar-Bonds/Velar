import type { FieldErrors } from '@velar/types';
import { firstFieldError } from '../lib/forms/schema-form';

export function SchemaFieldError({ errors, field }: { errors: FieldErrors; field: string }) {
  const message = firstFieldError(errors, field);
  if (!message) return null;
  return <p id={`${field}-error`} role="alert" className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

export function schemaFieldProps(errors: FieldErrors, field: string) {
  const invalid = Boolean(firstFieldError(errors, field));
  return {
    'aria-invalid': invalid || undefined,
    'aria-describedby': invalid ? `${field}-error` : undefined,
  };
}
