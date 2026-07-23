import type { ProvenanceInput } from '../provenance';

/**
 * Development/testing fixture for the provenance engine (issue #36).
 *
 * A clean, gap-free history of one bond: emitted to a party, then transferred
 * to a buyer through the full escrow lifecycle. Reconstructs with NO anomalies.
 * Anomaly variants (gap, illegal transition, on-chain/off-chain mismatch) are
 * derived from this base in the engine's tests.
 *
 * NOT production data — exists so the engine, API and UI can be built and tested
 * locally with no VELAR database, secrets or external APIs.
 */

const PARTY = 'party-libertad';
const BUYER = 'buyer-juan';
const TSE = 'tse-authority';
const TOKEN = 'bond-token-001';
const TRANSFER = 'transfer-001';
const TX_ESCROW = 'stellar-tx-escrow-aaaa';
const TX_RELEASE = 'stellar-tx-release-bbbb';

export const provenanceFixture: ProvenanceInput = {
  bond: {
    tokenId: TOKEN,
    bondId: 'BOND-2026-001',
    issuerPartyId: PARTY,
    country: 'CR',
    currentOwner: BUYER,
    status: 'transferido',
    documentHash: 'sha256-bonddoc-0001',
    faceValue: 1000,
    currency: 'CRC',
    createdAt: '2026-01-10T09:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
  },
  transfers: [
    {
      id: TRANSFER,
      bondTokenId: TOKEN,
      fromOwner: PARTY,
      toOwner: BUYER,
      status: 'liberada',
      escrowContractId: 'CESCROW0001',
      paymentEvidenceHash: 'sha256-payment-0001',
      validatedBy: TSE,
      amount: 1000,
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-03-01T12:00:00.000Z',
    },
  ],
  events: [
    {
      id: 'evt-1',
      bondTokenId: TOKEN,
      transferId: null,
      type: 'bond_emitido',
      actorId: TSE,
      payload: { owner: PARTY },
      createdAt: '2026-01-10T09:00:00.000Z',
    },
    {
      id: 'evt-2',
      bondTokenId: TOKEN,
      transferId: TRANSFER,
      type: 'transfer_solicitada',
      actorId: PARTY,
      payload: { from: PARTY, to: BUYER },
      createdAt: '2026-02-01T10:00:00.000Z',
    },
    {
      id: 'evt-3',
      bondTokenId: TOKEN,
      transferId: TRANSFER,
      type: 'transfer_aceptada',
      actorId: BUYER,
      payload: {},
      createdAt: '2026-02-02T11:00:00.000Z',
    },
    {
      id: 'evt-4',
      bondTokenId: TOKEN,
      transferId: TRANSFER,
      type: 'escrow_bloqueado',
      actorId: PARTY,
      payload: { escrowContractId: 'CESCROW0001' },
      txHash: TX_ESCROW,
      createdAt: '2026-02-03T12:00:00.000Z',
    },
    {
      id: 'evt-5',
      bondTokenId: TOKEN,
      transferId: TRANSFER,
      type: 'pago_registrado',
      actorId: BUYER,
      payload: { paymentEvidenceHash: 'sha256-payment-0001' },
      createdAt: '2026-02-10T13:00:00.000Z',
    },
    {
      id: 'evt-6',
      bondTokenId: TOKEN,
      transferId: TRANSFER,
      type: 'pago_validado',
      actorId: TSE,
      payload: {},
      createdAt: '2026-02-20T14:00:00.000Z',
    },
    {
      id: 'evt-7',
      bondTokenId: TOKEN,
      transferId: TRANSFER,
      type: 'token_liberado',
      actorId: PARTY,
      payload: { from: PARTY, to: BUYER },
      txHash: TX_RELEASE,
      createdAt: '2026-03-01T12:00:00.000Z',
    },
  ],
};

/** Stable identifiers referenced by tests. */
export const provenanceFixtureIds = {
  token: TOKEN,
  transfer: TRANSFER,
  party: PARTY,
  buyer: BUYER,
  tse: TSE,
  txEscrow: TX_ESCROW,
  txRelease: TX_RELEASE,
};
