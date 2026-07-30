import * as fc from 'fast-check';
import {
  ComplianceStatus,
  DiscrepancyType,
  FindingSeverity,
  FindingType,
  PeriodCompliance,
  ReconciliationResult,
} from '@velar/types';
import { evaluate, RuleEvalInput } from './engine';
import { listRuleSetVersions } from './rule-sets';

const NOW = '2026-03-01T12:00:00.000Z';

function cleanReconciliation(declaredTotal = 0): ReconciliationResult {
  return {
    status: 'clean',
    discrepancies: [],
    declaredTotal,
    actualTotal: declaredTotal,
    matchedCount: 0,
  };
}

function onTimeCompliance(): PeriodCompliance {
  return {
    periodYear: 2026,
    periodMonth: 1,
    dueDate: '2026-02-15',
    status: ComplianceStatus.ON_TIME,
    daysRemaining: null,
    submittedAt: '2026-02-10',
  };
}

function overdueCompliance(daysRemaining = -3): PeriodCompliance {
  return {
    periodYear: 2026,
    periodMonth: 1,
    dueDate: '2026-02-15',
    status: ComplianceStatus.OVERDUE,
    daysRemaining,
    submittedAt: null,
  };
}

function missingCompliance(daysRemaining = -10): PeriodCompliance {
  return {
    periodYear: 2026,
    periodMonth: 1,
    dueDate: '2026-02-15',
    status: ComplianceStatus.MISSING,
    daysRemaining,
    submittedAt: null,
  };
}

function input(partial: Partial<RuleEvalInput> = {}): RuleEvalInput {
  return {
    reconciliation: cleanReconciliation(),
    compliance: onTimeCompliance(),
    declaredTotal: 0,
    ...partial,
  };
}

const ALL_SEVERITIES = Object.values(FindingSeverity) as FindingSeverity[];

