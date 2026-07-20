import {
  normalizeLocale,
  zodIssuesToFieldErrors,
  type FieldErrors,
  type Locale,
  type ValidationIssue,
} from '@velar/types';

type SchemaResult<T> =
  | { success: true; data: T }
  | { success: false; error: { issues: ValidationIssue[] } };

export interface FormSchema<TOutput = unknown> {
  safeParse(value: unknown): SchemaResult<TOutput>;
}

type SchemaOutput<TSchema> = TSchema extends { safeParse(value: unknown): SchemaResult<infer TOutput> }
  ? TOutput
  : never;

export type FormValidationResult<T> =
  | { success: true; data: T; errors: Record<string, never> }
  | { success: false; data?: never; errors: FieldErrors };

export function validateSchemaForm<TSchema extends { safeParse(value: unknown): unknown }>(
  schema: TSchema,
  values: unknown,
  locale: Locale = normalizeLocale(typeof navigator === 'undefined' ? 'es' : navigator.language),
): FormValidationResult<SchemaOutput<TSchema>> {
  const result = schema.safeParse(values) as SchemaResult<SchemaOutput<TSchema>>;
  if (result.success === true) return { success: true, data: result.data, errors: {} };
  return { success: false, errors: zodIssuesToFieldErrors(result.error.issues, locale) };
}

export function firstFieldError(errors: FieldErrors, field: string): string | undefined {
  return errors[field]?.[0];
}

export function clearFieldError(errors: FieldErrors, field: string): FieldErrors {
  if (!errors[field]) return errors;
  const next = { ...errors };
  delete next[field];
  return next;
}
