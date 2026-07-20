import { z } from 'zod';
export declare const CONTRACT_VERSION: "1.0.0";
export declare const SUPPORTED_LOCALES: readonly ["es", "en"];
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export declare const ErrorCode: {
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly RESPONSE_VALIDATION_ERROR: "RESPONSE_VALIDATION_ERROR";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly RATE_LIMITED: "RATE_LIMITED";
    readonly BUSINESS_RULE_VIOLATION: "BUSINESS_RULE_VIOLATION";
    readonly EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
export declare const errorCodeSchema: z.ZodNativeEnum<{
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly RESPONSE_VALIDATION_ERROR: "RESPONSE_VALIDATION_ERROR";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly RATE_LIMITED: "RATE_LIMITED";
    readonly BUSINESS_RULE_VIOLATION: "BUSINESS_RULE_VIOLATION";
    readonly EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
}>;
export declare const ERROR_MESSAGES: Record<Locale, Record<ErrorCode, string>>;
export type FieldErrors = Record<string, string[]>;
export interface ValidationIssue {
    code: string;
    message: string;
    path: Array<string | number>;
}
export declare const contractErrorSchema: z.ZodObject<{
    code: z.ZodNativeEnum<{
        readonly VALIDATION_ERROR: "VALIDATION_ERROR";
        readonly RESPONSE_VALIDATION_ERROR: "RESPONSE_VALIDATION_ERROR";
        readonly UNAUTHORIZED: "UNAUTHORIZED";
        readonly FORBIDDEN: "FORBIDDEN";
        readonly NOT_FOUND: "NOT_FOUND";
        readonly CONFLICT: "CONFLICT";
        readonly RATE_LIMITED: "RATE_LIMITED";
        readonly BUSINESS_RULE_VIOLATION: "BUSINESS_RULE_VIOLATION";
        readonly EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR";
        readonly NETWORK_ERROR: "NETWORK_ERROR";
        readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    }>;
    message: z.ZodString;
    fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
    details: z.ZodOptional<z.ZodUnknown>;
    requestId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: "VALIDATION_ERROR" | "RESPONSE_VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED" | "BUSINESS_RULE_VIOLATION" | "EXTERNAL_SERVICE_ERROR" | "NETWORK_ERROR" | "INTERNAL_ERROR";
    message: string;
    fields?: Record<string, string[]> | undefined;
    details?: unknown;
    requestId?: string | undefined;
}, {
    code: "VALIDATION_ERROR" | "RESPONSE_VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED" | "BUSINESS_RULE_VIOLATION" | "EXTERNAL_SERVICE_ERROR" | "NETWORK_ERROR" | "INTERNAL_ERROR";
    message: string;
    fields?: Record<string, string[]> | undefined;
    details?: unknown;
    requestId?: string | undefined;
}>;
export declare const apiErrorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodNativeEnum<{
            readonly VALIDATION_ERROR: "VALIDATION_ERROR";
            readonly RESPONSE_VALIDATION_ERROR: "RESPONSE_VALIDATION_ERROR";
            readonly UNAUTHORIZED: "UNAUTHORIZED";
            readonly FORBIDDEN: "FORBIDDEN";
            readonly NOT_FOUND: "NOT_FOUND";
            readonly CONFLICT: "CONFLICT";
            readonly RATE_LIMITED: "RATE_LIMITED";
            readonly BUSINESS_RULE_VIOLATION: "BUSINESS_RULE_VIOLATION";
            readonly EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR";
            readonly NETWORK_ERROR: "NETWORK_ERROR";
            readonly INTERNAL_ERROR: "INTERNAL_ERROR";
        }>;
        message: z.ZodString;
        fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
        details: z.ZodOptional<z.ZodUnknown>;
        requestId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code: "VALIDATION_ERROR" | "RESPONSE_VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED" | "BUSINESS_RULE_VIOLATION" | "EXTERNAL_SERVICE_ERROR" | "NETWORK_ERROR" | "INTERNAL_ERROR";
        message: string;
        fields?: Record<string, string[]> | undefined;
        details?: unknown;
        requestId?: string | undefined;
    }, {
        code: "VALIDATION_ERROR" | "RESPONSE_VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED" | "BUSINESS_RULE_VIOLATION" | "EXTERNAL_SERVICE_ERROR" | "NETWORK_ERROR" | "INTERNAL_ERROR";
        message: string;
        fields?: Record<string, string[]> | undefined;
        details?: unknown;
        requestId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    success: false;
    error: {
        code: "VALIDATION_ERROR" | "RESPONSE_VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED" | "BUSINESS_RULE_VIOLATION" | "EXTERNAL_SERVICE_ERROR" | "NETWORK_ERROR" | "INTERNAL_ERROR";
        message: string;
        fields?: Record<string, string[]> | undefined;
        details?: unknown;
        requestId?: string | undefined;
    };
}, {
    success: false;
    error: {
        code: "VALIDATION_ERROR" | "RESPONSE_VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED" | "BUSINESS_RULE_VIOLATION" | "EXTERNAL_SERVICE_ERROR" | "NETWORK_ERROR" | "INTERNAL_ERROR";
        message: string;
        fields?: Record<string, string[]> | undefined;
        details?: unknown;
        requestId?: string | undefined;
    };
}>;
export type ContractError = z.infer<typeof contractErrorSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
export declare function normalizeLocale(value?: string | null): Locale;
export declare function errorMessage(code: ErrorCode, locale?: Locale): string;
export declare function localizeZodIssue(issue: Pick<ValidationIssue, 'code' | 'message'>, locale?: Locale): string;
export declare function zodIssuesToFieldErrors(issues: ValidationIssue[], locale?: Locale): FieldErrors;
export declare function createApiError(code: ErrorCode, locale?: Locale, options?: Partial<Omit<ContractError, 'code'>>): ApiErrorResponse;
