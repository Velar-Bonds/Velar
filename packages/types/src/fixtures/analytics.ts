import type { AnalyticsInput } from '../analytics';

/**
 * Development/testing fixture for the analytics engine (issue #44).
 *
 * Three parties across two countries, bonds spanning several statuses,
 * transfers covering the full funnel (including a rejection and a
 * cancellation), and reports spanning on-time/late/missing compliance
 * outcomes. NOT production data — exists so the engine, API and UI can be
 * built and tested locally with no VELAR database, secrets or external APIs.
 *
 * Edge cases (empty dataset, single-item dataset, sparse periods) are derived
 * in test files by deep-cloning and mutating this base fixture — same
 * discipline as `fixtures/provenance.ts`.
 */

const PARTY_LIBERTAD = 'party-libertad-fixture';
const PARTY_RENOVACION = 'party-renovacion-fixture';
const PARTY_AVANZA = 'party-avanza-fixture';

const BUYER_1 = 'buyer-juan-fixture';
const BUYER_2 = 'buyer-maria-fixture';
const BUYER_3 = 'buyer-carlos-fixture';

const TSE = 'tse-authority-fixture';

export const analyticsFixture: AnalyticsInput = {
  bonds: [
    {
      tokenId: 'bond-token-a1',
      bondId: 'BOND-2026-A1',
      issuerPartyId: PARTY_LIBERTAD,
      country: 'CR',
      currentOwner: BUYER_1,
      status: 'transferido',
      documentHash: 'sha256-bonddoc-a1',
      faceValue: 1_000_000,
      currency: 'CRC',
      createdAt: '2026-01-10T09:00:00.000Z',
      updatedAt: '2026-02-15T12:00:00.000Z',
    },
    {
      tokenId: 'bond-token-a2',
      bondId: 'BOND-2026-A2',
      issuerPartyId: PARTY_LIBERTAD,
      country: 'CR',
      currentOwner: PARTY_LIBERTAD,
      status: 'activo',
      documentHash: 'sha256-bonddoc-a2',
      faceValue: 500_000,
      currency: 'CRC',
      createdAt: '2026-02-01T09:00:00.000Z',
      updatedAt: '2026-02-01T09:00:00.000Z',
    },
    {
      tokenId: 'bond-token-a3',
      bondId: 'BOND-2026-A3',
      issuerPartyId: PARTY_LIBERTAD,
      country: 'CR',
      currentOwner: PARTY_LIBERTAD,
      status: 'en_escrow',
      documentHash: 'sha256-bonddoc-a3',
      faceValue: 750_000,
      currency: 'CRC',
      createdAt: '2026-03-01T09:00:00.000Z',
      updatedAt: '2026-03-10T09:00:00.000Z',
    },
    {
      tokenId: 'bond-token-b1',
      bondId: 'BOND-2026-B1',
      issuerPartyId: PARTY_RENOVACION,
      country: 'CR',
      currentOwner: BUYER_2,
      status: 'transferido',
      documentHash: 'sha256-bonddoc-b1',
      faceValue: 1_200_000,
      currency: 'CRC',
      createdAt: '2026-01-20T09:00:00.000Z',
      updatedAt: '2026-03-01T12:00:00.000Z',
    },
    {
      tokenId: 'bond-token-b2',
      bondId: 'BOND-2026-B2',
      issuerPartyId: PARTY_RENOVACION,
      country: 'CR',
      currentOwner: PARTY_RENOVACION,
      status: 'cancelado',
      documentHash: 'sha256-bonddoc-b2',
      faceValue: 300_000,
      currency: 'CRC',
      createdAt: '2026-02-10T09:00:00.000Z',
      updatedAt: '2026-02-20T09:00:00.000Z',
    },
    {
      tokenId: 'bond-token-c1',
      bondId: 'BOND-2026-C1',
      issuerPartyId: PARTY_AVANZA,
      country: 'CO',
      currentOwner: PARTY_AVANZA,
      status: 'emitido',
      documentHash: 'sha256-bonddoc-c1',
      faceValue: 8_000_000,
      currency: 'COP',
      createdAt: '2026-04-01T09:00:00.000Z',
      updatedAt: '2026-04-01T09:00:00.000Z',
    },
    {
      tokenId: 'bond-token-c2',
      bondId: 'BOND-2026-C2',
      issuerPartyId: PARTY_AVANZA,
      country: 'CO',
      currentOwner: BUYER_3,
      status: 'transferido',
      documentHash: 'sha256-bonddoc-c2',
      faceValue: 5_000_000,
      currency: 'COP',
      createdAt: '2026-04-05T09:00:00.000Z',
      updatedAt: '2026-05-01T12:00:00.000Z',
    },
  ],

  transfers: [
    {
      id: 'transfer-a1-1',
      bondTokenId: 'bond-token-a1',
      fromOwner: PARTY_LIBERTAD,
      toOwner: BUYER_1,
      status: 'liberada',
      amount: 1_050_000,
      createdAt: '2026-01-15T10:00:00.000Z',
      updatedAt: '2026-02-15T12:00:00.000Z',
    },
    {
      id: 'transfer-b1-1',
      bondTokenId: 'bond-token-b1',
      fromOwner: PARTY_RENOVACION,
      toOwner: BUYER_2,
      status: 'liberada',
      amount: 1_250_000,
      createdAt: '2026-01-25T10:00:00.000Z',
      updatedAt: '2026-03-01T12:00:00.000Z',
    },
    {
      id: 'transfer-c2-1',
      bondTokenId: 'bond-token-c2',
      fromOwner: PARTY_AVANZA,
      toOwner: BUYER_3,
      status: 'liberada',
      amount: 5_200_000,
      createdAt: '2026-04-10T10:00:00.000Z',
      updatedAt: '2026-05-01T12:00:00.000Z',
    },
    {
      id: 'transfer-a3-1',
      bondTokenId: 'bond-token-a3',
      fromOwner: PARTY_LIBERTAD,
      toOwner: BUYER_1,
      status: 'en_escrow',
      amount: 780_000,
      createdAt: '2026-03-05T10:00:00.000Z',
      updatedAt: '2026-03-10T09:00:00.000Z',
    },
    {
      id: 'transfer-a2-1',
      bondTokenId: 'bond-token-a2',
      fromOwner: PARTY_LIBERTAD,
      toOwner: BUYER_2,
      status: 'pago_registrado',
      amount: 520_000,
      createdAt: '2026-03-15T10:00:00.000Z',
      updatedAt: '2026-03-20T10:00:00.000Z',
    },
    {
      id: 'transfer-b2-1',
      bondTokenId: 'bond-token-b2',
      fromOwner: PARTY_RENOVACION,
      toOwner: BUYER_2,
      status: 'cancelada',
      amount: 310_000,
      createdAt: '2026-02-12T10:00:00.000Z',
      updatedAt: '2026-02-18T10:00:00.000Z',
    },
    {
      id: 'transfer-a1-2',
      bondTokenId: 'bond-token-a1',
      fromOwner: BUYER_1,
      toOwner: BUYER_2,
      status: 'rechazada',
      amount: 1_100_000,
      createdAt: '2026-02-20T10:00:00.000Z',
      updatedAt: '2026-02-22T10:00:00.000Z',
    },
    {
      id: 'transfer-c1-1',
      bondTokenId: 'bond-token-c1',
      fromOwner: PARTY_AVANZA,
      toOwner: BUYER_3,
      status: 'solicitada',
      amount: 8_200_000,
      createdAt: '2026-04-15T10:00:00.000Z',
      updatedAt: '2026-04-15T10:00:00.000Z',
    },
    {
      id: 'transfer-a2-2',
      bondTokenId: 'bond-token-a2',
      fromOwner: PARTY_LIBERTAD,
      toOwner: BUYER_3,
      status: 'contraoferta',
      amount: 540_000,
      createdAt: '2026-05-01T10:00:00.000Z',
      updatedAt: '2026-05-03T10:00:00.000Z',
    },
  ],

  reports: [
    {
      id: 'report-libertad-2026-01',
      partyId: PARTY_LIBERTAD,
      periodYear: 2026,
      periodMonth: 1,
      status: 'aprobado',
      currentVersion: 1,
      title: 'Reporte enero 2026',
      submittedBy: 'user-libertad-oficial-fixture',
      submittedAt: '2026-02-10T12:00:00.000Z',
      reviewedBy: TSE,
      reviewedAt: '2026-02-12T09:00:00.000Z',
      tseNotes: null,
      createdAt: '2026-02-01T09:00:00.000Z',
      updatedAt: '2026-02-12T09:00:00.000Z',
    },
    {
      id: 'report-libertad-2026-02',
      partyId: PARTY_LIBERTAD,
      periodYear: 2026,
      periodMonth: 2,
      status: 'aprobado',
      currentVersion: 1,
      title: 'Reporte febrero 2026',
      submittedBy: 'user-libertad-oficial-fixture',
      submittedAt: '2026-03-20T12:00:00.000Z',
      reviewedBy: TSE,
      reviewedAt: '2026-03-22T09:00:00.000Z',
      tseNotes: null,
      createdAt: '2026-03-01T09:00:00.000Z',
      updatedAt: '2026-03-22T09:00:00.000Z',
    },
    {
      id: 'report-libertad-2026-03',
      partyId: PARTY_LIBERTAD,
      periodYear: 2026,
      periodMonth: 3,
      status: 'borrador',
      currentVersion: 0,
      title: 'Reporte marzo 2026',
      submittedBy: null,
      submittedAt: null,
      reviewedBy: null,
      reviewedAt: null,
      tseNotes: null,
      createdAt: '2026-04-01T09:00:00.000Z',
      updatedAt: '2026-04-01T09:00:00.000Z',
    },
    {
      id: 'report-renovacion-2026-01',
      partyId: PARTY_RENOVACION,
      periodYear: 2026,
      periodMonth: 1,
      status: 'aprobado',
      currentVersion: 1,
      title: 'Reporte enero 2026',
      submittedBy: 'user-renovacion-oficial-fixture',
      submittedAt: '2026-02-08T09:00:00.000Z',
      reviewedBy: TSE,
      reviewedAt: '2026-02-09T09:00:00.000Z',
      tseNotes: null,
      createdAt: '2026-02-01T09:00:00.000Z',
      updatedAt: '2026-02-09T09:00:00.000Z',
    },
  ],
};

/** Stable identifiers referenced by tests. */
export const analyticsFixtureIds = {
  parties: {
    libertad: PARTY_LIBERTAD,
    renovacion: PARTY_RENOVACION,
    avanza: PARTY_AVANZA,
  },
  buyers: { buyer1: BUYER_1, buyer2: BUYER_2, buyer3: BUYER_3 },
  tse: TSE,
};

/**
 * Reference "now" for deterministic compliance/time-series tests. Chosen so
 * `report-libertad-2026-03` (due 2026-04-15, +5 days grace) is clearly past
 * its grace period, i.e. `missing`.
 */
export const analyticsFixtureNow = '2026-07-01T00:00:00.000Z';
