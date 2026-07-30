import type { AlertRule, AnalyticsInput } from '@velar/types';
import { analyticsFixture } from '@velar/types';
import { evaluateAlertRules } from './alerts';
import { buildAnalyticsSnapshot } from './index';

const clone = (input: AnalyticsInput): AnalyticsInput => JSON.parse(JSON.stringify(input));
const FIXED_NOW = new Date('2026-07-01T00:00:00.000Z');

function makeRule(over: Partial<AlertRule>): AlertRule {
  return {
    id: 'rule-1',
    name: 'Test rule',
    metricPath: 'valueVolume.totalVolumeMoved',
    comparator: 'gt',
    threshold: 0,
    scope: { kind: 'all' },
    notifyUserIds: [],
    createdAt: FIXED_NOW.toISOString(),
    updatedAt: FIXED_NOW.toISOString(),
    ...over,
  };
}

describe('evaluateAlertRules', () => {
  const snapshot = buildAnalyticsSnapshot(clone(analyticsFixture), {}, { kind: 'all' }, FIXED_NOW);
  // snapshot.valueVolume.totalVolumeMoved === 7_500_000, totalBonds === 7 (see aggregations.spec.ts)

  it('reports a breach when the metric exceeds the threshold (gt)', () => {
    const rule = makeRule({ metricPath: 'valueVolume.totalVolumeMoved', comparator: 'gt', threshold: 5_000_000 });
    const breaches = evaluateAlertRules(snapshot, [rule], FIXED_NOW);
    expect(breaches).toEqual([
      {
        ruleId: 'rule-1',
        ruleName: 'Test rule',
        metricPath: 'valueVolume.totalVolumeMoved',
        value: 7_500_000,
        threshold: 5_000_000,
        comparator: 'gt',
        at: FIXED_NOW.toISOString(),
      },
    ]);
  });

  it('does not breach when the condition is not met', () => {
    const rule = makeRule({ metricPath: 'valueVolume.totalVolumeMoved', comparator: 'gt', threshold: 100_000_000 });
    expect(evaluateAlertRules(snapshot, [rule], FIXED_NOW)).toEqual([]);
  });

  it.each([
    ['lt', 10, true],
    ['lt', 5, false],
    ['gte', 7, true],
    ['gte', 8, false],
    ['lte', 7, true],
    ['lte', 6, false],
  ] as const)('comparator %s with threshold %d on totalBonds=7 breaches=%s', (comparator, threshold, expected) => {
    const rule = makeRule({ metricPath: 'valueVolume.totalBonds', comparator, threshold });
    const breaches = evaluateAlertRules(snapshot, [rule], FIXED_NOW);
    expect(breaches.length > 0).toBe(expected);
  });

  it('skips rules whose metric path does not resolve to a number, without throwing', () => {
    const rule = makeRule({ metricPath: 'valueVolume.doesNotExist' });
    expect(() => evaluateAlertRules(snapshot, [rule], FIXED_NOW)).not.toThrow();
    expect(evaluateAlertRules(snapshot, [rule], FIXED_NOW)).toEqual([]);
  });

  it('empty rule list yields no breaches', () => {
    expect(evaluateAlertRules(snapshot, [], FIXED_NOW)).toEqual([]);
  });

  it('evaluates multiple rules independently', () => {
    const rules = [
      makeRule({ id: 'r1', metricPath: 'valueVolume.totalBonds', comparator: 'gt', threshold: 1 }),
      makeRule({ id: 'r2', metricPath: 'valueVolume.totalBonds', comparator: 'gt', threshold: 100 }),
    ];
    const breaches = evaluateAlertRules(snapshot, rules, FIXED_NOW);
    expect(breaches.map((b) => b.ruleId)).toEqual(['r1']);
  });
});
