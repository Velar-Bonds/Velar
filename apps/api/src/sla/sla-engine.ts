import {
  EscalationLadderStep,
  EscalationLevel,
  PeriodCompliance,
  SlaCheckResult,
} from '@velar/types';

const LEVEL_ORDER: EscalationLevel[] = [
  EscalationLevel.NONE,
  EscalationLevel.LEVEL_1,
  EscalationLevel.LEVEL_2,
  EscalationLevel.LEVEL_3,
];

export function levelRank(level: EscalationLevel): number {
  return LEVEL_ORDER.indexOf(level);
}

export function computeTargetLevel(
  compliance: PeriodCompliance,
  ladder: EscalationLadderStep[],
): EscalationLevel {
  if (compliance.status !== 'overdue' && compliance.status !== 'missing') {
    return EscalationLevel.NONE;
  }

  const daysOverdue =
    compliance.daysRemaining === null
      ? 0
      : Math.max(0, -compliance.daysRemaining);

  const sorted = [...ladder].sort((a, b) => a.afterDays - b.afterDays);
  let target: EscalationLevel = EscalationLevel.NONE;

  for (const step of sorted) {
    if (step.afterDays <= daysOverdue) {
      target = step.level;
    }
  }

  return target;
}

export function checkEscalation(
  reportId: string,
  compliance: PeriodCompliance,
  ladder: EscalationLadderStep[],
  currentLevel: EscalationLevel,
): SlaCheckResult {
  const targetLevel = computeTargetLevel(compliance, ladder);
  const escalated = levelRank(targetLevel) > levelRank(currentLevel);

  if (!escalated) {
    return {
      reportId,
      previousLevel: currentLevel,
      newLevel: currentLevel,
      escalated: false,
      notified: [],
    };
  }

  const step = ladder.find((s) => s.level === targetLevel);
  return {
    reportId,
    previousLevel: currentLevel,
    newLevel: targetLevel,
    escalated: true,
    notified: step?.notify ?? [],
  };
}
