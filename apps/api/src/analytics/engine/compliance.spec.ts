import type { AnalyticsInput, DeadlineConfig } from '@velar/types';
import { analyticsFixture, analyticsFixtureIds, analyticsFixtureNow } from '@velar/types';
import { computeComplianceSummary } from './compliance';

const clone = (input: AnalyticsInput): AnalyticsInput => JSON.parse(JSON.stringify(input));
const ids = analyticsFixtureIds;
const config: DeadlineConfig = { dueDayOfMonth: 15, graceDays: 5 };

describe('computeComplianceSummary', () => {
  it('summarizes on-time/late/missing periods per party over the fixture', () => {
    const { reports } = clone(analyticsFixture);
    const summary = computeComplianceSummary(reports, config, analyticsFixtureNow);

    // Avanza has zero reports in the fixture, so it has no expected periods to
    // anchor a compliance computation and simply does not appear.
    expect(summary.parties.map((p) => p.partyId).sort()).toEqual(
      [ids.parties.libertad, ids.parties.renovacion].sort(),
    );

    const libertad = summary.parties.find((p) => p.partyId === ids.parties.libertad)!;
    expect(libertad.periods).toHaveLength(3);
    expect(libertad).toMatchObject({ onTimeCount: 1, lateCount: 1, overdueCount: 0, missingCount: 1 });

    const renovacion = summary.parties.find((p) => p.partyId === ids.parties.renovacion)!;
    expect(renovacion.periods).toHaveLength(1);
    expect(renovacion).toMatchObject({ onTimeCount: 1, lateCount: 0, overdueCount: 0, missingCount: 0 });
  });

  it('no reports at all yields no parties', () => {
    expect(computeComplianceSummary([], config, analyticsFixtureNow)).toEqual({ parties: [] });
  });

  it('a single sparse period is summarized correctly', () => {
    const { reports } = clone(analyticsFixture);
    const single = reports.filter((r) => r.id === 'report-renovacion-2026-01');
    const summary = computeComplianceSummary(single, config, analyticsFixtureNow);
    expect(summary.parties).toHaveLength(1);
    expect(summary.parties[0].periods).toHaveLength(1);
    expect(summary.parties[0].onTimeCount).toBe(1);
  });
});
