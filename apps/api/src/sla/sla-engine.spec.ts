import {
  ComplianceStatus,
  EscalationLevel,
  EscalationLadderStep,
  PeriodCompliance,
} from '@velar/types';
import {
  checkEscalation,
  computeTargetLevel,
  levelRank,
} from './sla-engine';

const DEFAULT_LADDER: EscalationLadderStep[] = [
  { level: EscalationLevel.LEVEL_1, afterDays: 3, notify: ['tse'] },
  { level: EscalationLevel.LEVEL_2, afterDays: 7, notify: ['tse', 'admin'] },
  { level: EscalationLevel.LEVEL_3, afterDays: 14, notify: ['admin'] },
];

function compliance(
  overrides: Partial<PeriodCompliance> = {},
): PeriodCompliance {
  return {
    periodYear: 2026,
    periodMonth: 1,
    dueDate: '2026-02-15',
    status: ComplianceStatus.OVERDUE,
    daysRemaining: -5,
    submittedAt: null,
    ...overrides,
  };
}

describe('levelRank', () => {
  it('orders escalation levels ascending', () => {
    expect(levelRank(EscalationLevel.NONE)).toBe(0);
    expect(levelRank(EscalationLevel.LEVEL_1)).toBe(1);
    expect(levelRank(EscalationLevel.LEVEL_2)).toBe(2);
    expect(levelRank(EscalationLevel.LEVEL_3)).toBe(3);
  });
});

describe('computeTargetLevel', () => {
  it('returns NONE for not_due, on_time, and late', () => {
    for (const status of [
      ComplianceStatus.NOT_DUE,
      ComplianceStatus.ON_TIME,
      ComplianceStatus.LATE,
    ]) {
      expect(
        computeTargetLevel(
          compliance({ status, daysRemaining: status === ComplianceStatus.NOT_DUE ? 2 : null }),
          DEFAULT_LADDER,
        ),
      ).toBe(EscalationLevel.NONE);
    }
  });

  it('returns NONE when overdue but daysOverdue is below the first step', () => {
    expect(
      computeTargetLevel(
        compliance({ status: ComplianceStatus.OVERDUE, daysRemaining: -2 }),
        DEFAULT_LADDER,
      ),
    ).toBe(EscalationLevel.NONE);
  });

  it('returns NONE for empty ladder regardless of overdue severity', () => {
    expect(
      computeTargetLevel(
        compliance({ status: ComplianceStatus.MISSING, daysRemaining: -30 }),
        [],
      ),
    ).toBe(EscalationLevel.NONE);
  });

  it('selects level_1 at the boundary afterDays value', () => {
    expect(
      computeTargetLevel(
        compliance({ daysRemaining: -3 }),
        DEFAULT_LADDER,
      ),
    ).toBe(EscalationLevel.LEVEL_1);
  });

  it('selects level_2 between level_1 and level_3 thresholds', () => {
    expect(
      computeTargetLevel(
        compliance({ daysRemaining: -10 }),
        DEFAULT_LADDER,
      ),
    ).toBe(EscalationLevel.LEVEL_2);
  });

  it('selects level_3 at and beyond the highest step', () => {
    expect(
      computeTargetLevel(
        compliance({ daysRemaining: -14 }),
        DEFAULT_LADDER,
      ),
    ).toBe(EscalationLevel.LEVEL_3);
    expect(
      computeTargetLevel(
        compliance({ status: ComplianceStatus.MISSING, daysRemaining: -100 }),
        DEFAULT_LADDER,
      ),
    ).toBe(EscalationLevel.LEVEL_3);
  });

  it('treats null daysRemaining as zero days overdue', () => {
    expect(
      computeTargetLevel(
        compliance({ status: ComplianceStatus.OVERDUE, daysRemaining: null }),
        DEFAULT_LADDER,
      ),
    ).toBe(EscalationLevel.NONE);
  });

  it('handles a single-step ladder', () => {
    const ladder: EscalationLadderStep[] = [
      { level: EscalationLevel.LEVEL_2, afterDays: 5, notify: ['admin'] },
    ];
    expect(
      computeTargetLevel(compliance({ daysRemaining: -4 }), ladder),
    ).toBe(EscalationLevel.NONE);
    expect(
      computeTargetLevel(compliance({ daysRemaining: -5 }), ladder),
    ).toBe(EscalationLevel.LEVEL_2);
  });

  it('sorts an out-of-order ladder array before matching', () => {
    const shuffled: EscalationLadderStep[] = [
      { level: EscalationLevel.LEVEL_3, afterDays: 14, notify: ['admin'] },
      { level: EscalationLevel.LEVEL_1, afterDays: 3, notify: ['tse'] },
      { level: EscalationLevel.LEVEL_2, afterDays: 7, notify: ['tse', 'admin'] },
    ];
    expect(
      computeTargetLevel(compliance({ daysRemaining: -8 }), shuffled),
    ).toBe(EscalationLevel.LEVEL_2);
  });
});

