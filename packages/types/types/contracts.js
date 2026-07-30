"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiContracts = void 0;
exports.findContract = findContract;
exports.buildContractPath = buildContractPath;
const zod_1 = require("zod");
const auth_1 = require("./schemas/auth");
const bonds_1 = require("./schemas/bonds");
const common_1 = require("./schemas/common");
const notifications_1 = require("./schemas/notifications");
const reports_1 = require("./schemas/reports");
const transfers_1 = require("./schemas/transfers");
const users_1 = require("./schemas/users");
const contracts_1 = require("./schemas/contracts");
function endpoint(definition) {
    return definition;
}
const noBody = zod_1.z.undefined();
const noParams = common_1.emptyObjectSchema;
const noQuery = common_1.emptyObjectSchema;
const transferMutationResponseSchema = zod_1.z.union([transfers_1.transferRowSchema, transfers_1.transactionResponseSchema]);
/**
 * Versioned single source of truth for the public JSON surface covered by issue #43.
 * Binary downloads are intentionally excluded; multipart upload validates its response only.
 */
exports.apiContracts = {
    'auth.register': endpoint({ method: 'POST', path: '/auth/register', module: 'auth', auth: false, body: auth_1.registerRequestSchema, params: noParams, query: noQuery, response: auth_1.registerResponseSchema }),
    'auth.login': endpoint({ method: 'POST', path: '/auth/login', module: 'auth', auth: false, body: auth_1.loginRequestSchema, params: noParams, query: noQuery, response: auth_1.loginResponseSchema }),
    'bonds.list': endpoint({ method: 'GET', path: '/bonds', module: 'bonds', auth: true, body: noBody, params: noParams, query: bonds_1.bondsQuerySchema, response: (0, common_1.paginatedSchema)(bonds_1.bondRowSchema) }),
    'bonds.requests.list': endpoint({ method: 'GET', path: '/bonds/requests', module: 'bonds', auth: true, body: noBody, params: noParams, query: noQuery, response: zod_1.z.array(bonds_1.bondRequestRowSchema) }),
    'bonds.requests.create': endpoint({ method: 'POST', path: '/bonds/requests', module: 'bonds', auth: true, body: bonds_1.createBondRequestRequestSchema, params: noParams, query: noQuery, response: bonds_1.bondRequestRowSchema }),
    'bonds.requests.approve': endpoint({ method: 'PATCH', path: '/bonds/requests/:id/approve', module: 'bonds', auth: true, body: noBody, params: common_1.paramsIdSchema, query: noQuery, response: bonds_1.bondRowSchema }),
    'bonds.requests.reject': endpoint({ method: 'PATCH', path: '/bonds/requests/:id/reject', module: 'bonds', auth: true, body: bonds_1.rejectBondRequestSchema, params: common_1.paramsIdSchema, query: noQuery, response: common_1.okSchema }),
    'bonds.available': endpoint({ method: 'GET', path: '/bonds/available', module: 'bonds', auth: true, body: noBody, params: noParams, query: bonds_1.availableBondsQuerySchema, response: zod_1.z.array(bonds_1.bondRowSchema) }),
    'bonds.create': endpoint({ method: 'POST', path: '/bonds', module: 'bonds', auth: true, body: bonds_1.createBondRequestSchema, params: noParams, query: noQuery, response: bonds_1.bondRowSchema }),
    'bonds.get': endpoint({ method: 'GET', path: '/bonds/:tokenId', module: 'bonds', auth: true, body: noBody, params: common_1.paramsTokenIdSchema, query: noQuery, response: bonds_1.bondRowSchema }),
    'bonds.onchain': endpoint({ method: 'GET', path: '/bonds/:tokenId/onchain', module: 'bonds', auth: true, body: noBody, params: common_1.paramsTokenIdSchema, query: noQuery, response: bonds_1.onchainBondResponseSchema }),
    'bonds.issueOnchain': endpoint({ method: 'PATCH', path: '/bonds/:tokenId/issue-onchain', module: 'bonds', auth: true, body: noBody, params: common_1.paramsTokenIdSchema, query: noQuery, response: bonds_1.issueOnchainResponseSchema }),
    'bonds.publish': endpoint({ method: 'PATCH', path: '/bonds/:tokenId/publish', module: 'bonds', auth: true, body: bonds_1.publishBondRequestSchema, params: common_1.paramsTokenIdSchema, query: noQuery, response: bonds_1.bondRowSchema }),
    'bonds.sorobanDetails': endpoint({ method: 'GET', path: '/bonds/:tokenId/soroban-details', module: 'bonds', auth: true, body: noBody, params: common_1.paramsTokenIdSchema, query: noQuery, response: bonds_1.sorobanBondResponseSchema }),
    'bonds.freeze': endpoint({ method: 'PATCH', path: '/bonds/:tokenId/freeze', module: 'bonds', auth: true, body: noBody, params: common_1.paramsTokenIdSchema, query: noQuery, response: bonds_1.bondRowSchema }),
    'bonds.unfreeze': endpoint({ method: 'PATCH', path: '/bonds/:tokenId/unfreeze', module: 'bonds', auth: true, body: noBody, params: common_1.paramsTokenIdSchema, query: noQuery, response: bonds_1.bondRowSchema }),
    'bonds.uploadDocument': endpoint({ method: 'POST', path: '/bonds/:tokenId/document', module: 'bonds', auth: true, body: zod_1.z.unknown(), params: common_1.paramsTokenIdSchema, query: noQuery, response: bonds_1.documentUploadResponseSchema }),
    'bonds.hash': endpoint({ method: 'POST', path: '/bonds/hash', module: 'bonds', auth: true, body: bonds_1.hashDocumentRequestSchema, params: noParams, query: noQuery, response: bonds_1.documentHashResponseSchema }),
    'bonds.summary': endpoint({ method: 'GET', path: '/bonds/:tokenId/summary', module: 'bonds', auth: true, body: noBody, params: common_1.paramsTokenIdSchema, query: noQuery, response: contracts_1.contractSummaryResponseSchema }),
    'transfers.list': endpoint({ method: 'GET', path: '/transfers', module: 'transfers', auth: true, body: noBody, params: noParams, query: common_1.paginationQuerySchema, response: (0, common_1.paginatedSchema)(transfers_1.transferRowSchema) }),
    'transfers.create': endpoint({ method: 'POST', path: '/transfers', module: 'transfers', auth: true, body: transfers_1.createTransferRequestSchema, params: noParams, query: noQuery, response: transfers_1.transferRowSchema }),
    'transfers.get': endpoint({ method: 'GET', path: '/transfers/:id', module: 'transfers', auth: true, body: noBody, params: common_1.paramsIdSchema, query: noQuery, response: transfers_1.transferRowSchema.nullable() }),
    'transfers.accept': endpoint({ method: 'PATCH', path: '/transfers/:id/accept', module: 'escrow', auth: true, body: noBody, params: common_1.paramsIdSchema, query: noQuery, response: transferMutationResponseSchema }),
    'transfers.reject': endpoint({ method: 'PATCH', path: '/transfers/:id/reject', module: 'transfers', auth: true, body: noBody, params: common_1.paramsIdSchema, query: noQuery, response: common_1.successSchema }),
    'transfers.counter': endpoint({ method: 'PATCH', path: '/transfers/:id/counter', module: 'transfers', auth: true, body: transfers_1.counterOfferRequestSchema, params: common_1.paramsIdSchema, query: noQuery, response: transfers_1.transferRowSchema }),
    'transfers.acceptCounter': endpoint({ method: 'PATCH', path: '/transfers/:id/accept-counter', module: 'escrow', auth: true, body: noBody, params: common_1.paramsIdSchema, query: noQuery, response: transferMutationResponseSchema }),
    'transfers.payment': endpoint({ method: 'PATCH', path: '/transfers/:id/payment', module: 'escrow', auth: true, body: transfers_1.registerPaymentRequestSchema, params: common_1.paramsIdSchema, query: noQuery, response: transfers_1.transferRowSchema }),
    'transfers.validate': endpoint({ method: 'PATCH', path: '/transfers/:id/validate', module: 'escrow', auth: true, body: noBody, params: common_1.paramsIdSchema, query: noQuery, response: transfers_1.transferRowSchema }),
    'transfers.release': endpoint({ method: 'PATCH', path: '/transfers/:id/release', module: 'escrow', auth: true, body: noBody, params: common_1.paramsIdSchema, query: noQuery, response: transfers_1.releaseResponseSchema }),
    'transfers.cancel': endpoint({ method: 'PATCH', path: '/transfers/:id/cancel', module: 'transfers', auth: true, body: noBody, params: common_1.paramsIdSchema, query: noQuery, response: common_1.successSchema }),
    'transfers.buildXdr': endpoint({ method: 'POST', path: '/transfers/:id/build-xdr', module: 'escrow', auth: true, body: noBody, params: common_1.paramsIdSchema, query: noQuery, response: transfers_1.xdrResponseSchema }),
    'transfers.submitXdr': endpoint({ method: 'POST', path: '/transfers/:id/submit-xdr', module: 'escrow', auth: true, body: transfers_1.submitXdrRequestSchema, params: common_1.paramsIdSchema, query: noQuery, response: transfers_1.transactionResponseSchema }),
    'transfers.instantBuy.buildXdr': endpoint({ method: 'POST', path: '/transfers/instant-buy/:bondTokenId/build-xdr', module: 'escrow', auth: true, body: noBody, params: common_1.paramsBondTokenIdSchema, query: noQuery, response: transfers_1.xdrResponseSchema }),
    'transfers.instantBuy.submitXdr': endpoint({ method: 'POST', path: '/transfers/instant-buy/:bondTokenId/submit-xdr', module: 'escrow', auth: true, body: transfers_1.submitXdrRequestSchema, params: common_1.paramsBondTokenIdSchema, query: noQuery, response: transfers_1.transactionResponseSchema }),
    'transfers.walletPayment.buildXdr': endpoint({ method: 'POST', path: '/transfers/:id/build-wallet-payment-xdr', module: 'escrow', auth: true, body: noBody, params: common_1.paramsIdSchema, query: noQuery, response: transfers_1.xdrResponseSchema }),
    'transfers.walletPayment.submitXdr': endpoint({ method: 'POST', path: '/transfers/:id/submit-wallet-payment-xdr', module: 'escrow', auth: true, body: transfers_1.submitXdrRequestSchema, params: common_1.paramsIdSchema, query: noQuery, response: transfers_1.transactionResponseSchema }),
    'transfers.requestReturn': endpoint({ method: 'PATCH', path: '/transfers/:id/request-return', module: 'escrow', auth: true, body: transfers_1.requestReturnRequestSchema, params: common_1.paramsIdSchema, query: noQuery, response: transfers_1.transferRowSchema }),
    'transfers.approveReturn': endpoint({ method: 'PATCH', path: '/transfers/:id/approve-return', module: 'escrow', auth: true, body: transfers_1.returnDecisionRequestSchema, params: common_1.paramsIdSchema, query: noQuery, response: transfers_1.transactionResponseSchema }),
    'transfers.rejectReturn': endpoint({ method: 'PATCH', path: '/transfers/:id/reject-return', module: 'escrow', auth: true, body: transfers_1.returnDecisionRequestSchema, params: common_1.paramsIdSchema, query: noQuery, response: transfers_1.transferRowSchema }),
    'reports.list': endpoint({ method: 'GET', path: '/reports', module: 'reports', auth: true, body: noBody, params: noParams, query: noQuery, response: zod_1.z.array(reports_1.reportRowSchema) }),
    'reports.create': endpoint({ method: 'POST', path: '/reports', module: 'reports', auth: true, body: reports_1.createReportRequestSchema, params: noParams, query: noQuery, response: reports_1.reportRowSchema }),
    'reports.get': endpoint({ method: 'GET', path: '/reports/:id', module: 'reports', auth: true, body: noBody, params: common_1.paramsIdSchema, query: noQuery, response: reports_1.reportRowSchema }),
    'reports.review': endpoint({ method: 'PATCH', path: '/reports/:id/review', module: 'reports', auth: true, body: reports_1.reviewReportRequestSchema, params: common_1.paramsIdSchema, query: noQuery, response: reports_1.reportRowSchema }),
    'reports.assign': endpoint({ method: 'PATCH', path: '/reports/:id/assign', module: 'reports', auth: true, body: zod_1.z.object({ reviewerId: common_1.idSchema }).strict(), params: common_1.paramsIdSchema, query: noQuery, response: reports_1.reportRowSchema }),
    'contracts.templates.list': endpoint({ method: 'GET', path: '/contracts/templates', module: 'contracts', auth: true, body: noBody, params: noParams, query: contracts_1.contractTemplatesQuerySchema, response: zod_1.z.array(contracts_1.contractTemplateSchema) }),
    'contracts.templates.create': endpoint({ method: 'POST', path: '/contracts/templates', module: 'contracts', auth: true, body: contracts_1.createContractTemplateRequestSchema, params: noParams, query: noQuery, response: contracts_1.contractTemplateSchema }),
    'contracts.templates.versions.list': endpoint({ method: 'GET', path: '/contracts/templates/:id/versions', module: 'contracts', auth: true, body: noBody, params: contracts_1.paramsTemplateIdSchema, query: noQuery, response: zod_1.z.array(contracts_1.contractVersionSummarySchema) }),
    'contracts.templates.versions.create': endpoint({ method: 'POST', path: '/contracts/templates/:id/versions', module: 'contracts', auth: true, body: contracts_1.createContractVersionRequestSchema, params: contracts_1.paramsTemplateIdSchema, query: noQuery, response: contracts_1.contractVersionSummarySchema }),
    'contracts.versions.diff': endpoint({ method: 'GET', path: '/contracts/versions/diff', module: 'contracts', auth: true, body: noBody, params: noParams, query: contracts_1.contractVersionDiffQuerySchema, response: contracts_1.contractVersionDiffResponseSchema }),
    'contracts.versions.get': endpoint({ method: 'GET', path: '/contracts/versions/:versionId', module: 'contracts', auth: true, body: noBody, params: contracts_1.paramsVersionIdSchema, query: noQuery, response: contracts_1.contractVersionDetailSchema }),
    'contracts.versions.publish': endpoint({ method: 'PATCH', path: '/contracts/versions/:versionId/publish', module: 'contracts', auth: true, body: noBody, params: contracts_1.paramsVersionIdSchema, query: noQuery, response: contracts_1.contractVersionSummarySchema }),
    'contracts.clauses.list': endpoint({ method: 'GET', path: '/contracts/clauses', module: 'contracts', auth: true, body: noBody, params: noParams, query: contracts_1.contractClausesQuerySchema, response: zod_1.z.array(contracts_1.contractClauseLibraryEntrySchema) }),
    'contracts.clauses.create': endpoint({ method: 'POST', path: '/contracts/clauses', module: 'contracts', auth: true, body: contracts_1.upsertContractClauseRequestSchema, params: noParams, query: noQuery, response: contracts_1.contractClauseLibraryEntrySchema }),
    'contracts.document.get': endpoint({ method: 'GET', path: '/contracts/:bondId/document', module: 'contracts', auth: true, body: noBody, params: contracts_1.paramsBondIdSchema, query: contracts_1.contractDocumentQuerySchema, response: contracts_1.assembledContractDocumentResponseSchema }),
    'notifications.list': endpoint({ method: 'GET', path: '/notifications', module: 'notifications', auth: true, body: noBody, params: noParams, query: noQuery, response: notifications_1.notificationsResponseSchema }),
    'notifications.readAll': endpoint({ method: 'PATCH', path: '/notifications/read-all', module: 'notifications', auth: true, body: noBody, params: noParams, query: noQuery, response: common_1.okSchema }),
    'notifications.read': endpoint({ method: 'PATCH', path: '/notifications/:id/read', module: 'notifications', auth: true, body: noBody, params: common_1.paramsIdSchema, query: noQuery, response: common_1.okSchema }),
    'users.me': endpoint({ method: 'GET', path: '/users/me', module: 'users', auth: true, body: noBody, params: noParams, query: noQuery, response: users_1.profileRowSchema }),
    'users.updateMe': endpoint({ method: 'PATCH', path: '/users/me', module: 'users', auth: true, body: users_1.updateProfileRequestSchema, params: noParams, query: noQuery, response: users_1.profileRowSchema }),
    'users.updateWallet': endpoint({ method: 'PATCH', path: '/users/me/wallet', module: 'users', auth: true, body: users_1.updateWalletRequestSchema, params: noParams, query: noQuery, response: users_1.walletResponseSchema }),
    'users.list': endpoint({ method: 'GET', path: '/users', module: 'users', auth: true, body: noBody, params: noParams, query: noQuery, response: zod_1.z.array(users_1.profileRowSchema) }),
    'users.recipients': endpoint({ method: 'GET', path: '/users/recompradores', module: 'users', auth: true, body: noBody, params: noParams, query: noQuery, response: zod_1.z.array(users_1.recipientRowSchema) }),
    'users.setRole': endpoint({ method: 'PATCH', path: '/users/:id/role', module: 'users', auth: true, body: users_1.setRoleRequestSchema, params: common_1.paramsIdSchema, query: noQuery, response: users_1.profileRowSchema }),
};
function normalizedPath(value) {
    const path = value.split('?')[0].replace(/^https?:\/\/[^/]+/i, '').replace(/^\/api(?=\/|$)/, '');
    return path.startsWith('/') ? path : `/${path}`;
}
function matchPath(template, actual) {
    const templateParts = normalizedPath(template).split('/').filter(Boolean);
    const actualParts = normalizedPath(actual).split('/').filter(Boolean);
    if (templateParts.length !== actualParts.length)
        return null;
    const params = {};
    for (let index = 0; index < templateParts.length; index += 1) {
        const expected = templateParts[index];
        const received = actualParts[index];
        if (expected.startsWith(':'))
            params[expected.slice(1)] = decodeURIComponent(received);
        else if (expected !== received)
            return null;
    }
    return params;
}
function findContract(method, path) {
    const upperMethod = method.toUpperCase();
    for (const [name, contract] of Object.entries(exports.apiContracts)) {
        if (contract.method !== upperMethod)
            continue;
        const params = matchPath(contract.path, path);
        if (params)
            return { name, contract, params };
    }
    return null;
}
function buildContractPath(name, params = {}) {
    return exports.apiContracts[name].path.replace(/:([A-Za-z0-9_]+)/g, (_match, key) => {
        const value = params[key];
        if (!value)
            throw new Error(`Missing path parameter: ${key}`);
        return encodeURIComponent(value);
    });
}
