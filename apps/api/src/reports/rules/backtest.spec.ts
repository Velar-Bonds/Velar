import {
  ComplianceStatus,
  DiscrepancyType,
  FindingSeverity,
  FindingType,
  HistoricalReportFixture,
} from '@velar/types';
import { backtest, diffEvaluations } from './backtest';
import { evaluate, RuleEvalInput } from './engine';

const NOW = '2026-03-01T12:00:00.000Z';

function baseFixture(
  overrides: Partial<HistoricalReportFixture> & { reportId: string },
): HistoricalReportFixture {
  return {
    declared: [],
    held: [],
    periodYear: 2026,
    periodMonth: 1,
    submittedAt: '2026-02-10',
    now: NOW,
    ...overrides,
  };
}

describe('diffEvaluations', () => {
  it('reports added/removed by type+bondTokenId and severityChanged', () => {
    const baselineInput: RuleEvalInput = {
      reconciliation: {
        status: 'discrepancies',
        discrepancies: [
          {
            type: DiscrepancyType.AMOUNT_MISMATCH,
            bondTokenId: 'bond-a',
            declaredAmount: 1050,
            actualAmount: 1000,
            message: 'm',
          },
        ],
        declaredTotal: 1050,
        actualTotal: 1000,
        matchedCount: 0,
      },
      compliance: {
        periodYear: 2026,
        periodMonth: 1,
        dueDate: '2026-02-15',
        status: ComplianceStatus.ON_TIME,
        daysRemaining: null,
        submittedAt: '2026-02-10',
      },
      declaredTotal: 1050,
    };
    const baseline = evaluate(baselineInput, 'v1', NOW);

    const candidateInput: RuleEvalInput = {
      ...baselineInput,
      reconciliation: {
        ...baselineInput.reconciliation,
        discrepancies: [
          {
            type: DiscrepancyType.MISSING_BOND,
            bondTokenId: 'bond-b',
            declaredAmount: null,
            actualAmount: 200,
            message: 'missing',
          },
        ],
      },
      declaredTotal: 10_000_001,
    };
    const candidate = evaluate(candidateInput, 'v1', NOW);

    const diff = diffEvaluations(baseline, candidate, 'r-1');
    expect(diff.reportId).toBe('r-1');
    expect(diff.removed.some((f) => f.type === FindingType.AMOUNT_MISMATCH)).toBe(true);
    expect(diff.added.some((f) => f.type === FindingType.MISSING_BOND)).toBe(true);
    expect(diff.added.some((f) => f.type === FindingType.THRESHOLD_BREACH)).toBe(true);
    expect(diff.severityChanged).toBe(
      baseline.overallSeverity !== candidate.overallSeverity,
    );
  });
});

describe('backtest', () => {
  it('v1→v2 produces diffs when amount-mismatch falls in different severity bands', () => {
    // ratio = |1080-1000|/1000 = 0.08
    // v1 low=0.1 → LOW; v2 low=0.05 → MEDIUM (0.08 >= 0.05 and < 0.15)
    // Same finding type+bondTokenId → not added/removed, but overallSeverity may change.
    // Also include a case where v2 fires threshold_breach that v1 does not:
    // declaredTotal = 4_000_000 → between v2 (3M) and v1 (5M) thresholds.
    const fixtures: HistoricalReportFixture[] = [
      baseFixture({
        reportId: 'mismatch-band',
        declared: [{ bondTokenId: 'bond-a', amount: 1080 }],
        held: [{ bondTokenId: 'bond-a', amount: 1000 }],
        submittedAt: '2026-02-10',
      }),
      baseFixture({
        reportId: 'threshold-v2-only',
        declared: [{ bondTokenId: 'bond-a', amount: 4_000_000 }],
        held: [{ bondTokenId: 'bond-a', amount: 4_000_000 }],
        submittedAt: '2026-02-10',
      }),
    ];

    const result = backtest('v1', 'v2', fixtures);
    expect(result.baselineVersion).toBe('v1');
    expect(result.candidateVersion).toBe('v2');
    expect(result.summary.totalReports).toBe(2);

    const bandDiff = result.diffs.find((d) => d.reportId === 'mismatch-band');
    expect(bandDiff).toBeDefined();
    expect(bandDiff!.baseline.findings[0].severity).toBe(FindingSeverity.LOW);
    expect(bandDiff!.candidate.findings[0].severity).toBe(FindingSeverity.MEDIUM);
    expect(bandDiff!.severityChanged).toBe(true);
    // Same finding key → not added/removed
    expect(bandDiff!.added).toHaveLength(0);
    expect(bandDiff!.removed).toHaveLength(0);

    const threshDiff = result.diffs.find((d) => d.reportId === 'threshold-v2-only');
    expect(threshDiff).toBeDefined();
    expect(
      threshDiff!.baseline.findings.some((f) => f.type === FindingType.THRESHOLD_BREACH),
    ).toBe(false);
    expect(
      threshDiff!.candidate.findings.some((f) => f.type === FindingType.THRESHOLD_BREACH),
    ).toBe(true);
    expect(threshDiff!.added.some((f) => f.type === FindingType.THRESHOLD_BREACH)).toBe(
      true,
    );
    expect(threshDiff!.severityChanged).toBe(true);

    expect(result.summary.reportsChanged).toBeGreaterThanOrEqual(2);
  });

  it('identical outcomes under both versions → empty diffs / no reportsChanged', () => {
    // Clean, small, on-time report — same under v1 and v2.
    const fixtures: HistoricalReportFixture[] = [
      baseFixture({
        reportId: 'clean-1',
        declared: [{ bondTokenId: 'bond-a', amount: 1000 }],
        held: [{ bondTokenId: 'bond-a', amount: 1000 }],
      }),
      baseFixture({
        reportId: 'clean-2',
        declared: [
          { bondTokenId: 'bond-a', amount: 500 },
          { bondTokenId: 'bond-b', amount: 500 },
        ],
        held: [
          { bondTokenId: 'bond-a', amount: 500 },
          { bondTokenId: 'bond-b', amount: 500 },
        ],
      }),
    ];

    const result = backtest('v1', 'v2', fixtures);
    expect(result.summary.totalReports).toBe(2);
    expect(result.summary.reportsChanged).toBe(0);
    for (const d of result.diffs) {
      expect(d.added).toHaveLength(0);
      expect(d.removed).toHaveLength(0);
      expect(d.severityChanged).toBe(false);
      expect(d.baseline.findings).toEqual(d.candidate.findings);
    }
  });

  it('includes overdue findings when fixture is past grace without submission', () => {
    const fixtures: HistoricalReportFixture[] = [
      baseFixture({
        reportId: 'missing-period',
        declared: [{ bondTokenId: 'bond-a', amount: 100 }],
        held: [{ bondTokenId: 'bond-a', amount: 100 }],
        periodYear: 2026,
        periodMonth: 1,
        submittedAt: null,
        now: '2026-02-25', // due 2026-02-15, grace ends 2026-02-20 → missing
      }),
    ];
    const result = backtest('v1', 'v1', fixtures);
    const d = result.diffs[0];
    expect(d.baseline.findings.some((f) => f.type === FindingType.OVERDUE)).toBe(true);
    expect(d.baseline.findings.find((f) => f.type === FindingType.OVERDUE)?.severity).toBe(
      FindingSeverity.HIGH,
    );
    expect(result.summary.reportsChanged).toBe(0);
  });
});
