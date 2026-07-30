import * as fc from 'fast-check';
import {
  assertTransition,
  canTransition,
  isEditable,
  isTerminal,
  nextStatuses,
  resolveDecision,
  resolveSubmit,
  InvalidTransitionError,
  TRANSITIONS,
} from './workflow';
import { ReportStatus } from '@velar/types';

describe('workflow transitions', () => {
  it('allows the full happy path', () => {
    expect(canTransition(ReportStatus.BORRADOR, ReportStatus.ENVIADO)).toBe(true);
    expect(canTransition(ReportStatus.ENVIADO, ReportStatus.EN_REVISION)).toBe(true);
    expect(canTransition(ReportStatus.EN_REVISION, ReportStatus.APROBADO)).toBe(true);
  });

  it('allows the correction loop', () => {
    expect(canTransition(ReportStatus.EN_REVISION, ReportStatus.OBSERVADO)).toBe(true);
    expect(canTransition(ReportStatus.OBSERVADO, ReportStatus.REENVIADO)).toBe(true);
    expect(canTransition(ReportStatus.REENVIADO, ReportStatus.EN_REVISION)).toBe(true);
  });

  it('rejects illegal jumps', () => {
    expect(canTransition(ReportStatus.BORRADOR, ReportStatus.APROBADO)).toBe(false);
    expect(canTransition(ReportStatus.APROBADO, ReportStatus.ENVIADO)).toBe(false);
    expect(canTransition(ReportStatus.ENVIADO, ReportStatus.APROBADO)).toBe(false);
  });

  it('assertTransition throws InvalidTransitionError on illegal moves', () => {
    expect(() => assertTransition(ReportStatus.BORRADOR, ReportStatus.APROBADO)).toThrow(
      InvalidTransitionError,
    );
    expect(() =>
      assertTransition(ReportStatus.EN_REVISION, ReportStatus.OBSERVADO),
    ).not.toThrow();
  });

  it('aprobado is terminal', () => {
    expect(isTerminal(ReportStatus.APROBADO)).toBe(true);
    expect(nextStatuses(ReportStatus.APROBADO)).toEqual([]);
    expect(isTerminal(ReportStatus.BORRADOR)).toBe(false);
  });

  it('only borrador and observado are editable by the party', () => {
    expect(isEditable(ReportStatus.BORRADOR)).toBe(true);
    expect(isEditable(ReportStatus.OBSERVADO)).toBe(true);
    expect(isEditable(ReportStatus.EN_REVISION)).toBe(false);
    expect(isEditable(ReportStatus.APROBADO)).toBe(false);
  });
});

describe('resolveSubmit', () => {
  it('first submission: borrador → enviado, not a resubmission', () => {
    expect(resolveSubmit(ReportStatus.BORRADOR)).toEqual({
      next: ReportStatus.ENVIADO,
      isResubmission: false,
    });
  });

  it('correction: observado → reenviado, marked as resubmission', () => {
    expect(resolveSubmit(ReportStatus.OBSERVADO)).toEqual({
      next: ReportStatus.REENVIADO,
      isResubmission: true,
    });
  });

  it('cannot submit from a non-editable state', () => {
    expect(() => resolveSubmit(ReportStatus.EN_REVISION)).toThrow();
    expect(() => resolveSubmit(ReportStatus.APROBADO)).toThrow();
  });
});

const allStatuses = Object.values(ReportStatus) as ReportStatus[];
const statusArb = fc.constantFrom(...allStatuses);
const amountArb = fc.nat({ max: 10_000_000 });

describe('resolveDecision property tests', () => {
  it('no illegal transition is reachable', () => {
    fc.assert(
      fc.property(statusArb, statusArb, amountArb, amountArb, (from, to, declaredTotal, dualControlThreshold) => {
        const legal = (TRANSITIONS[from] ?? []).includes(to);
        const ctx = { declaredTotal, dualControlThreshold };

        if (!legal) {
          // Dual-control may remap EN_REVISION + APROBADO → PENDIENTE when over threshold;
          // that pair IS legal in TRANSITIONS, so it never lands here.
          // For every genuinely illegal (from, to), both APIs must throw.
          expect(() => assertTransition(from, to)).toThrow(InvalidTransitionError);
          expect(() => resolveDecision(from, to, ctx)).toThrow(InvalidTransitionError);
        }
      }),
    );
  });

  it('dual control triggers iff over threshold from EN_REVISION requesting APROBADO', () => {
    fc.assert(
      fc.property(amountArb, amountArb, (declaredTotal, dualControlThreshold) => {
        const result = resolveDecision(ReportStatus.EN_REVISION, ReportStatus.APROBADO, {
          declaredTotal,
          dualControlThreshold,
        });
        const overThreshold = declaredTotal >= dualControlThreshold;

        if (overThreshold) {
          expect(result).toEqual({
            next: ReportStatus.PENDIENTE_SEGUNDA_APROBACION,
            requiresSecondApproval: true,
            isSecondApproval: false,
          });
        } else {
          expect(result).toEqual({
            next: ReportStatus.APROBADO,
            requiresSecondApproval: false,
            isSecondApproval: false,
          });
        }
        // Mutually exclusive flags
        expect(result.requiresSecondApproval && result.isSecondApproval).toBe(false);
      }),
    );
  });

  it('second approval closes dual control regardless of amounts', () => {
    fc.assert(
      fc.property(amountArb, amountArb, (declaredTotal, dualControlThreshold) => {
        const result = resolveDecision(
          ReportStatus.PENDIENTE_SEGUNDA_APROBACION,
          ReportStatus.APROBADO,
          { declaredTotal, dualControlThreshold },
        );
        expect(result).toEqual({
          next: ReportStatus.APROBADO,
          requiresSecondApproval: false,
          isSecondApproval: true,
        });
      }),
    );
  });

  it('idempotency: identical args yield deep-equal results', () => {
    fc.assert(
      fc.property(statusArb, statusArb, amountArb, amountArb, (from, to, declaredTotal, dualControlThreshold) => {
        const ctx = { declaredTotal, dualControlThreshold };
        const run = () => {
          try {
            return { ok: true as const, value: resolveDecision(from, to, ctx) };
          } catch (e) {
            return {
              ok: false as const,
              name: e instanceof Error ? e.name : 'Error',
              message: e instanceof Error ? e.message : String(e),
            };
          }
        };
        expect(run()).toEqual(run());
      }),
    );
  });

  it('terminal states stay terminal', () => {
    for (const terminal of [ReportStatus.RECHAZADO, ReportStatus.APROBADO]) {
      expect(nextStatuses(terminal)).toEqual([]);
      expect(isTerminal(terminal)).toBe(true);
    }
  });
});
