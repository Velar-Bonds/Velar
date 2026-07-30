import {
  apiContracts,
  apiErrorResponseSchema,
  buildContractPath,
  createApiError,
  ErrorCode,
  errorMessage,
  findContract,
  normalizeLocale,
  zodIssuesToFieldErrors,
  type ContractError,
  type ContractInput,
  type ContractResponse,
  type EndpointName,
  type Locale,
} from '@velar/types';

export class ContractApiError extends Error implements ContractError {
  readonly code: ContractError['code'];
  readonly fields?: ContractError['fields'];
  readonly details?: unknown;
  readonly requestId?: string;
  readonly status?: number;

  constructor(error: ContractError, status?: number) {
    super(error.message);
    this.name = 'ContractApiError';
    this.code = error.code;
    this.fields = error.fields;
    this.details = error.details;
    this.requestId = error.requestId;
    this.status = status;
  }
}

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface ContractClientOptions {
  baseUrl: string;
  fetch?: FetchLike;
  locale?: Locale;
  getToken?: () => string | undefined | Promise<string | undefined>;
  getRetries?: number;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function queryObject(path: string): Record<string, string> {
  const query = path.split('?')[1];
  if (!query) return {};
  return Object.fromEntries(new URLSearchParams(query).entries());
}

function appendQuery(path: string, query?: Record<string, unknown>): string {
  if (!query) return path;
  const values = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') values.set(key, String(value));
  }
  const suffix = values.toString();
  return suffix ? `${path}?${suffix}` : path;
}

/**
 * Normaliza issues de zod v4 (cuyo `path` puede incluir `symbol`) a la forma
 * ValidationIssue esperada por @velar/types. Espejo del helper del backend.
 */
function toValidationIssues(
  issues: ReadonlyArray<{ code: unknown; message: string; path: ReadonlyArray<PropertyKey> }>,
): Parameters<typeof zodIssuesToFieldErrors>[0] {
  return issues.map((issue) => ({
    code: String(issue.code),
    message: issue.message,
    path: issue.path.filter(
      (segment): segment is string | number =>
        typeof segment === 'string' || typeof segment === 'number',
    ),
  }));
}

function validationError(
  issues: ReadonlyArray<{ code: unknown; message: string; path: ReadonlyArray<PropertyKey> }>,
  locale: Locale,
): ContractApiError {
  return new ContractApiError(createApiError(ErrorCode.VALIDATION_ERROR, locale, {
    fields: zodIssuesToFieldErrors(toValidationIssues(issues), locale),
  }).error);
}

function statusCodeToError(status: number): ContractError['code'] {
  if (status === 401) return ErrorCode.UNAUTHORIZED;
  if (status === 403) return ErrorCode.FORBIDDEN;
  if (status === 404) return ErrorCode.NOT_FOUND;
  if (status === 409) return ErrorCode.CONFLICT;
  if (status === 429) return ErrorCode.RATE_LIMITED;
  if (status >= 500) return ErrorCode.INTERNAL_ERROR;
  return ErrorCode.BUSINESS_RULE_VIOLATION;
}

export async function requestContractPath(
  options: ContractClientOptions,
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<unknown> {
  const locale = options.locale ?? normalizeLocale(typeof navigator === 'undefined' ? 'es' : navigator.language);
  const match = findContract(method, path);
  let parsedBody = body;
  if (match) {
    const bodyResult = match.contract.body.safeParse(body);
    if (!bodyResult.success) throw validationError(bodyResult.error.issues, locale);
    const paramsResult = match.contract.params.safeParse(match.params);
    if (!paramsResult.success) throw validationError(paramsResult.error.issues, locale);
    const queryResult = match.contract.query.safeParse(queryObject(path));
    if (!queryResult.success) throw validationError(queryResult.error.issues, locale);
    parsedBody = bodyResult.data;
  }

  const fetcher = options.fetch ?? fetch;
  const url = joinUrl(options.baseUrl, path);
  const resolvedToken = token ?? await options.getToken?.();
  const maxAttempts = method.toUpperCase() === 'GET' ? (options.getRetries ?? 1) : 1;
  let response: Response | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      response = await fetcher(url, {
        method,
        headers: {
          ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
          'Accept-Language': locale,
          'Content-Type': 'application/json',
        },
        body: parsedBody === undefined ? undefined : JSON.stringify(parsedBody),
      });
      break;
    } catch (cause) {
      if (attempt === maxAttempts) {
        throw new ContractApiError(createApiError(ErrorCode.NETWORK_ERROR, locale, { details: cause }).error);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const json = await response!.json().catch(() => ({}));
  if (!response!.ok) {
    const structured = apiErrorResponseSchema.safeParse(json);
    if (structured.success) throw new ContractApiError(structured.data.error, response!.status);
    const code = statusCodeToError(response!.status);
    const legacyMessage = typeof (json as { message?: unknown })?.message === 'string'
      ? (json as { message: string }).message
      : errorMessage(code, locale);
    throw new ContractApiError({ code, message: legacyMessage }, response!.status);
  }

  if (!match) return json;
  const output = match.contract.response.safeParse(json);
  if (!output.success) {
    throw new ContractApiError(createApiError(ErrorCode.RESPONSE_VALIDATION_ERROR, locale, {
      fields: zodIssuesToFieldErrors(toValidationIssues(output.error.issues), locale),
      details: output.error.issues.map((issue) => ({ code: issue.code, path: issue.path })),
    }).error);
  }
  return output.data;
}

export class TypedApiClient {
  constructor(private readonly options: ContractClientOptions) {}

  async call<K extends EndpointName>(
    name: K,
    input: ContractInput<K> = {},
    token?: string,
  ): Promise<ContractResponse<K>> {
    const contract = apiContracts[name];
    const path = appendQuery(
      buildContractPath(name, (input.params ?? {}) as Record<string, string>),
      input.query as Record<string, unknown> | undefined,
    );
    return requestContractPath(this.options, contract.method, path, input.body, token) as Promise<ContractResponse<K>>;
  }
}

export function createTypedApiClient(options: ContractClientOptions): TypedApiClient {
  return new TypedApiClient(options);
}
