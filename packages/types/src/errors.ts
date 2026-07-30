import { z } from 'zod';

export const CONTRACT_VERSION = '1.0.0' as const;
export const SUPPORTED_LOCALES = ['es', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESPONSE_VALIDATION_ERROR: 'RESPONSE_VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
export const errorCodeSchema = z.nativeEnum(ErrorCode);

export const ERROR_MESSAGES: Record<Locale, Record<ErrorCode, string>> = {
  es: {
    VALIDATION_ERROR: 'Los datos enviados no son válidos.',
    RESPONSE_VALIDATION_ERROR: 'La respuesta de la API no coincide con el contrato.',
    UNAUTHORIZED: 'Debés iniciar sesión para continuar.',
    FORBIDDEN: 'No tenés permiso para realizar esta acción.',
    NOT_FOUND: 'No se encontró el recurso solicitado.',
    CONFLICT: 'La operación entra en conflicto con el estado actual.',
    RATE_LIMITED: 'Demasiadas solicitudes. Intentá de nuevo más tarde.',
    BUSINESS_RULE_VIOLATION: 'La operación no cumple una regla de negocio.',
    EXTERNAL_SERVICE_ERROR: 'Un servicio externo no pudo completar la operación.',
    NETWORK_ERROR: 'No se pudo conectar con la API.',
    INTERNAL_ERROR: 'Ocurrió un error interno.',
  },
  en: {
    VALIDATION_ERROR: 'The submitted data is invalid.',
    RESPONSE_VALIDATION_ERROR: 'The API response does not match the contract.',
    UNAUTHORIZED: 'You must sign in to continue.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    CONFLICT: 'The operation conflicts with the current state.',
    RATE_LIMITED: 'Too many requests. Please try again later.',
    BUSINESS_RULE_VIOLATION: 'The operation violates a business rule.',
    EXTERNAL_SERVICE_ERROR: 'An external service could not complete the operation.',
    NETWORK_ERROR: 'Could not connect to the API.',
    INTERNAL_ERROR: 'An internal error occurred.',
  },
};

const VALIDATION_MESSAGES = {
  es: {
    'validation.required': 'Este campo es obligatorio.',
    'validation.email': 'Ingresá un correo electrónico válido.',
    'validation.password': 'La contraseña debe tener al menos 8 caracteres.',
    'validation.positive': 'El valor debe ser mayor que cero.',
    'validation.date': 'Ingresá una fecha válida (AAAA-MM-DD).',
    'validation.url': 'Ingresá una URL válida.',
    'validation.enum': 'Seleccioná una opción válida.',
    'validation.stellarKey': 'Ingresá una llave pública Stellar válida.',
    'validation.partyFields': 'Nombre y código del partido son obligatorios.',
    'validation.paymentEvidence': 'Ingresá evidencia o contenido de evidencia.',
    'validation.response': 'La respuesta recibida no tiene la forma esperada.',
    'validation.invalid': 'El valor no es válido.',
  },
  en: {
    'validation.required': 'This field is required.',
    'validation.email': 'Enter a valid email address.',
    'validation.password': 'Password must contain at least 8 characters.',
    'validation.positive': 'The value must be greater than zero.',
    'validation.date': 'Enter a valid date (YYYY-MM-DD).',
    'validation.url': 'Enter a valid URL.',
    'validation.enum': 'Select a valid option.',
    'validation.stellarKey': 'Enter a valid Stellar public key.',
    'validation.partyFields': 'Party name and code are required.',
    'validation.paymentEvidence': 'Provide evidence or evidence content.',
    'validation.response': 'The received response has an unexpected shape.',
    'validation.invalid': 'The value is invalid.',
  },
} as const;

export type FieldErrors = Record<string, string[]>;
export interface ValidationIssue {
  code: string;
  message: string;
  path: Array<string | number>;
}

export const contractErrorSchema = z.object({
  code: errorCodeSchema,
  message: z.string().min(1),
  fields: z.record(z.string(), z.array(z.string())).optional(),
  details: z.unknown().optional(),
  requestId: z.string().optional(),
});

export const apiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: contractErrorSchema,
});

export type ContractError = z.infer<typeof contractErrorSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

export function normalizeLocale(value?: string | null): Locale {
  return value?.toLowerCase().startsWith('en') ? 'en' : 'es';
}

export function errorMessage(code: ErrorCode, locale: Locale = 'es'): string {
  return ERROR_MESSAGES[locale][code];
}

export function localizeZodIssue(issue: Pick<ValidationIssue, 'code' | 'message'>, locale: Locale = 'es'): string {
  const key = issue.message as keyof (typeof VALIDATION_MESSAGES)['es'];
  if (key in VALIDATION_MESSAGES[locale]) return VALIDATION_MESSAGES[locale][key];
  return VALIDATION_MESSAGES[locale]['validation.invalid'];
}

export function zodIssuesToFieldErrors(issues: ValidationIssue[], locale: Locale = 'es'): FieldErrors {
  return issues.reduce<FieldErrors>((result, issue) => {
    const field = issue.path.length ? issue.path.join('.') : '_form';
    (result[field] ??= []).push(localizeZodIssue(issue, locale));
    return result;
  }, {});
}

export function createApiError(
  code: ErrorCode,
  locale: Locale = 'es',
  options: Partial<Omit<ContractError, 'code'>> = {},
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message: options.message ?? errorMessage(code, locale),
      ...(options.fields ? { fields: options.fields } : {}),
      ...(options.details !== undefined ? { details: options.details } : {}),
      ...(options.requestId ? { requestId: options.requestId } : {}),
    },
  };
}
