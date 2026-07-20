"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiErrorResponseSchema = exports.contractErrorSchema = exports.ERROR_MESSAGES = exports.errorCodeSchema = exports.ErrorCode = exports.SUPPORTED_LOCALES = exports.CONTRACT_VERSION = void 0;
exports.normalizeLocale = normalizeLocale;
exports.errorMessage = errorMessage;
exports.localizeZodIssue = localizeZodIssue;
exports.zodIssuesToFieldErrors = zodIssuesToFieldErrors;
exports.createApiError = createApiError;
const zod_1 = require("zod");
exports.CONTRACT_VERSION = '1.0.0';
exports.SUPPORTED_LOCALES = ['es', 'en'];
exports.ErrorCode = {
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
};
exports.errorCodeSchema = zod_1.z.nativeEnum(exports.ErrorCode);
exports.ERROR_MESSAGES = {
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
};
exports.contractErrorSchema = zod_1.z.object({
    code: exports.errorCodeSchema,
    message: zod_1.z.string().min(1),
    fields: zod_1.z.record(zod_1.z.array(zod_1.z.string())).optional(),
    details: zod_1.z.unknown().optional(),
    requestId: zod_1.z.string().optional(),
});
exports.apiErrorResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(false),
    error: exports.contractErrorSchema,
});
function normalizeLocale(value) {
    return (value === null || value === void 0 ? void 0 : value.toLowerCase().startsWith('en')) ? 'en' : 'es';
}
function errorMessage(code, locale = 'es') {
    return exports.ERROR_MESSAGES[locale][code];
}
function localizeZodIssue(issue, locale = 'es') {
    const key = issue.message;
    if (key in VALIDATION_MESSAGES[locale])
        return VALIDATION_MESSAGES[locale][key];
    return VALIDATION_MESSAGES[locale]['validation.invalid'];
}
function zodIssuesToFieldErrors(issues, locale = 'es') {
    return issues.reduce((result, issue) => {
        var _a;
        const field = issue.path.length ? issue.path.join('.') : '_form';
        ((_a = result[field]) !== null && _a !== void 0 ? _a : (result[field] = [])).push(localizeZodIssue(issue, locale));
        return result;
    }, {});
}
function createApiError(code, locale = 'es', options = {}) {
    var _a;
    return {
        success: false,
        error: Object.assign(Object.assign(Object.assign({ code, message: (_a = options.message) !== null && _a !== void 0 ? _a : errorMessage(code, locale) }, (options.fields ? { fields: options.fields } : {})), (options.details !== undefined ? { details: options.details } : {})), (options.requestId ? { requestId: options.requestId } : {})),
    };
}
