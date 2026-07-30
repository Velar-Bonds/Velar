import * as fc from 'fast-check';
import { ChainedAuditEvent } from '@velar/types';
import {
  canonicalize,
  ChainableEventInput,
  computeEventHash,
  verifyChain,
} from './audit-chain';

// ─────────────────────────────────────────────────────────────────────────────
// Factory helpers
// ─────────────────────────────────────────────────────────────────────────────

const BASE_DATE = '2026-06-01T12:00:00Z';

function makeInput(overrides: Partial<ChainableEventInput> = {}): ChainableEventInput {
  return {
    chainSeq: 1,
    prevHash: null,
    type: 'bond_emitido',
    bondTokenId: 'bond-001',
    transferId: null,
    actorId: 'tse-1',
    payload: { amount: 100, currency: 'CRC' },
    txHash: null,
    createdAt: BASE_DATE,
    ...overrides,
  };
}

function makeChainedEvent(
  overrides: Partial<ChainedAuditEvent> & {
    chainSeq: number;
    prevHash: string | null;
    hash: string;
  },
): ChainedAuditEvent {
  return {
    id: overrides.id ?? `event-${overrides.chainSeq}`,
    bondTokenId: overrides.bondTokenId ?? 'bond-001',
    transferId: overrides.transferId ?? null,
    type: overrides.type ?? 'bond_emitido',
    actorId: overrides.actorId ?? 'tse-1',
    payload: overrides.payload ?? { seq: overrides.chainSeq },
    txHash: overrides.txHash ?? null,
    createdAt: overrides.createdAt ?? BASE_DATE,
    chainSeq: overrides.chainSeq,
    prevHash: overrides.prevHash,
    hash: overrides.hash,
  };
}

/** Construye N eventos encadenados correctamente (prevHash/hash válidos). */
function buildValidChain(n: number): ChainedAuditEvent[] {
  const events: ChainedAuditEvent[] = [];
  let prevHash: string | null = null;

  for (let i = 1; i <= n; i++) {
    const input = makeInput({
      chainSeq: i,
      prevHash,
      type: i === 1 ? 'bond_emitido' : 'transfer_solicitada',
      payload: { seq: i, note: `event-${i}` },
      createdAt: `2026-06-${String(i).padStart(2, '0')}T12:00:00Z`,
    });
    const canonical = canonicalize(input);
    const hash = computeEventHash(prevHash, canonical);
    events.push(
      makeChainedEvent({
        id: `event-${i}`,
        chainSeq: i,
        prevHash,
        hash,
        type: input.type as ChainedAuditEvent['type'],
        payload: input.payload as Record<string, unknown>,
        createdAt: input.createdAt,
      }),
    );
    prevHash = hash;
  }

  return events;
}

