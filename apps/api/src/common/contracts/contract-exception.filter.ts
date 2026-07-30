import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from '@nestjs/common';
import {
  apiErrorResponseSchema,
  createApiError,
  ErrorCode,
  normalizeLocale,
  type ErrorCode as ErrorCodeType,
} from '@velar/types';
import type { Request, Response } from 'express';

function codeForStatus(status: number): ErrorCodeType {
  if (status === HttpStatus.UNAUTHORIZED) return ErrorCode.UNAUTHORIZED;
  if (status === HttpStatus.FORBIDDEN) return ErrorCode.FORBIDDEN;
  if (status === HttpStatus.NOT_FOUND) return ErrorCode.NOT_FOUND;
  if (status === HttpStatus.CONFLICT) return ErrorCode.CONFLICT;
  if (status === HttpStatus.TOO_MANY_REQUESTS) return ErrorCode.RATE_LIMITED;
  if (status >= 500) return ErrorCode.INTERNAL_ERROR;
  return ErrorCode.BUSINESS_RULE_VIOLATION;
}

function exceptionMessage(payload: unknown): string | undefined {
  if (typeof payload === 'string') return payload;
  const message = (payload as { message?: unknown })?.message;
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message)) return message.filter((item): item is string => typeof item === 'string').join(', ');
  return undefined;
}

@Catch()
export class ContractExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    if (response.headersSent) return;

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : undefined;
    const structured = apiErrorResponseSchema.safeParse(payload);
    const locale = normalizeLocale(request.headers['accept-language']);

    response.status(status).json(
      structured.success
        ? structured.data
        : createApiError(codeForStatus(status), locale, {
            ...(exceptionMessage(payload) ? { message: exceptionMessage(payload) } : {}),
          }),
    );
  }
}
