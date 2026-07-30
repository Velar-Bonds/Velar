import * as fc from 'fast-check';
import { DeclaredBondRef, HeldBond } from '@velar/types';
import { reconcile } from './reconciliation';
import {
  hasSufficientConfirmations,
  isWithinToleranceWindow,
  reconcileWithTolerance,
  ToleranceWindowConfig,
} from './reconciliation-window';

const heldFixture: HeldBond[] = [
  { bondTokenId: 'bond-a', amount: 1000 },
  { bondTokenId: 'bond-b', amount: 2500 },
];

const cleanDeclared: DeclaredBondRef[] = [
  { bondTokenId: 'bond-a', amount: 1000 },
  { bondTokenId: 'bond-b', amount: 2500 },
];

const mismatchDeclared: DeclaredBondRef[] = [
  { bondTokenId: 'bond-a', amount: 999 },
  { bondTokenId: 'bond-b', amount: 2500 },
];

const OBSERVED_AT = '2026-07-28T10:00:00.000Z';
const WITHIN_WINDOW_NOW = '2026-07-28T10:00:30.000Z';
const PAST_WINDOW_NOW = '2026-07-28T10:02:00.000Z';
const BEFORE_OBSERVED_NOW = '2026-07-28T09:59:00.000Z';

function defaultConfig(overrides: Partial<ToleranceWindowConfig> = {}): ToleranceWindowConfig {
  return {
    requiredConfirmations: 6,
    toleranceWindowMs: 60_000,
    ...overrides,
  };
}

describe('reconcileWithTolerance', () => {
  it('clean reconciliation → windowStatus clean, never shouldRecheck', () => {
    const config = defaultConfig();
    const cases = [
      { confirmations: 0, now: WITHIN_WINDOW_NOW },
      { confirmations: 0, now: PAST_WINDOW_NOW },
      { confirmations: 12, now: WITHIN_WINDOW_NOW },
      { confirmations: 12, now: PAST_WINDOW_NOW },
    ];

    for (const { confirmations, now } of cases) {
      const res = reconcileWithTolerance(
        cleanDeclared,
        heldFixture,
        { observedAt: OBSERVED_AT, confirmations },
        config,
        now,
      );
      expect(res.status).toBe('clean');
      expect(res.windowStatus).toBe('clean');
      expect(res.shouldRecheck).toBe(false);
      expect(res.discrepancies).toHaveLength(0);
    }
  });

  it('discrepancies + fresh observation (within window) → pending_confirmation', () => {
    const res = reconcileWithTolerance(
      mismatchDeclared,
      heldFixture,
      { observedAt: OBSERVED_AT, confirmations: 12 },
      defaultConfig(),
      WITHIN_WINDOW_NOW,
    );

    expect(res.status).toBe('discrepancies');
    expect(res.windowStatus).toBe('pending_confirmation');
    expect(res.shouldRecheck).toBe(true);
    expect(res.discrepancies.length).toBeGreaterThan(0);
  });

  it('discrepancies + old observation + enough confirmations → definitive discrepancies', () => {
    const res = reconcileWithTolerance(
      mismatchDeclared,
      heldFixture,
      { observedAt: OBSERVED_AT, confirmations: 6 },
      defaultConfig(),
      PAST_WINDOW_NOW,
    );

    expect(res.status).toBe('discrepancies');
    expect(res.windowStatus).toBe('discrepancies');
    expect(res.shouldRecheck).toBe(false);
    expect(res.discrepancies.length).toBeGreaterThan(0);
  });

  it('discrepancies + old observation but insufficient confirmations → pending_confirmation', () => {
    const res = reconcileWithTolerance(
      mismatchDeclared,
      heldFixture,
      { observedAt: OBSERVED_AT, confirmations: 5 },
      defaultConfig({ requiredConfirmations: 6 }),
      PAST_WINDOW_NOW,
    );

    expect(res.status).toBe('discrepancies');
    expect(res.windowStatus).toBe('pending_confirmation');
    expect(res.shouldRecheck).toBe(true);
  });

  it('surfaces discrepancies even when pending (does not hide them)', () => {
    const base = reconcile(mismatchDeclared, heldFixture);
    const res = reconcileWithTolerance(
      mismatchDeclared,
      heldFixture,
      { observedAt: OBSERVED_AT, confirmations: 0 },
      defaultConfig(),
      WITHIN_WINDOW_NOW,
    );

    expect(res.discrepancies).toEqual(base.discrepancies);
    expect(res.declaredTotal).toBe(base.declaredTotal);
    expect(res.actualTotal).toBe(base.actualTotal);
    expect(res.matchedCount).toBe(base.matchedCount);
  });
});

