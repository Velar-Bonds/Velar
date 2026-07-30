import * as fc from 'fast-check';
import {
  AbacAction,
  AbacAttributes,
  ALL_ROLES,
  Role,
} from '@velar/types';
import { checkSegregationOfDuties, evaluateAbac } from './abac';

const ALL_ACTIONS = Object.values(AbacAction) as AbacAction[];

const USER_A = 'user-a';
const USER_B = 'user-b';

function attrs(
  overrides: Partial<AbacAttributes> & Pick<AbacAttributes, 'role'>,
): AbacAttributes {
  return {
    userId: USER_A,
    assignedReviewerId: null,
    priorApproverId: null,
    ...overrides,
  };
}

describe('evaluateAbac — role × action matrix', () => {
  for (const role of ALL_ROLES) {
    for (const action of ALL_ACTIONS) {
      it(`${role} × ${action}`, () => {
        const decision = evaluateAbac(attrs({ role }), action);

        if (role === Role.ADMIN) {
          expect(decision).toEqual({ allowed: true, reason: 'admin_bypass' });
          return;
        }

        if (role !== Role.TSE) {
          expect(decision).toEqual({
            allowed: false,
            reason: 'role_not_authorized',
          });
          return;
        }

        // tse
        if (action === AbacAction.BACKTEST_RULES) {
          expect(decision).toEqual({
            allowed: false,
            reason: 'backtest_requires_admin',
          });
          return;
        }

        expect(decision).toEqual({ allowed: true, reason: 'authorized' });
      });
    }
  }
});

describe('evaluateAbac — delegated-access boundary', () => {
  const decisionActions = [
    AbacAction.REVIEW_REPORT,
    AbacAction.APPROVE_REPORT,
  ] as const;

  for (const action of decisionActions) {
    it(`assigned tse can ${action}`, () => {
      expect(
        evaluateAbac(
          attrs({ role: Role.TSE, userId: USER_A, assignedReviewerId: USER_A }),
          action,
        ),
      ).toEqual({ allowed: true, reason: 'authorized' });
    });

    it(`different tse cannot ${action} when assigned to another`, () => {
      expect(
        evaluateAbac(
          attrs({ role: Role.TSE, userId: USER_A, assignedReviewerId: USER_B }),
          action,
        ),
      ).toEqual({ allowed: false, reason: 'assigned_to_other_reviewer' });
    });

    it(`unassigned report is open to any tse for ${action}`, () => {
      expect(
        evaluateAbac(
          attrs({ role: Role.TSE, userId: USER_A, assignedReviewerId: null }),
          action,
        ),
      ).toEqual({ allowed: true, reason: 'authorized' });

      expect(
        evaluateAbac(
          attrs({
            role: Role.TSE,
            userId: USER_A,
            assignedReviewerId: undefined,
          }),
          action,
        ),
      ).toEqual({ allowed: true, reason: 'authorized' });
    });
  }

  it('SECOND_APPROVE_REPORT respects assigned-reviewer boundary', () => {
    expect(
      evaluateAbac(
        attrs({
          role: Role.TSE,
          userId: USER_A,
          assignedReviewerId: USER_B,
          priorApproverId: USER_B,
        }),
        AbacAction.SECOND_APPROVE_REPORT,
      ),
    ).toEqual({ allowed: false, reason: 'assigned_to_other_reviewer' });
  });
});

describe('evaluateAbac — segregation of duties', () => {
  it('denies SECOND_APPROVE_REPORT when priorApproverId === userId', () => {
    expect(
      evaluateAbac(
        attrs({
          role: Role.TSE,
          userId: USER_A,
          priorApproverId: USER_A,
        }),
        AbacAction.SECOND_APPROVE_REPORT,
      ),
    ).toEqual({
      allowed: false,
      reason: 'segregation_of_duties_same_approver',
    });
  });

  it('allows SECOND_APPROVE_REPORT when priorApproverId differs', () => {
    expect(
      evaluateAbac(
        attrs({
          role: Role.TSE,
          userId: USER_A,
          priorApproverId: USER_B,
        }),
        AbacAction.SECOND_APPROVE_REPORT,
      ),
    ).toEqual({ allowed: true, reason: 'authorized' });
  });

  it('SoD check runs before assigned-reviewer for same-approver case', () => {
    // Same user is prior approver AND assigned — SoD reason wins (rule 4 before 5)
    expect(
      evaluateAbac(
        attrs({
          role: Role.TSE,
          userId: USER_A,
          priorApproverId: USER_A,
          assignedReviewerId: USER_A,
        }),
        AbacAction.SECOND_APPROVE_REPORT,
      ),
    ).toEqual({
      allowed: false,
      reason: 'segregation_of_duties_same_approver',
    });
  });
});

describe('evaluateAbac — admin bypass', () => {
  it('admin is allowed regardless of assignment and priorApprover', () => {
    for (const action of ALL_ACTIONS) {
      expect(
        evaluateAbac(
          attrs({
            role: Role.ADMIN,
            userId: USER_A,
            assignedReviewerId: USER_B,
            priorApproverId: USER_A,
          }),
          action,
        ),
      ).toEqual({ allowed: true, reason: 'admin_bypass' });
    }
  });
});

describe('checkSegregationOfDuties', () => {
  it('returns null for distinct ids', () => {
    expect(checkSegregationOfDuties(USER_A, USER_B)).toBeNull();
  });

  it('returns violation for identical ids', () => {
    expect(checkSegregationOfDuties(USER_A, USER_A)).toEqual({
      rule: 'distinct_approvers',
      message: expect.stringContaining('segregación de funciones'),
    });
  });
});

describe('evaluateAbac — property tests', () => {
  const roleArb = fc.constantFrom(...ALL_ROLES);
  const actionArb = fc.constantFrom(...ALL_ACTIONS);
  const idArb = fc.option(fc.uuid(), { nil: null });
  const attrsArb = fc.record({
    role: roleArb,
    userId: fc.uuid(),
    assignedReviewerId: idArb,
    partyId: idArb,
    amount: fc.option(fc.nat({ max: 10_000_000 }), { nil: undefined }),
    priorApproverId: idArb,
  }) as fc.Arbitrary<AbacAttributes>;

  it('never throws (total function)', () => {
    fc.assert(
      fc.property(attrsArb, actionArb, (a, action) => {
        expect(() => evaluateAbac(a, action)).not.toThrow();
        const decision = evaluateAbac(a, action);
        expect(typeof decision.allowed).toBe('boolean');
        expect(typeof decision.reason).toBe('string');
      }),
    );
  });

  it('admin role always yields allowed: true', () => {
    fc.assert(
      fc.property(attrsArb, actionArb, (a, action) => {
        const decision = evaluateAbac({ ...a, role: Role.ADMIN }, action);
        expect(decision.allowed).toBe(true);
        expect(decision.reason).toBe('admin_bypass');
      }),
    );
  });
});
