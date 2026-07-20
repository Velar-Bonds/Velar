import { z, type ZodTypeAny } from 'zod';
import { loginRequestSchema, loginResponseSchema, registerRequestSchema, registerResponseSchema } from './schemas/auth';
import {
  availableBondsQuerySchema,
  bondRequestRowSchema,
  bondRowSchema,
  bondsQuerySchema,
  createBondRequestRequestSchema,
  createBondRequestSchema,
  documentHashResponseSchema,
  documentUploadResponseSchema,
  hashDocumentRequestSchema,
  issueOnchainResponseSchema,
  onchainBondResponseSchema,
  publishBondRequestSchema,
  rejectBondRequestSchema,
  sorobanBondResponseSchema,
} from './schemas/bonds';
import {
  emptyObjectSchema,
  okSchema,
  paginatedSchema,
  paginationQuerySchema,
  paramsBondTokenIdSchema,
  paramsIdSchema,
  paramsTokenIdSchema,
  successSchema,
} from './schemas/common';
import { notificationsResponseSchema } from './schemas/notifications';
import { createReportRequestSchema, reportRowSchema, reviewReportRequestSchema } from './schemas/reports';
import {
  counterOfferRequestSchema,
  createTransferRequestSchema,
  registerPaymentRequestSchema,
  releaseResponseSchema,
  requestReturnRequestSchema,
  returnDecisionRequestSchema,
  submitXdrRequestSchema,
  transactionResponseSchema,
  transferRowSchema,
  xdrResponseSchema,
} from './schemas/transfers';
import {
  profileRowSchema,
  recipientRowSchema,
  setRoleRequestSchema,
  updateProfileRequestSchema,
  updateWalletRequestSchema,
  walletResponseSchema,
} from './schemas/users';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

function endpoint<
  TBody extends ZodTypeAny,
  TParams extends ZodTypeAny,
  TQuery extends ZodTypeAny,
  TResponse extends ZodTypeAny,
>(definition: {
  method: HttpMethod;
  path: string;
  module: 'auth' | 'bonds' | 'transfers' | 'reports' | 'escrow' | 'notifications' | 'users';
  auth: boolean;
  body: TBody;
  params: TParams;
  query: TQuery;
  response: TResponse;
}) {
  return definition;
}

const noBody = z.undefined();
const noParams = emptyObjectSchema;
const noQuery = emptyObjectSchema;
const transferMutationResponseSchema = z.union([transferRowSchema, transactionResponseSchema]);

/**
 * Versioned single source of truth for the public JSON surface covered by issue #43.
 * Binary downloads are intentionally excluded; multipart upload validates its response only.
 */
