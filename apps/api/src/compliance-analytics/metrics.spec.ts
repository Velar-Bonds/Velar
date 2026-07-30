import { ComplianceStatus, PeriodCompliance } from '@velar/types';
import {
  computeComplianceOverview,
  computePartyComplianceMetric,
  computeReviewerWorkload,
} from './metrics';

function period(
  status: PeriodCompliance['status'],
  overrides: Partial<PeriodCompliance> = {},
): PeriodCompliance {
  return {
    periodYear: 2026,
    periodMonth: 1,
    dueDate: '2026-02-15',
    status,
    daysRemaining: null,
    submittedAt: null,
    ...overrides,
  };
}

describe('computePartyComplianceMetric', () => {
  it('returns zeros for empty compliances', () => {
    const result = computePartyComplianceMetric('p1', 'Party A', []);
    expect(result).toEqual({
      partyId: 'p1',
      partyName: 'Party A',
      totalPeriods: 0,
      onTimeCount: 0,
      lateCount: 0,
      overdueCount: 0,
      missingCount: 0,
      complianceRate: 0,
    });
  });

  it('computes complianceRate excluding not_due periods', () => {
    const compliances = [
      period(ComplianceStatus.ON_TIME, { submittedAt: '2026-02-10' }),
      period(ComplianceStatus.LATE, { submittedAt: '2026-02-20' }),
      period(ComplianceStatus.NOT_DUE, { daysRemaining: 10 }),
      period(ComplianceStatus.OVERDUE, { daysRemaining: -2 }),
    ];
    const result = computePartyComplianceMetric('p1', 'Party A', compliances);
    expect(result.totalPeriods).toBe(4);
    expect(result.onTimeCount).toBe(1);
    expect(result.lateCount).toBe(1);
    expect(result.overdueCount).toBe(1);
    expect(result.complianceRate).toBeCloseTo(1 / 3);
  });

  it('guards complianceRate when all periods are not_due', () => {
    const compliances = [
      period(ComplianceStatus.NOT_DUE, { daysRemaining: 5 }),
      period(ComplianceStatus.NOT_DUE, { daysRemaining: 12 }),
    ];
    const result = computePartyComplianceMetric('p1', 'Party A', compliances);
    expect(result.complianceRate).toBe(0);
    expect(Number.isNaN(result.complianceRate)).toBe(false);
  });
});

describe('computeComplianceOverview', () => {
  it('returns zeros for empty input', () => {
    expect(computeComplianceOverview([])).toEqual({
      totalReports: 0,
      onTimeRate: 0,
      overdueCount: 0,
      atRiskCount: 0,
      missingCount: 0,
    });
  });

  it('counts at-risk as late or not_due within 3 days', () => {
    const compliances = [
      period(ComplianceStatus.LATE),
      period(ComplianceStatus.NOT_DUE, { daysRemaining: 3 }),
      period(ComplianceStatus.NOT_DUE, { daysRemaining: 4 }),
      period(ComplianceStatus.MISSING),
    ];
    const result = computeComplianceOverview(compliances);
    expect(result.atRiskCount).toBe(2);
    expect(result.missingCount).toBe(1);
  });

  it('guards onTimeRate when denominator is zero', () => {
    const compliances = [period(ComplianceStatus.NOT_DUE, { daysRemaining: 8 })];
    const result = computeComplianceOverview(compliances);
    expect(result.onTimeRate).toBe(0);
    expect(Number.isNaN(result.onTimeRate)).toBe(false);
  });
});

describe('computeReviewerWorkload', () => {
  it('returns slaAttainmentRate 1 and null avg when no decisions', () => {
    const result = computeReviewerWorkload({
      reviewerId: 'r1',
      reviewerName: 'Reviewer',
      assignedCount: 2,
      decisions: [],
      onTimeDecisions: 0,
    });
    expect(result.decidedCount).toBe(0);
    expect(result.avgDecisionHours).toBeNull();
    expect(result.slaAttainmentRate).toBe(1);
  });

  it('computes average decision hours and SLA attainment', () => {
    const result = computeReviewerWorkload({
      reviewerId: 'r1',
      reviewerName: 'Reviewer',
      assignedCount: 2,
      decisions: [
        {
          startedAt: '2026-06-01T00:00:00Z',
          decidedAt: '2026-06-01T12:00:00Z',
        },
        {
          startedAt: '2026-06-02T00:00:00Z',
          decidedAt: '2026-06-03T00:00:00Z',
        },
      ],
      onTimeDecisions: 1,
    });
    expect(result.decidedCount).toBe(2);
    expect(result.avgDecisionHours).toBeCloseTo(18);
    expect(result.slaAttainmentRate).toBeCloseTo(0.5);
  });
});
