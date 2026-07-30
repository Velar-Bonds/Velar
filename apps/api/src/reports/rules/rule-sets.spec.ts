import {
  DEFAULT_RULE_SET_VERSION,
  getRuleSet,
  listRuleSetVersions,
  RULE_SETS,
} from './rule-sets';

describe('rule-sets registry', () => {
  it('exposes v1 and v2', () => {
    expect(Object.keys(RULE_SETS).sort()).toEqual(['v1', 'v2']);
    expect(listRuleSetVersions().sort()).toEqual(['v1', 'v2']);
  });

  it('defaults to v1', () => {
    expect(DEFAULT_RULE_SET_VERSION).toBe('v1');
  });

  it('v2 is stricter than v1 on amount-mismatch bands', () => {
    const v1 = getRuleSet('v1');
    const v2 = getRuleSet('v2');
    expect(v2.amountMismatchBands.low).toBeLessThan(v1.amountMismatchBands.low);
    expect(v2.amountMismatchBands.medium).toBeLessThan(v1.amountMismatchBands.medium);
    expect(v2.amountMismatchBands.high).toBeLessThan(v1.amountMismatchBands.high);
  });

  it('v2 has a lower thresholdBreachAmount than v1', () => {
    expect(getRuleSet('v2').thresholdBreachAmount).toBeLessThan(
      getRuleSet('v1').thresholdBreachAmount,
    );
    expect(getRuleSet('v1').thresholdBreachAmount).toBe(5_000_000);
    expect(getRuleSet('v2').thresholdBreachAmount).toBe(3_000_000);
  });

  it('getRuleSet returns the definition for a known version', () => {
    expect(getRuleSet('v1').version).toBe('v1');
    expect(getRuleSet('v2').amountMismatchBands).toEqual({
      low: 0.05,
      medium: 0.15,
      high: 0.4,
    });
  });

  it('getRuleSet throws for an unknown version', () => {
    expect(() => getRuleSet('v99')).toThrow(/Unknown rule-set version/);
  });
});
