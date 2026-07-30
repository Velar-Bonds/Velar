import type { ComplianceSummary, DeadlineConfig, MonthlyReport, PartyComplianceSummary } from '@velar/types';
import { computeComplianceForPeriods } from '../../reports/domain/deadlines';

/**
 * Compliance metrics adapter (issue #44). Reuses the existing pure
 * `computeComplianceForPeriods` engine (apps/api/src/reports/domain/deadlines.ts)
 * — does not reimplement deadline/grace logic. Parties with zero reports in
 * the input simply do not appear (there is no "expected period" concept
 * without a report to anchor it).
 */
export function computeComplianceSummary(
  reports: MonthlyReport[],
  config: DeadlineConfig,
  now: string,
): ComplianceSummary {
  const partyIds = [...new Set(reports.map((r) => r.partyId))];

  const parties: PartyComplianceSummary[] = partyIds.map((partyId) => {
    const partyReports = reports.filter((r) => r.partyId === partyId);
    const periods = computeComplianceForPeriods(
      partyReports.map((r) => ({
        periodYear: r.periodYear,
        periodMonth: r.periodMonth,
        submittedAt: r.submittedAt,
      })),
      config,
      now,
    );
    return {
      partyId,
      periods,
      onTimeCount: periods.filter((p) => p.status === 'on_time').length,
      lateCount: periods.filter((p) => p.status === 'late').length,
      overdueCount: periods.filter((p) => p.status === 'overdue').length,
      missingCount: periods.filter((p) => p.status === 'missing').length,
    };
  });

  return { parties };
}
