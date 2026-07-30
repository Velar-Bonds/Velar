import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AbacAction, AbacAttributes, Role } from '@velar/types';
import { AbacService } from './abac.service';

function attrs(
  overrides: Partial<AbacAttributes> & Pick<AbacAttributes, 'role'>,
): AbacAttributes {
  return {
    userId: 'user-a',
    assignedReviewerId: null,
    priorApproverId: null,
    ...overrides,
  };
}

describe('AbacService', () => {
  let service: AbacService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AbacService],
    }).compile();
    service = module.get(AbacService);
  });

  it('evaluate delegates to evaluateAbac', () => {
    expect(service.evaluate(attrs({ role: Role.TSE }), AbacAction.VIEW_ANALYTICS)).toEqual({
      allowed: true,
      reason: 'authorized',
    });
    expect(
      service.evaluate(attrs({ role: Role.EMISOR }), AbacAction.VIEW_ANALYTICS),
    ).toEqual({ allowed: false, reason: 'role_not_authorized' });
    expect(
      service.evaluate(attrs({ role: Role.ADMIN }), AbacAction.BACKTEST_RULES),
    ).toEqual({ allowed: true, reason: 'admin_bypass' });
  });

  it('assertAllowed does not throw when allowed', () => {
    expect(() =>
      service.assertAllowed(attrs({ role: Role.TSE }), AbacAction.REVIEW_REPORT),
    ).not.toThrow();
    expect(() =>
      service.assertAllowed(attrs({ role: Role.ADMIN }), AbacAction.BACKTEST_RULES),
    ).not.toThrow();
  });

  it('assertAllowed throws ForbiddenException when denied', () => {
    expect(() =>
      service.assertAllowed(attrs({ role: Role.EMISOR }), AbacAction.REVIEW_REPORT),
    ).toThrow(ForbiddenException);

    try {
      service.assertAllowed(
        attrs({ role: Role.TSE }),
        AbacAction.BACKTEST_RULES,
      );
      fail('expected ForbiddenException');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
      expect((err as ForbiddenException).message).toContain('backtest_requires_admin');
    }
  });

  it('assertAllowed includes decision reason in the exception message', () => {
    expect(() =>
      service.assertAllowed(
        attrs({
          role: Role.TSE,
          userId: 'user-a',
          priorApproverId: 'user-a',
        }),
        AbacAction.SECOND_APPROVE_REPORT,
      ),
    ).toThrow(/segregation_of_duties_same_approver/);
  });
});
