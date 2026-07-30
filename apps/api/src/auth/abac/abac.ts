import {
  AbacAction,
  AbacAttributes,
  AbacDecision,
  SegregationOfDutiesViolation,
} from '@velar/types';

const REPORT_DECISION_ACTIONS: readonly AbacAction[] = [
  AbacAction.REVIEW_REPORT,
  AbacAction.APPROVE_REPORT,
  AbacAction.SECOND_APPROVE_REPORT,
];

/**
 * Pure ABAC policy evaluator for the TSE compliance command center.
 * Zero framework dependencies — fully unit-testable in isolation.
 *
 * Evaluation order:
 * 1. admin → always allowed (escape hatch)
 * 2. non-tse → denied
 * 3. BACKTEST_RULES → admin only
 * 4. SECOND_APPROVE_REPORT → SoD: priorApprover ≠ actor
 * 5. report-decision actions → assigned-reviewer boundary
 * 6. otherwise → authorized
 */
export function evaluateAbac(attrs: AbacAttributes, action: AbacAction): AbacDecision {
  if (attrs.role === 'admin') {
    return { allowed: true, reason: 'admin_bypass' };
  }

  if (attrs.role !== 'tse') {
    return { allowed: false, reason: 'role_not_authorized' };
  }

  if (action === AbacAction.BACKTEST_RULES) {
    return { allowed: false, reason: 'backtest_requires_admin' };
  }

  if (
    action === AbacAction.SECOND_APPROVE_REPORT &&
    attrs.priorApproverId === attrs.userId
  ) {
    return { allowed: false, reason: 'segregation_of_duties_same_approver' };
  }

  if (
    REPORT_DECISION_ACTIONS.includes(action) &&
    attrs.assignedReviewerId &&
    attrs.assignedReviewerId !== attrs.userId
  ) {
    return { allowed: false, reason: 'assigned_to_other_reviewer' };
  }

  return { allowed: true, reason: 'authorized' };
}

/**
 * Dual-control SoD check: first and second approver must be distinct.
 * Returns a violation object when they are the same person, otherwise null.
 */
export function checkSegregationOfDuties(
  firstApproverId: string,
  secondApproverId: string,
): SegregationOfDutiesViolation | null {
  if (firstApproverId === secondApproverId) {
    return {
      rule: 'distinct_approvers',
      message:
        'El segundo aprobador debe ser distinto del primer aprobador (segregación de funciones).',
    };
  }
  return null;
}