export const apiContracts = {
  'auth.register': endpoint({ method: 'POST', path: '/auth/register', module: 'auth', auth: false, body: registerRequestSchema, params: noParams, query: noQuery, response: registerResponseSchema }),
  'auth.login': endpoint({ method: 'POST', path: '/auth/login', module: 'auth', auth: false, body: loginRequestSchema, params: noParams, query: noQuery, response: loginResponseSchema }),

  'bonds.list': endpoint({ method: 'GET', path: '/bonds', module: 'bonds', auth: true, body: noBody, params: noParams, query: bondsQuerySchema, response: paginatedSchema(bondRowSchema) }),
  'bonds.requests.list': endpoint({ method: 'GET', path: '/bonds/requests', module: 'bonds', auth: true, body: noBody, params: noParams, query: noQuery, response: z.array(bondRequestRowSchema) }),
  'bonds.requests.create': endpoint({ method: 'POST', path: '/bonds/requests', module: 'bonds', auth: true, body: createBondRequestRequestSchema, params: noParams, query: noQuery, response: bondRequestRowSchema }),
  'bonds.requests.approve': endpoint({ method: 'PATCH', path: '/bonds/requests/:id/approve', module: 'bonds', auth: true, body: noBody, params: paramsIdSchema, query: noQuery, response: bondRowSchema }),
  'bonds.requests.reject': endpoint({ method: 'PATCH', path: '/bonds/requests/:id/reject', module: 'bonds', auth: true, body: rejectBondRequestSchema, params: paramsIdSchema, query: noQuery, response: okSchema }),
  'bonds.available': endpoint({ method: 'GET', path: '/bonds/available', module: 'bonds', auth: true, body: noBody, params: noParams, query: availableBondsQuerySchema, response: z.array(bondRowSchema) }),
  'bonds.create': endpoint({ method: 'POST', path: '/bonds', module: 'bonds', auth: true, body: createBondRequestSchema, params: noParams, query: noQuery, response: bondRowSchema }),
  'bonds.get': endpoint({ method: 'GET', path: '/bonds/:tokenId', module: 'bonds', auth: true, body: noBody, params: paramsTokenIdSchema, query: noQuery, response: bondRowSchema }),
  'bonds.onchain': endpoint({ method: 'GET', path: '/bonds/:tokenId/onchain', module: 'bonds', auth: true, body: noBody, params: paramsTokenIdSchema, query: noQuery, response: onchainBondResponseSchema }),
  'bonds.issueOnchain': endpoint({ method: 'PATCH', path: '/bonds/:tokenId/issue-onchain', module: 'bonds', auth: true, body: noBody, params: paramsTokenIdSchema, query: noQuery, response: issueOnchainResponseSchema }),
  'bonds.publish': endpoint({ method: 'PATCH', path: '/bonds/:tokenId/publish', module: 'bonds', auth: true, body: publishBondRequestSchema, params: paramsTokenIdSchema, query: noQuery, response: bondRowSchema }),
  'bonds.sorobanDetails': endpoint({ method: 'GET', path: '/bonds/:tokenId/soroban-details', module: 'bonds', auth: true, body: noBody, params: paramsTokenIdSchema, query: noQuery, response: sorobanBondResponseSchema }),
  'bonds.freeze': endpoint({ method: 'PATCH', path: '/bonds/:tokenId/freeze', module: 'bonds', auth: true, body: noBody, params: paramsTokenIdSchema, query: noQuery, response: bondRowSchema }),
  'bonds.unfreeze': endpoint({ method: 'PATCH', path: '/bonds/:tokenId/unfreeze', module: 'bonds', auth: true, body: noBody, params: paramsTokenIdSchema, query: noQuery, response: bondRowSchema }),
  'bonds.uploadDocument': endpoint({ method: 'POST', path: '/bonds/:tokenId/document', module: 'bonds', auth: true, body: z.unknown(), params: paramsTokenIdSchema, query: noQuery, response: documentUploadResponseSchema }),
  'bonds.hash': endpoint({ method: 'POST', path: '/bonds/hash', module: 'bonds', auth: true, body: hashDocumentRequestSchema, params: noParams, query: noQuery, response: documentHashResponseSchema }),

  'transfers.list': endpoint({ method: 'GET', path: '/transfers', module: 'transfers', auth: true, body: noBody, params: noParams, query: paginationQuerySchema, response: paginatedSchema(transferRowSchema) }),
  'transfers.create': endpoint({ method: 'POST', path: '/transfers', module: 'transfers', auth: true, body: createTransferRequestSchema, params: noParams, query: noQuery, response: transferRowSchema }),
  'transfers.get': endpoint({ method: 'GET', path: '/transfers/:id', module: 'transfers', auth: true, body: noBody, params: paramsIdSchema, query: noQuery, response: transferRowSchema.nullable() }),
  'transfers.accept': endpoint({ method: 'PATCH', path: '/transfers/:id/accept', module: 'escrow', auth: true, body: noBody, params: paramsIdSchema, query: noQuery, response: transferMutationResponseSchema }),
  'transfers.reject': endpoint({ method: 'PATCH', path: '/transfers/:id/reject', module: 'transfers', auth: true, body: noBody, params: paramsIdSchema, query: noQuery, response: successSchema }),
  'transfers.counter': endpoint({ method: 'PATCH', path: '/transfers/:id/counter', module: 'transfers', auth: true, body: counterOfferRequestSchema, params: paramsIdSchema, query: noQuery, response: transferRowSchema }),
  'transfers.acceptCounter': endpoint({ method: 'PATCH', path: '/transfers/:id/accept-counter', module: 'escrow', auth: true, body: noBody, params: paramsIdSchema, query: noQuery, response: transferMutationResponseSchema }),
  'transfers.payment': endpoint({ method: 'PATCH', path: '/transfers/:id/payment', module: 'escrow', auth: true, body: registerPaymentRequestSchema, params: paramsIdSchema, query: noQuery, response: transferRowSchema }),
  'transfers.validate': endpoint({ method: 'PATCH', path: '/transfers/:id/validate', module: 'escrow', auth: true, body: noBody, params: paramsIdSchema, query: noQuery, response: transferRowSchema }),
  'transfers.release': endpoint({ method: 'PATCH', path: '/transfers/:id/release', module: 'escrow', auth: true, body: noBody, params: paramsIdSchema, query: noQuery, response: releaseResponseSchema }),
  'transfers.cancel': endpoint({ method: 'PATCH', path: '/transfers/:id/cancel', module: 'transfers', auth: true, body: noBody, params: paramsIdSchema, query: noQuery, response: successSchema }),
  'transfers.buildXdr': endpoint({ method: 'POST', path: '/transfers/:id/build-xdr', module: 'escrow', auth: true, body: noBody, params: paramsIdSchema, query: noQuery, response: xdrResponseSchema }),
  'transfers.submitXdr': endpoint({ method: 'POST', path: '/transfers/:id/submit-xdr', module: 'escrow', auth: true, body: submitXdrRequestSchema, params: paramsIdSchema, query: noQuery, response: transactionResponseSchema }),
  'transfers.instantBuy.buildXdr': endpoint({ method: 'POST', path: '/transfers/instant-buy/:bondTokenId/build-xdr', module: 'escrow', auth: true, body: noBody, params: paramsBondTokenIdSchema, query: noQuery, response: xdrResponseSchema }),
  'transfers.instantBuy.submitXdr': endpoint({ method: 'POST', path: '/transfers/instant-buy/:bondTokenId/submit-xdr', module: 'escrow', auth: true, body: submitXdrRequestSchema, params: paramsBondTokenIdSchema, query: noQuery, response: transactionResponseSchema }),
  'transfers.walletPayment.buildXdr': endpoint({ method: 'POST', path: '/transfers/:id/build-wallet-payment-xdr', module: 'escrow', auth: true, body: noBody, params: paramsIdSchema, query: noQuery, response: xdrResponseSchema }),
  'transfers.walletPayment.submitXdr': endpoint({ method: 'POST', path: '/transfers/:id/submit-wallet-payment-xdr', module: 'escrow', auth: true, body: submitXdrRequestSchema, params: paramsIdSchema, query: noQuery, response: transactionResponseSchema }),
  'transfers.requestReturn': endpoint({ method: 'PATCH', path: '/transfers/:id/request-return', module: 'escrow', auth: true, body: requestReturnRequestSchema, params: paramsIdSchema, query: noQuery, response: transferRowSchema }),
  'transfers.approveReturn': endpoint({ method: 'PATCH', path: '/transfers/:id/approve-return', module: 'escrow', auth: true, body: returnDecisionRequestSchema, params: paramsIdSchema, query: noQuery, response: transactionResponseSchema }),
  'transfers.rejectReturn': endpoint({ method: 'PATCH', path: '/transfers/:id/reject-return', module: 'escrow', auth: true, body: returnDecisionRequestSchema, params: paramsIdSchema, query: noQuery, response: transferRowSchema }),

  'reports.list': endpoint({ method: 'GET', path: '/reports', module: 'reports', auth: true, body: noBody, params: noParams, query: noQuery, response: z.array(reportRowSchema) }),
  'reports.create': endpoint({ method: 'POST', path: '/reports', module: 'reports', auth: true, body: createReportRequestSchema, params: noParams, query: noQuery, response: reportRowSchema }),
  'reports.get': endpoint({ method: 'GET', path: '/reports/:id', module: 'reports', auth: true, body: noBody, params: paramsIdSchema, query: noQuery, response: reportRowSchema }),
  'reports.review': endpoint({ method: 'PATCH', path: '/reports/:id/review', module: 'reports', auth: true, body: reviewReportRequestSchema, params: paramsIdSchema, query: noQuery, response: reportRowSchema }),

  'notifications.list': endpoint({ method: 'GET', path: '/notifications', module: 'notifications', auth: true, body: noBody, params: noParams, query: noQuery, response: notificationsResponseSchema }),
  'notifications.readAll': endpoint({ method: 'PATCH', path: '/notifications/read-all', module: 'notifications', auth: true, body: noBody, params: noParams, query: noQuery, response: okSchema }),
  'notifications.read': endpoint({ method: 'PATCH', path: '/notifications/:id/read', module: 'notifications', auth: true, body: noBody, params: paramsIdSchema, query: noQuery, response: okSchema }),

  'users.me': endpoint({ method: 'GET', path: '/users/me', module: 'users', auth: true, body: noBody, params: noParams, query: noQuery, response: profileRowSchema }),
  'users.updateMe': endpoint({ method: 'PATCH', path: '/users/me', module: 'users', auth: true, body: updateProfileRequestSchema, params: noParams, query: noQuery, response: profileRowSchema }),
  'users.updateWallet': endpoint({ method: 'PATCH', path: '/users/me/wallet', module: 'users', auth: true, body: updateWalletRequestSchema, params: noParams, query: noQuery, response: walletResponseSchema }),
  'users.list': endpoint({ method: 'GET', path: '/users', module: 'users', auth: true, body: noBody, params: noParams, query: noQuery, response: z.array(profileRowSchema) }),
  'users.recipients': endpoint({ method: 'GET', path: '/users/recompradores', module: 'users', auth: true, body: noBody, params: noParams, query: noQuery, response: z.array(recipientRowSchema) }),
  'users.setRole': endpoint({ method: 'PATCH', path: '/users/:id/role', module: 'users', auth: true, body: setRoleRequestSchema, params: paramsIdSchema, query: noQuery, response: profileRowSchema }),
} as const;