function makeLegacyEvent(id: string): ChainedAuditEvent {
  return {
    id,
    bondTokenId: 'bond-001',
    transferId: null,
    type: 'bond_emitido',
    actorId: 'tse-1',
    payload: { legacy: true },
    txHash: null,
    createdAt: '2026-01-01T00:00:00Z',
    chainSeq: null,
    prevHash: null,
    hash: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('audit-chain', () => {
  describe('canonicalize', () => {
    it('produces identical strings for logically-equal payloads with different key insertion order', () => {
      const a = makeInput({
        payload: { z: 1, a: { y: 2, b: 3 }, m: [1, { d: 4, c: 5 }] },
      });
      const b = makeInput({
        payload: { a: { b: 3, y: 2 }, m: [1, { c: 5, d: 4 }], z: 1 },
      });

      expect(canonicalize(a)).toBe(canonicalize(b));
    });

    it('produces different strings for different payload content', () => {
      const a = makeInput({ payload: { amount: 100 } });
      const b = makeInput({ payload: { amount: 200 } });

      expect(canonicalize(a)).not.toBe(canonicalize(b));
    });
  });

  describe('computeEventHash', () => {
    it('is deterministic for the same inputs', () => {
      const canonical = canonicalize(makeInput());
      expect(computeEventHash(null, canonical)).toBe(computeEventHash(null, canonical));
      expect(computeEventHash('abc', canonical)).toBe(computeEventHash('abc', canonical));
    });

    it('changes when prevHash changes', () => {
      const canonical = canonicalize(makeInput());
      expect(computeEventHash(null, canonical)).not.toBe(computeEventHash('other', canonical));
    });

    it('changes when canonical changes', () => {
      const a = canonicalize(makeInput({ payload: { x: 1 } }));
      const b = canonicalize(makeInput({ payload: { x: 2 } }));
      expect(computeEventHash(null, a)).not.toBe(computeEventHash(null, b));
    });

    it('treats prevHash null as empty string', () => {
      const canonical = canonicalize(makeInput());
      expect(computeEventHash(null, canonical)).toBe(computeEventHash('', canonical));
    });
  });

  describe('verifyChain', () => {
    it('accepts a well-formed chain of N sequential events', () => {
      const n = 5;
      const chain = buildValidChain(n);
      const result = verifyChain(chain);

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.checkedCount).toBe(n);
    });

    it('detects hash_mismatch when payload is tampered after hashing', () => {
      const chain = buildValidChain(3);
      chain[1] = {
        ...chain[1],
        payload: { ...chain[1].payload, tampered: true },
      };

      const result = verifyChain(chain);

      expect(result.valid).toBe(false);
      expect(result.checkedCount).toBe(3);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        type: 'hash_mismatch',
        chainSeq: 2,
      });
    });

    it('detects gap when a middle event is removed', () => {
      const chain = buildValidChain(5);
      const withGap = [chain[0], chain[1], chain[3], chain[4]]; // seq 1,2,4,5

      const result = verifyChain(withGap);

      expect(result.valid).toBe(false);
      expect(result.checkedCount).toBe(4);
      expect(result.issues.filter((i) => i.type === 'gap')).toHaveLength(1);
      expect(result.issues.find((i) => i.type === 'gap')).toMatchObject({
        type: 'gap',
        chainSeq: 4,
      });
    });

    it('detects broken_link when prevHash is corrupted', () => {
      const chain = buildValidChain(3);
      chain[2] = {
        ...chain[2],
        prevHash: 'deadbeef'.repeat(8),
      };
      // Recompute stored hash so only the link is broken, not the content hash.
      const canonical = canonicalize({
        chainSeq: chain[2].chainSeq as number,
        prevHash: chain[2].prevHash,
        type: chain[2].type,
        bondTokenId: chain[2].bondTokenId,
        transferId: chain[2].transferId,
        actorId: chain[2].actorId,
        payload: chain[2].payload,
        txHash: chain[2].txHash ?? null,
        createdAt: chain[2].createdAt,
      });
      chain[2] = {
        ...chain[2],
        hash: computeEventHash(chain[2].prevHash, canonical),
      };

      const result = verifyChain(chain);

      expect(result.valid).toBe(false);
      expect(result.checkedCount).toBe(3);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        type: 'broken_link',
        chainSeq: 3,
      });
    });

    it('skips legacy null-chainSeq rows and still verifies the chained subset', () => {
      const chained = buildValidChain(3);
      const mixed: ChainedAuditEvent[] = [
        makeLegacyEvent('legacy-1'),
        chained[0],
        makeLegacyEvent('legacy-2'),
        chained[1],
        makeLegacyEvent('legacy-3'),
        chained[2],
      ];

      const result = verifyChain(mixed);

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.checkedCount).toBe(3);
    });

    it('accepts an empty array', () => {
      const result = verifyChain([]);

      expect(result.valid).toBe(true);
      expect(result.checkedCount).toBe(0);
      expect(result.issues).toEqual([]);
    });

    it('property: any well-formed chain of length 0..20 verifies as valid', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 20 }), (n) => {
          const result = verifyChain(buildValidChain(n));
          expect(result.valid).toBe(true);
          expect(result.issues).toEqual([]);
          expect(result.checkedCount).toBe(n);
        }),
      );
    });
  });
});