describe('evaluate — exhaustive cases', () => {
  it('clean report → no findings, LOW overall severity', () => {
    const result = evaluate(input({ declaredTotal: 1000 }), 'v1', NOW);
    expect(result.findings).toHaveLength(0);
    expect(result.overallSeverity).toBe(FindingSeverity.LOW);
    expect(result.ruleSetVersion).toBe('v1');
    expect(result.evaluatedAt).toBe(NOW);
  });

  it('amount_mismatch: severity bands by relative ratio (v1)', () => {
    // ratio = |1100-1000|/1000 = 0.1 → not below low(0.1) → MEDIUM
    const medium = evaluate(
      input({
        reconciliation: {
          status: 'discrepancies',
          discrepancies: [
            {
              type: DiscrepancyType.AMOUNT_MISMATCH,
              bondTokenId: 'bond-a',
              declaredAmount: 1100,
              actualAmount: 1000,
              message: 'mismatch',
            },
          ],
          declaredTotal: 1100,
          actualTotal: 1000,
          matchedCount: 0,
        },
        declaredTotal: 1100,
      }),
      'v1',
      NOW,
    );
    expect(medium.findings).toHaveLength(1);
    expect(medium.findings[0].type).toBe(FindingType.AMOUNT_MISMATCH);
    expect(medium.findings[0].severity).toBe(FindingSeverity.MEDIUM);
    expect(medium.findings[0].explanation.length).toBeGreaterThan(0);

    // ratio = 0.05 → LOW under v1
    const low = evaluate(
      input({
        reconciliation: {
          status: 'discrepancies',
          discrepancies: [
            {
              type: DiscrepancyType.AMOUNT_MISMATCH,
              bondTokenId: 'bond-a',
              declaredAmount: 1050,
              actualAmount: 1000,
              message: 'mismatch',
            },
          ],
          declaredTotal: 1050,
          actualTotal: 1000,
          matchedCount: 0,
        },
        declaredTotal: 1050,
      }),
      'v1',
      NOW,
    );
    expect(low.findings[0].severity).toBe(FindingSeverity.LOW);

    // ratio = 0.7 → CRITICAL under v1 (high=0.6)
    const critical = evaluate(
      input({
        reconciliation: {
          status: 'discrepancies',
          discrepancies: [
            {
              type: DiscrepancyType.AMOUNT_MISMATCH,
              bondTokenId: 'bond-a',
              declaredAmount: 1700,
              actualAmount: 1000,
              message: 'mismatch',
            },
          ],
          declaredTotal: 1700,
          actualTotal: 1000,
          matchedCount: 0,
        },
        declaredTotal: 1700,
      }),
      'v1',
      NOW,
    );
    expect(critical.findings[0].severity).toBe(FindingSeverity.CRITICAL);
  });

  it('missing_bond: HIGH if material (>10% of declaredTotal), else MEDIUM', () => {
    const material = evaluate(
      input({
        reconciliation: {
          status: 'discrepancies',
          discrepancies: [
            {
              type: DiscrepancyType.MISSING_BOND,
              bondTokenId: 'bond-b',
              declaredAmount: null,
              actualAmount: 500,
              message: 'missing',
            },
          ],
          declaredTotal: 1000,
          actualTotal: 1500,
          matchedCount: 0,
        },
        declaredTotal: 1000,
      }),
      'v1',
      NOW,
    );
    expect(material.findings[0].type).toBe(FindingType.MISSING_BOND);
    expect(material.findings[0].severity).toBe(FindingSeverity.HIGH);

    const minor = evaluate(
      input({
        reconciliation: {
          status: 'discrepancies',
          discrepancies: [
            {
              type: DiscrepancyType.MISSING_BOND,
              bondTokenId: 'bond-b',
              declaredAmount: null,
              actualAmount: 50,
              message: 'missing',
            },
          ],
          declaredTotal: 1000,
          actualTotal: 1050,
          matchedCount: 0,
        },
        declaredTotal: 1000,
      }),
      'v1',
      NOW,
    );
    expect(minor.findings[0].severity).toBe(FindingSeverity.MEDIUM);
  });

  it('unknown_reference: at least HIGH; CRITICAL if declaredAmount exceeds threshold', () => {
    const high = evaluate(
      input({
        reconciliation: {
          status: 'discrepancies',
          discrepancies: [
            {
              type: DiscrepancyType.UNKNOWN_REFERENCE,
              bondTokenId: 'ghost',
              declaredAmount: 100,
              actualAmount: null,
              message: 'unknown',
            },
          ],
          declaredTotal: 100,
          actualTotal: 0,
          matchedCount: 0,
        },
        declaredTotal: 100,
      }),
      'v1',
      NOW,
    );
    expect(high.findings[0].type).toBe(FindingType.UNKNOWN_REFERENCE);
    expect(high.findings[0].severity).toBe(FindingSeverity.HIGH);

    const critical = evaluate(
      input({
        reconciliation: {
          status: 'discrepancies',
          discrepancies: [
            {
              type: DiscrepancyType.UNKNOWN_REFERENCE,
              bondTokenId: 'ghost',
              declaredAmount: 5_000_001,
              actualAmount: null,
              message: 'unknown',
            },
          ],
          declaredTotal: 5_000_001,
          actualTotal: 0,
          matchedCount: 0,
        },
        declaredTotal: 5_000_001,
      }),
      'v1',
      NOW,
    );
    const unknown = critical.findings.find(
      (f) => f.type === FindingType.UNKNOWN_REFERENCE,
    );
    expect(unknown?.severity).toBe(FindingSeverity.CRITICAL);
  });

  it('overdue compliance → MEDIUM overdue finding; missing → HIGH', () => {
    const overdue = evaluate(
      input({ compliance: overdueCompliance(-3) }),
      'v1',
      NOW,
    );
    expect(overdue.findings).toHaveLength(1);
    expect(overdue.findings[0].type).toBe(FindingType.OVERDUE);
    expect(overdue.findings[0].severity).toBe(FindingSeverity.MEDIUM);
    expect(overdue.findings[0].explanation.some((s) => s.includes('2026-02-15'))).toBe(
      true,
    );

    const missing = evaluate(
      input({ compliance: missingCompliance(-10) }),
      'v1',
      NOW,
    );
    expect(missing.findings[0].type).toBe(FindingType.OVERDUE);
    expect(missing.findings[0].severity).toBe(FindingSeverity.HIGH);
  });

  it('does not emit overdue findings for on_time / not_due / late', () => {
    for (const status of [
      ComplianceStatus.ON_TIME,
      ComplianceStatus.NOT_DUE,
      ComplianceStatus.LATE,
    ]) {
      const result = evaluate(
        input({
          compliance: {
            periodYear: 2026,
            periodMonth: 1,
            dueDate: '2026-02-15',
            status,
            daysRemaining: status === ComplianceStatus.NOT_DUE ? 5 : null,
            submittedAt: status === ComplianceStatus.NOT_DUE ? null : '2026-02-20',
          },
        }),
        'v1',
        NOW,
      );
      expect(result.findings.filter((f) => f.type === FindingType.OVERDUE)).toHaveLength(
        0,
      );
    }
  });

  it('threshold_breach: below → none; at/above → HIGH; >2x → CRITICAL', () => {
    const below = evaluate(input({ declaredTotal: 4_999_999 }), 'v1', NOW);
    expect(below.findings.filter((f) => f.type === FindingType.THRESHOLD_BREACH)).toHaveLength(
      0,
    );

    const at = evaluate(input({ declaredTotal: 5_000_000 }), 'v1', NOW);
    expect(at.findings).toHaveLength(1);
    expect(at.findings[0].type).toBe(FindingType.THRESHOLD_BREACH);
    expect(at.findings[0].severity).toBe(FindingSeverity.HIGH);

    const over2x = evaluate(input({ declaredTotal: 10_000_001 }), 'v1', NOW);
    expect(over2x.findings[0].severity).toBe(FindingSeverity.CRITICAL);
  });

  it('sorts findings deterministically by severity desc, then type, then bondTokenId', () => {
    const discrepancies = [
      {
        type: DiscrepancyType.AMOUNT_MISMATCH,
        bondTokenId: 'zeta',
        declaredAmount: 1050,
        actualAmount: 1000,
        message: 'm1',
      },
      {
        type: DiscrepancyType.AMOUNT_MISMATCH,
        bondTokenId: 'alpha',
        declaredAmount: 1050,
        actualAmount: 1000,
        message: 'm2',
      },
      {
        type: DiscrepancyType.MISSING_BOND,
        bondTokenId: 'held-big',
        declaredAmount: null,
        actualAmount: 500,
        message: 'missing',
      },
    ];
    const base = {
      reconciliation: {
        status: 'discrepancies' as const,
        discrepancies,
        declaredTotal: 2100,
        actualTotal: 2500,
        matchedCount: 0,
      },
      compliance: overdueCompliance(),
      declaredTotal: 2100,
    };

    const result = evaluate(input(base), 'v1', NOW);
    const reordered = evaluate(
      input({
        ...base,
        reconciliation: {
          ...base.reconciliation,
          discrepancies: [...discrepancies].reverse(),
        },
      }),
      'v1',
      NOW,
    );
    expect(reordered).toEqual(result);

    const keys = result.findings.map(
      (f) => `${f.severity}|${f.type}|${f.bondTokenId ?? ''}`,
    );
    const sorted = [...keys].sort((a, b) => {
      const [sevA, typeA, idA] = a.split('|');
      const [sevB, typeB, idB] = b.split('|');
      const rank = (s: string) => ALL_SEVERITIES.indexOf(s as FindingSeverity);
      return rank(sevB) - rank(sevA) || typeA.localeCompare(typeB) || idA.localeCompare(idB);
    });
    expect(keys).toEqual(sorted);
  });
});

