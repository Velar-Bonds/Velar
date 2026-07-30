import {
  ComplianceOverview,
  ComplianceStatus,
  PartyComplianceMetric,
  PeriodCompliance,
  ReviewerWorkload,
} from '@velar/types';

function countByStatus(compliances: PeriodCompliance[]) {
  let onTimeCount = 0;
  let lateCount = 0;
  let overdueCount = 0;
  let missingCount = 0;
  let notDueCount = 0;

  for (const c of compliances) {
    switch (c.status) {
      case ComplianceStatus.ON_TIME:
        onTimeCount += 1;
        break;
      case ComplianceStatus.LATE:
        lateCount += 1;
        break;
      case ComplianceStatus.OVERDUE:
        overdueCount += 1;
        break;
      case ComplianceStatus.MISSING:
        missingCount += 1;
        break;
      case ComplianceStatus.NOT_DUE:
        notDueCount += 1;
        break;
    }
  }

  return { onTimeCount, lateCount, overdueCount, missingCount, notDueCount };
}

function safeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  const rate = numerator / denominator;
  return Number.isFinite(rate) ? rate : 0;
}

export function computePartyComplianceMetric(
  partyId: string,
  partyName: string,
  compliances: PeriodCompliance[],
): PartyComplianceMetric {
  const totalPeriods = compliances.length;
  const { onTimeCount, lateCount, overdueCount, missingCount, notDueCount } =
    countByStatus(compliances);
  const evaluated = totalPeriods - notDueCount;

  return {
    partyId,
    partyName,
    totalPeriods,
    onTimeCount,
    lateCount,
    overdueCount,
    missingCount,
    complianceRate: safeRate(onTimeCount, evaluated),
  };
}

export function computeComplianceOverview(
  compliances: PeriodCompliance[],
): ComplianceOverview {
  const totalReports = compliances.length;
  const { onTimeCount, overdueCount, missingCount, notDueCount } =
    countByStatus(compliances);
  const evaluated = totalReports - notDueCount;

  let atRiskCount = 0;
  for (const c of compliances) {
    if (c.status === ComplianceStatus.LATE) {
      atRiskCount += 1;
    } else if (
      c.status === ComplianceStatus.NOT_DUE &&
      c.daysRemaining !== null &&
      c.daysRemaining <= 3
    ) {
      atRiskCount += 1;
    }
  }

  return {
    totalReports,
    onTimeRate: safeRate(onTimeCount, evaluated),
    overdueCount,
    atRiskCount,
    missingCount,
  };
}

export interface ReviewerWorkloadInput {
  reviewerId: string;
  reviewerName: string;
  assignedCount: number;
  decisions: Array<{ startedAt: string; decidedAt: string }>;
  onTimeDecisions: number;
}

export function computeReviewerWorkload(
  input: ReviewerWorkloadInput,
): ReviewerWorkload {
  const decidedCount = input.decisions.length;
  let avgDecisionHours: number | null = null;

  if (decidedCount > 0) {
    const totalHours = input.decisions.reduce((sum, d) => {
      const ms =
        new Date(d.decidedAt).getTime() - new Date(d.startedAt).getTime();
      return sum + ms / 3_600_000;
    }, 0);
    const mean = totalHours / decidedCount;
    avgDecisionHours = Number.isFinite(mean) ? mean : null;
  }

  return {
    reviewerId: input.reviewerId,
    reviewerName: input.reviewerName,
    assignedCount: input.assignedCount,
    decidedCount,
    avgDecisionHours,
    slaAttainmentRate:
      decidedCount === 0 ? 1 : safeRate(input.onTimeDecisions, decidedCount),
  };
}