describe('checkEscalation', () => {
  const reportId = 'rep-001';

  it('does not escalate when target equals current level (idempotent)', () => {
    const result = checkEscalation(
      reportId,
      compliance({ daysRemaining: -10 }),
      DEFAULT_LADDER,
      EscalationLevel.LEVEL_2,
    );
    expect(result).toEqual({
      reportId,
      previousLevel: EscalationLevel.LEVEL_2,
      newLevel: EscalationLevel.LEVEL_2,
      escalated: false,
      notified: [],
    });
  });

  it('re-running with resulting newLevel as currentLevel never re-escalates', () => {
    const first = checkEscalation(
      reportId,
      compliance({ daysRemaining: -5 }),
      DEFAULT_LADDER,
      EscalationLevel.NONE,
    );
    expect(first.escalated).toBe(true);
    expect(first.newLevel).toBe(EscalationLevel.LEVEL_1);

    const second = checkEscalation(
      reportId,
      compliance({ daysRemaining: -5 }),
      DEFAULT_LADDER,
      first.newLevel,
    );
    expect(second.escalated).toBe(false);
    expect(second.newLevel).toBe(EscalationLevel.LEVEL_1);
    expect(second.notified).toEqual([]);
  });

  it('never de-escalates when compliance improves but current level is higher', () => {
    const result = checkEscalation(
      reportId,
      compliance({ status: ComplianceStatus.NOT_DUE, daysRemaining: 5 }),
      DEFAULT_LADDER,
      EscalationLevel.LEVEL_3,
    );
    expect(result.escalated).toBe(false);
    expect(result.newLevel).toBe(EscalationLevel.LEVEL_3);
    expect(result.notified).toEqual([]);
  });

  it('escalates stepwise and notifies matching roles exactly', () => {
    const toLevel1 = checkEscalation(
      reportId,
      compliance({ daysRemaining: -3 }),
      DEFAULT_LADDER,
      EscalationLevel.NONE,
    );
    expect(toLevel1.escalated).toBe(true);
    expect(toLevel1.newLevel).toBe(EscalationLevel.LEVEL_1);
    expect(toLevel1.notified).toEqual(['tse']);

    const toLevel2 = checkEscalation(
      reportId,
      compliance({ daysRemaining: -8 }),
      DEFAULT_LADDER,
      EscalationLevel.LEVEL_1,
    );
    expect(toLevel2.escalated).toBe(true);
    expect(toLevel2.newLevel).toBe(EscalationLevel.LEVEL_2);
    expect(toLevel2.notified).toEqual(['tse', 'admin']);

    const toLevel3 = checkEscalation(
      reportId,
      compliance({ daysRemaining: -20 }),
      DEFAULT_LADDER,
      EscalationLevel.LEVEL_2,
    );
    expect(toLevel3.escalated).toBe(true);
    expect(toLevel3.newLevel).toBe(EscalationLevel.LEVEL_3);
    expect(toLevel3.notified).toEqual(['admin']);
  });

  it('does not escalate with an empty ladder', () => {
    const result = checkEscalation(
      reportId,
      compliance({ status: ComplianceStatus.MISSING, daysRemaining: -50 }),
      [],
      EscalationLevel.NONE,
    );
    expect(result.escalated).toBe(false);
    expect(result.newLevel).toBe(EscalationLevel.NONE);
    expect(result.notified).toEqual([]);
  });

  it('does not escalate when status is not overdue or missing', () => {
    const result = checkEscalation(
      reportId,
      compliance({ status: ComplianceStatus.ON_TIME, daysRemaining: null }),
      DEFAULT_LADDER,
      EscalationLevel.NONE,
    );
    expect(result.escalated).toBe(false);
    expect(result.newLevel).toBe(EscalationLevel.NONE);
  });
});
