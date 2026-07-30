"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transfersFixture = exports.transferFixtureReleased = exports.bondFixture = exports.contractVersionFixtureV2 = exports.contractVersionFixture = exports.contractTemplateFixture = exports.contractClauseLibraryFixture = void 0;
/**
 * Development/testing fixtures for the contract intelligence & document
 * assembly engine (issue #38). Used by the pure-function tests in
 * `apps/api/src/contracts/domain/` and by the frontend management UI so
 * everything is verifiable locally with no VELAR database, secrets, or
 * external APIs. The clause legal text mirrors `contractSummaryFixture`
 * (`./contract-reader.ts`, issue #39) so the reader's existing behavior
 * doesn't change when it starts consuming real derivation.
 */
exports.contractClauseLibraryFixture = [
    {
        id: 'lib-partes',
        clauseKey: 'clause-partes',
        category: 'partes',
        title: 'Cláusula 1 — Partes',
        bodyTemplate: 'Comparecen, por una parte, {{sellerName}} (en adelante, el "Vendedor"), y por otra parte, {{buyerName}} (en adelante, el "Comprador").',
        parameters: ['sellerName', 'buyerName'],
        locale: 'es',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
    },
    {
        id: 'lib-objeto',
        clauseKey: 'clause-objeto',
        category: 'objeto',
        title: 'Cláusula 2 — Objeto',
        bodyTemplate: 'El presente contrato tiene por objeto la transferencia de la titularidad del bono político tokenizado {{bondId}}, representado por el token {{tokenId}} en la red Stellar, del Vendedor al Comprador.',
        parameters: ['bondId', 'tokenId'],
        locale: 'es',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
    },
    {
        id: 'lib-pago',
        clauseKey: 'clause-pago',
        category: 'pago',
        title: 'Cláusula 3 — Precio y forma de pago',
        bodyTemplate: 'El precio de la transferencia será {{amount}} {{currency}}, pagadero por el Comprador mediante {{paymentMethod}}, quedando registrada la evidencia del pago en el sistema.',
        parameters: ['amount', 'currency', 'paymentMethod'],
        locale: 'es',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
    },
    {
        id: 'lib-garantia',
        clauseKey: 'clause-garantia',
        category: 'garantia',
        title: 'Cláusula 4 — Custodia en escrow',
        bodyTemplate: 'El token permanecerá bajo custodia en un escrow on-chain (Trustless Work) desde la aceptación de la oferta y hasta que el Vendedor confirme la recepción del pago, momento en el cual el token será liberado a favor del Comprador.',
        parameters: [],
        locale: 'es',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
    },
    {
        id: 'lib-jurisdiccion',
        clauseKey: 'clause-jurisdiccion',
        category: 'jurisdiccion',
        title: 'Cláusula 5 — Jurisdicción',
        bodyTemplate: 'Este contrato se rige por las leyes de {{jurisdiction}} y por la supervisión de {{authority}} en lo que corresponda.',
        parameters: ['jurisdiction', 'authority'],
        locale: 'es',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
    },
];
exports.contractTemplateFixture = {
    id: 'tpl-cr-bond-transfer',
    key: 'bond-transfer-cr',
    country: 'CR',
    name: 'Contrato de transferencia de bono político — Costa Rica',
    description: 'Plantilla estándar de transferencia de bonos de deuda política costarricenses.',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
};
exports.contractVersionFixture = {
    id: 'ver-cr-bond-transfer-1',
    templateId: 'tpl-cr-bond-transfer',
    versionNumber: 1,
    status: 'published',
    clauseKeys: ['clause-partes', 'clause-objeto', 'clause-pago', 'clause-garantia', 'clause-jurisdiccion'],
    notes: 'Versión inicial.',
    createdBy: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    publishedAt: '2026-07-01T00:00:00.000Z',
    clauses: exports.contractClauseLibraryFixture,
};
/** A second, later version — drops "garantia", tweaks "pago", adds "plazo". Used by diff tests. */
exports.contractVersionFixtureV2 = {
    id: 'ver-cr-bond-transfer-2',
    templateId: 'tpl-cr-bond-transfer',
    versionNumber: 2,
    status: 'draft',
    clauseKeys: ['clause-partes', 'clause-objeto', 'clause-pago', 'clause-plazo'],
    notes: 'Agrega cláusula de plazo; quita la de garantía (se reemplaza por lenguaje en objeto).',
    createdBy: null,
    createdAt: '2026-07-15T00:00:00.000Z',
    publishedAt: null,
    clauses: [
        exports.contractClauseLibraryFixture[0],
        exports.contractClauseLibraryFixture[1],
        Object.assign(Object.assign({}, exports.contractClauseLibraryFixture[2]), { bodyTemplate: 'El precio de la transferencia será {{amount}} {{currency}}, pagadero por el Comprador mediante {{paymentMethod}} dentro de los 5 días hábiles siguientes a la aceptación.' }),
        {
            id: 'lib-plazo',
            clauseKey: 'clause-plazo',
            category: 'plazo',
            title: 'Cláusula — Plazo',
            bodyTemplate: 'La presente transferencia deberá completarse antes de {{maturityDate}}.',
            parameters: ['maturityDate'],
            locale: 'es',
            createdAt: '2026-07-15T00:00:00.000Z',
            updatedAt: '2026-07-15T00:00:00.000Z',
        },
    ],
};
exports.bondFixture = {
    tokenId: 'bond-token-001',
    bondId: 'bond-001',
    issuerPartyId: 'party-aurora',
    country: 'CR',
    currentOwner: 'user-buyer-001',
    status: 'activo',
    documentHash: 'hash-abc123',
    metadataUri: null,
    faceValue: 500000,
    certificateNumber: 'CERT-001',
    currency: 'CRC',
    interestRate: 5,
    series: 'A',
    issueDate: '2026-01-15',
    maturityDate: '2026-12-31',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:00.000Z',
};
exports.transferFixtureReleased = {
    id: 'transfer-001',
    bondTokenId: 'bond-token-001',
    fromOwner: 'party-aurora',
    toOwner: 'user-buyer-001',
    status: 'liberada',
    amount: 520000,
    paymentEvidenceHash: 'evidence-hash-001',
    validatedBy: null,
    createdAt: '2026-07-05T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:00.000Z',
};
exports.transfersFixture = [exports.transferFixtureReleased];