describe('isWithinToleranceWindow', () => {
  const windowMs = 60_000;

  it('returns true when elapsed time is strictly less than the window', () => {
    expect(isWithinToleranceWindow(OBSERVED_AT, WITHIN_WINDOW_NOW, windowMs)).toBe(true);
  });

  it('returns false exactly at the window boundary', () => {
    const atBoundary = '2026-07-28T10:01:00.000Z';
    expect(isWithinToleranceWindow(OBSERVED_AT, atBoundary, windowMs)).toBe(false);
  });

  it('returns false when past the window', () => {
    expect(isWithinToleranceWindow(OBSERVED_AT, PAST_WINDOW_NOW, windowMs)).toBe(false);
  });

  it('treats clock skew (now before observedAt) as within the window', () => {
    expect(isWithinToleranceWindow(OBSERVED_AT, BEFORE_OBSERVED_NOW, windowMs)).toBe(true);
  });
});

describe('hasSufficientConfirmations', () => {
  it('returns true when confirmations meet or exceed required', () => {
    expect(hasSufficientConfirmations(6, 6)).toBe(true);
    expect(hasSufficientConfirmations(10, 6)).toBe(true);
  });

  it('returns false when confirmations are below required', () => {
    expect(hasSufficientConfirmations(0, 6)).toBe(false);
    expect(hasSufficientConfirmations(5, 6)).toBe(false);
  });
});

describe('reconcileWithTolerance property tests', () => {
  const tokenIdArb = fc.stringMatching(/^[a-z][a-z0-9-]{0,7}$/);
  const amountArb = fc.nat({ max: 1_000_000 });
  const bondRefArb = fc.record({ bondTokenId: tokenIdArb, amount: amountArb });
  const heldBondArb = fc.record({ bondTokenId: tokenIdArb, amount: amountArb });

  const declaredArb = fc.array(bondRefArb, { minLength: 0, maxLength: 8 });
  const heldArb = fc.array(heldBondArb, { minLength: 0, maxLength: 8 });
  const confirmationsArb = fc.nat({ max: 20 });
  const requiredArb = fc.nat({ max: 20 });
  const toleranceWindowMsArb = fc.nat({ max: 300_000 });
  const offsetMsArb = fc.nat({ max: 600_000 });

  it('window logic never overrides the underlying clean/dirty verdict', () => {
    fc.assert(
      fc.property(
        declaredArb,
        heldArb,
        confirmationsArb,
        requiredArb,
        toleranceWindowMsArb,
        offsetMsArb,
        (declared, held, confirmations, requiredConfirmations, toleranceWindowMs, offsetMs) => {
          const observedAt = OBSERVED_AT;
          const nowMs = Date.parse(observedAt) + offsetMs;
          const now = new Date(nowMs).toISOString();

          const base = reconcile(declared, held);
          const res = reconcileWithTolerance(
            declared,
            held,
            { observedAt, confirmations },
            { requiredConfirmations, toleranceWindowMs },
            now,
          );

          expect(res.status).toBe(base.status);
          expect(res.discrepancies).toEqual(base.discrepancies);

          if (base.status === 'clean') {
            expect(res.windowStatus).toBe('clean');
          } else {
            expect(res.windowStatus).not.toBe('clean');
          }
        },
      ),
    );
  });
});
