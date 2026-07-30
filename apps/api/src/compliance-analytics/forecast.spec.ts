import { forecastOverdue } from './forecast';

describe('forecastOverdue', () => {
  it('uses moving_average with empty history and projects from anchor', () => {
    const result = forecastOverdue([], 2, 2026, 6);
    expect(result.method).toBe('moving_average');
    expect(result.horizonMonths).toBe(2);
    expect(result.points).toEqual([
      { periodYear: 2026, periodMonth: 7, projectedOverdue: 0 },
      { periodYear: 2026, periodMonth: 8, projectedOverdue: 0 },
    ]);
  });

  it('uses moving_average for 1-2 history points', () => {
    const result = forecastOverdue(
      [{ periodYear: 2026, periodMonth: 1, overdueCount: 4 }],
      1,
      2026,
      3,
    );
    expect(result.method).toBe('moving_average');
    expect(result.points[0].projectedOverdue).toBe(4);
  });

  it('uses linear_trend for 3+ history points', () => {
    const history = [
      { periodYear: 2026, periodMonth: 1, overdueCount: 2 },
      { periodYear: 2026, periodMonth: 2, overdueCount: 4 },
      { periodYear: 2026, periodMonth: 3, overdueCount: 6 },
    ];
    const result = forecastOverdue(history, 2, 2026, 3);
    expect(result.method).toBe('linear_trend');
    expect(result.points).toHaveLength(2);
    expect(result.points[0].projectedOverdue).toBeGreaterThanOrEqual(0);
    expect(result.points[1].projectedOverdue).toBeGreaterThanOrEqual(0);
  });

  it('sorts unsorted history before forecasting', () => {
    const history = [
      { periodYear: 2026, periodMonth: 3, overdueCount: 6 },
      { periodYear: 2026, periodMonth: 1, overdueCount: 2 },
      { periodYear: 2026, periodMonth: 2, overdueCount: 4 },
    ];
    const result = forecastOverdue(history, 1, 2026, 3);
    expect(result.method).toBe('linear_trend');
    expect(result.points[0].projectedOverdue).toBe(8);
  });

  it('rolls December to January when projecting from anchor', () => {
    const result = forecastOverdue(
      [{ periodYear: 2025, periodMonth: 11, overdueCount: 1 }],
      2,
      2025,
      12,
    );
    expect(result.points[0]).toMatchObject({
      periodYear: 2026,
      periodMonth: 1,
      projectedOverdue: 1,
    });
    expect(result.points[1]).toMatchObject({
      periodYear: 2026,
      periodMonth: 2,
      projectedOverdue: 1,
    });
  });
});
