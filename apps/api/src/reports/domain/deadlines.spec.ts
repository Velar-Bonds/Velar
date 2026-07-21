import {
  computeCompliance,
  computeDueDate,
  daysBetween,
  computeComplianceForPeriods,
} from './deadlines';
import { ComplianceStatus, DeadlineConfig } from '@velar/types';

const config: DeadlineConfig = { dueDayOfMonth: 15, graceDays: 5 };

describe('computeDueDate', () => {
  it('due date is the 15th of the following month', () => {
    expect(computeDueDate(2026, 1, 15)).toBe('2026-02-15');
  });
  it('rolls over December → January next year', () => {
    expect(computeDueDate(2026, 12, 15)).toBe('2027-01-15');
  });
});

describe('daysBetween', () => {
  it('counts whole UTC days, signed', () => {
    expect(daysBetween('2026-02-10', '2026-02-15')).toBe(5);
    expect(daysBetween('2026-02-20', '2026-02-15')).toBe(-5);
    expect(daysBetween('2026-02-15', '2026-02-15')).toBe(0);
  });
});

describe('computeCompliance', () => {
  const base = { periodYear: 2026, periodMonth: 1, config }; // due 2026-02-15

  it('on-time: submitted before the deadline', () => {
    const r = computeCompliance({ ...base, submittedAt: '2026-02-10', now: '2026-02-20' });
    expect(r.status).toBe(ComplianceStatus.ON_TIME);
    expect(r.dueDate).toBe('2026-02-15');
    expect(r.daysRemaining).toBeNull();
  });

  it('on-time: submitted exactly on the deadline', () => {
    const r = computeCompliance({ ...base, submittedAt: '2026-02-15', now: '2026-02-16' });
    expect(r.status).toBe(ComplianceStatus.ON_TIME);
  });

  it('late: submitted after the deadline', () => {
    const r = computeCompliance({ ...base, submittedAt: '2026-02-18', now: '2026-02-20' });
    expect(r.status).toBe(ComplianceStatus.LATE);
    expect(r.daysRemaining).toBeNull();
  });

  it('not_due: no submission and deadline still ahead', () => {
    const r = computeCompliance({ ...base, submittedAt: null, now: '2026-02-10' });
    expect(r.status).toBe(ComplianceStatus.NOT_DUE);
    expect(r.daysRemaining).toBe(5);
  });

  it('overdue: past deadline but within grace, not submitted', () => {
    const r = computeCompliance({ ...base, submittedAt: null, now: '2026-02-18' });
    expect(r.status).toBe(ComplianceStatus.OVERDUE);
    expect(r.daysRemaining).toBe(-3);
  });

  it('overdue: on the last grace day', () => {
    const r = computeCompliance({ ...base, submittedAt: null, now: '2026-02-20' });
    expect(r.status).toBe(ComplianceStatus.OVERDUE);
  });

  it('missing: past deadline and past grace, not submitted', () => {
    const r = computeCompliance({ ...base, submittedAt: null, now: '2026-02-21' });
    expect(r.status).toBe(ComplianceStatus.MISSING);
    expect(r.daysRemaining).toBeLessThan(0);
  });
});

describe('computeComplianceForPeriods', () => {
  it('maps each period independently', () => {
    const results = computeComplianceForPeriods(
      [
        { periodYear: 2026, periodMonth: 1, submittedAt: '2026-02-10' }, // on-time
        { periodYear: 2026, periodMonth: 2, submittedAt: null }, // due 2026-03-15
      ],
      config,
      '2026-04-01',
    );
    expect(results[0].status).toBe(ComplianceStatus.ON_TIME);
    expect(results[1].status).toBe(ComplianceStatus.MISSING);
  });
});
