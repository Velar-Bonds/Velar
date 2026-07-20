import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import {
  createApiError,
  ErrorCode,
  findContract,
  normalizeLocale,
  zodIssuesToFieldErrors,
  type EndpointContract,
  type Locale,
} from '@velar/types';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';
import type { ZodTypeAny } from 'zod';

export interface ContractRequestParts {
  body: unknown;
  params: unknown;
  query: unknown;
}

function parsePart(schema: ZodTypeAny, value: unknown, locale: Locale) {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw new BadRequestException(
    createApiError(ErrorCode.VALIDATION_ERROR, locale, {
      fields: zodIssuesToFieldErrors(result.error.issues, locale),
      details: result.error.issues.map((issue) => ({ code: issue.code, path: issue.path })),
    }),
  );
}

export function validateContractRequest(
  contract: EndpointContract,
  request: ContractRequestParts,
  locale: Locale = 'es',
): ContractRequestParts {
  return {
    body: parsePart(contract.body, request.body, locale),
    params: parsePart(contract.params, request.params, locale),
    query: parsePart(contract.query, request.query, locale),
  };
}

export function validateContractResponse(
  contract: EndpointContract,
  value: unknown,
  locale: Locale = 'es',
): unknown {
  const result = contract.response.safeParse(value);
  if (result.success) return result.data;
  throw new InternalServerErrorException(
    createApiError(ErrorCode.RESPONSE_VALIDATION_ERROR, locale, {
      fields: zodIssuesToFieldErrors(result.error.issues, locale),
      details: result.error.issues.map((issue) => ({ code: issue.code, path: issue.path })),
    }),
  );
}

export function responseValidationEnabled(): boolean {
  return process.env.CONTRACT_VALIDATE_RESPONSES === 'true' || process.env.NODE_ENV !== 'production';
}

@Injectable()
export class ContractValidationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const match = findContract(request.method, request.originalUrl ?? request.url);
    if (!match) return next.handle();

    const locale = normalizeLocale(request.headers['accept-language']);
    const parsed = validateContractRequest(
      match.contract,
      {
        body: request.body,
        params: { ...match.params, ...(request.params ?? {}) },
        query: request.query ?? {},
      },
      locale,
    );
    request.body = parsed.body;

    return next.handle().pipe(
      map((value) => responseValidationEnabled()
        ? validateContractResponse(match.contract, value, locale)
        : value),
    );
  }
}
