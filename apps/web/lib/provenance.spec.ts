import type { BondProvenance, TransferLifecycle } from '@velar/types';
import {
  abortedStage,
  anomalyLabel,
  buildProvenanceExportText,
  createProvenanceClient,
  ownershipDurationLabel,
  provenanceSummary,
  sortAnomalies,
  stepStates,
  type FetchLike,
} from './provenance';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const liberadaLifecycle: TransferLifecycle = {
  transferId: 't1',
  fromOwner: 'party',
  toOwner: 'buyer',
  status: 'liberada',
  currentStepIndex: 5,
  terminal: true,
  stages: [
    { status: 'solicitada', at: '2026-02-01T10:00:00.000Z', eventId: 'e2' },
    { status: 'aceptada', at: '2026-02-02T10:00:00.000Z', eventId: 'e3' },
    { status: 'en_escrow', at: '2026-02-03T10:00:00.000Z', eventId: 'e4' },
    { status: 'pago_registrado', at: '2026-02-10T10:00:00.000Z', eventId: 'e5' },
    { status: 'pago_validado', at: '2026-02-20T10:00:00.000Z', eventId: 'e6' },
    { status: 'liberada', at: '2026-03-01T10:00:00.000Z', eventId: 'e7' },
  ],
};

const provenance: BondProvenance = {
  bond: {
    tokenId: 'token-1',
    bondId: 'BOND-1',
    issuerPartyId: 'party',
    currentOwner: 'buyer',
    status: 'transferido',
    documentHash: 'hash',
    createdAt: '2026-01-10T09:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
  },
  ownership: [
    { ownerId: 'party', from: '2026-01-10T09:00:00.000Z', to: '2026-03-01T10:00:00.000Z', current: false, viaTransferId: null, viaEventId: 'e1' },
    { ownerId: 'buyer', from: '2026-03-01T10:00:00.000Z', to: null, current: true, viaTransferId: 't1', viaEventId: 'e7' },
  ],
  transfers: [liberadaLifecycle],
  events: [],
  integrity: {
    ok: false,
    checkedAt: '2026-04-01T00:00:00.000Z',
    anomalies: [
      { type: 'missing_event', severity: 'warning', message: 'falta algo' },
      { type: 'ownership_gap', severity: 'error', message: 'hay un salto' },
    ],
  },
  reconstructedAt: '2026-04-01T00:00:00.000Z',
};

describe('provenanceSummary', () => {
  it('counts owners, transfers and anomalies by severity', () => {
    const s = provenanceSummary(provenance);
    expect(s.ownerCount).toBe(2);
    expect(s.transferCount).toBe(1);
    expect(s.errorCount).toBe(1);
    expect(s.warningCount).toBe(1);
    expect(s.ok).toBe(false);
    expect(s.currentOwnerId).toBe('buyer');
  });
});

describe('sortAnomalies', () => {
  it('puts errors before warnings, preserving order within a severity', () => {
    const sorted = sortAnomalies(provenance.integrity.anomalies);
    expect(sorted.map((a) => a.severity)).toEqual(['error', 'warning']);
  });

  it('has a Spanish label for every anomaly type', () => {
    expect(anomalyLabel('ownership_gap')).toMatch(/propiedad/i);
    expect(anomalyLabel('onchain_offchain_mismatch')).toMatch(/on-chain/i);
  });
});

describe('stepStates', () => {
  it('marks every step done for a released transfer', () => {
    const steps = stepStates(liberadaLifecycle);
    expect(steps).toHaveLength(6);
    expect(steps.every((s) => s.state === 'done')).toBe(true);
    expect(abortedStage(liberadaLifecycle)).toBeNull();
  });

  it('marks reached steps done, the current one current, the rest pending', () => {
    const inProgress: TransferLifecycle = {
      ...liberadaLifecycle,
      status: 'en_escrow',
      currentStepIndex: 2,
      terminal: false,
      stages: liberadaLifecycle.stages.slice(0, 3),
    };
    const steps = stepStates(inProgress);
    expect(steps[1].state).toBe('done');
    expect(steps[2].state).toBe('done'); // en_escrow has a stage
    expect(steps[3].state).toBe('pending');
  });

  it('marks unreached steps aborted for a cancelled transfer', () => {
    const cancelled: TransferLifecycle = {
      ...liberadaLifecycle,
      status: 'cancelada',
      currentStepIndex: -1,
      terminal: true,
      stages: [
        { status: 'solicitada', at: '2026-02-01T10:00:00.000Z', eventId: 'e2' },
        { status: 'cancelada', at: '2026-02-02T10:00:00.000Z', eventId: 'e3' },
      ],
    };
    const steps = stepStates(cancelled);
    expect(steps[0].state).toBe('done'); // solicitada
    expect(steps[1].state).toBe('aborted'); // aceptada never reached
    expect(abortedStage(cancelled)?.status).toBe('cancelada');
  });
});

describe('ownershipDurationLabel', () => {
  it('formats a multi-month past segment', () => {
    expect(ownershipDurationLabel(provenance.ownership[0])).toMatch(/mes/);
  });

  it('marks the current segment as ongoing', () => {
    const label = ownershipDurationLabel(provenance.ownership[1], new Date('2026-03-15T00:00:00.000Z'));
    expect(label).toMatch(/en curso/);
  });
});

describe('buildProvenanceExportText', () => {
  it('includes the chain, transfers and anomalies', () => {
    const text = buildProvenanceExportText(provenance);
    expect(text).toContain('CADENA DE PROPIEDAD');
    expect(text).toContain('TRANSFERENCIAS');
    expect(text).toContain('ANOMALÍAS');
    expect(text).toContain('party → buyer');
  });
});

describe('createProvenanceClient', () => {
  it('calls the guarded endpoint and returns the body', async () => {
    const calls: string[] = [];
    const fetchLike: FetchLike = async (url) => {
      calls.push(String(url));
      return jsonResponse(provenance);
    };
    const client = createProvenanceClient({ baseUrl: 'https://api.test/api', fetch: fetchLike });
    const result = await client.getBondProvenance('token-1');
    expect(calls[0]).toBe('https://api.test/api/bonds/token-1/provenance');
    expect(result.bond.tokenId).toBe('token-1');
  });

  it('calls the public endpoint for citizen verification', async () => {
    const calls: string[] = [];
    const fetchLike: FetchLike = async (url) => {
      calls.push(String(url));
      return jsonResponse(provenance);
    };
    const client = createProvenanceClient({ baseUrl: 'https://api.test/api', fetch: fetchLike });
    await client.getPublicBondProvenance('BOND-1');
    expect(calls[0]).toBe('https://api.test/api/public/bonds/BOND-1/provenance');
  });

  it('throws with the API message on error', async () => {
    const fetchLike: FetchLike = async () => jsonResponse({ error: 'Bond not found' }, 404);
    const client = createProvenanceClient({ baseUrl: 'https://api.test/api', fetch: fetchLike });
    await expect(client.getBondProvenance('nope')).rejects.toThrow('Bond not found');
  });
});