describe('evaluate — property-based', () => {
  const discrepancyArb = fc.record({
    type: fc.constantFrom(
      DiscrepancyType.AMOUNT_MISMATCH,
      DiscrepancyType.MISSING_BOND,
      DiscrepancyType.UNKNOWN_REFERENCE,
    ),
    bondTokenId: fc.stringMatching(/^[a-z0-9-]{1,12}$/),
    declaredAmount: fc.option(fc.nat({ max: 20_000_000 }), { nil: null }),
    actualAmount: fc.option(fc.nat({ max: 20_000_000 }), { nil: null }),
    message: fc.constant('arb'),
  });

  const reconciliationArb = fc.record({
    status: fc.constantFrom('clean' as const, 'discrepancies' as const),
    discrepancies: fc.array(discrepancyArb, { maxLength: 5 }),
    declaredTotal: fc.nat({ max: 20_000_000 }),
    actualTotal: fc.nat({ max: 20_000_000 }),
    matchedCount: fc.nat({ max: 20 }),
  });

  const complianceArb = fc.record({
    periodYear: fc.constant(2026),
    periodMonth: fc.integer({ min: 1, max: 12 }),
    dueDate: fc.constant('2026-02-15'),
    status: fc.constantFrom(
      ComplianceStatus.NOT_DUE,
      ComplianceStatus.ON_TIME,
      ComplianceStatus.LATE,
      ComplianceStatus.OVERDUE,
      ComplianceStatus.MISSING,
    ),
    daysRemaining: fc.option(fc.integer({ min: -60, max: 60 }), { nil: null }),
    submittedAt: fc.option(fc.constant('2026-02-10'), { nil: null }),
  });

  const versionArb = fc.constantFrom(...listRuleSetVersions());

  it('never throws; overallSeverity always valid; identical inputs → deep-equal', () => {
    fc.assert(
      fc.property(
        reconciliationArb,
        complianceArb,
        fc.nat({ max: 20_000_000 }),
        versionArb,
        (reconciliation, compliance, declaredTotal, version) => {
          const inp: RuleEvalInput = { reconciliation, compliance, declaredTotal };
          const a = evaluate(inp, version, NOW);
          const b = evaluate(inp, version, NOW);
          expect(ALL_SEVERITIES).toContain(a.overallSeverity);
          expect(a).toEqual(b);
          expect(a.evaluatedAt).toBe(NOW);
          expect(a.ruleSetVersion).toBe(version);
        },
      ),
      { numRuns: 100 },
    );
  });
});