export type EndpointName = keyof typeof apiContracts;
export type EndpointContract = (typeof apiContracts)[EndpointName];
export type ContractInput<K extends EndpointName> = {
  body?: z.input<(typeof apiContracts)[K]['body']>;
  params?: z.input<(typeof apiContracts)[K]['params']>;
  query?: z.input<(typeof apiContracts)[K]['query']>;
};
export type ContractResponse<K extends EndpointName> = z.output<(typeof apiContracts)[K]['response']>;

export interface MatchedContract<K extends EndpointName = EndpointName> {
  name: K;
  contract: (typeof apiContracts)[K];
  params: Record<string, string>;
}

function normalizedPath(value: string): string {
  const path = value.split('?')[0].replace(/^https?:\/\/[^/]+/i, '').replace(/^\/api(?=\/|$)/, '');
  return path.startsWith('/') ? path : `/${path}`;
}

function matchPath(template: string, actual: string): Record<string, string> | null {
  const templateParts = normalizedPath(template).split('/').filter(Boolean);
  const actualParts = normalizedPath(actual).split('/').filter(Boolean);
  if (templateParts.length !== actualParts.length) return null;
  const params: Record<string, string> = {};
  for (let index = 0; index < templateParts.length; index += 1) {
    const expected = templateParts[index];
    const received = actualParts[index];
    if (expected.startsWith(':')) params[expected.slice(1)] = decodeURIComponent(received);
    else if (expected !== received) return null;
  }
  return params;
}

export function findContract(method: string, path: string): MatchedContract | null {
  const upperMethod = method.toUpperCase();
  for (const [name, contract] of Object.entries(apiContracts) as Array<[EndpointName, EndpointContract]>) {
    if (contract.method !== upperMethod) continue;
    const params = matchPath(contract.path, path);
    if (params) return { name, contract, params } as MatchedContract;
  }
  return null;
}

export function buildContractPath<K extends EndpointName>(name: K, params: Record<string, string> = {}): string {
  return apiContracts[name].path.replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = params[key];
    if (!value) throw new Error(`Missing path parameter: ${key}`);
    return encodeURIComponent(value);
  });
}
