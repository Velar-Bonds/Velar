import type { TimeSeriesPoint } from '@velar/types';
import { detectThresholdAnomalies, movingAverage, periodOverPeriodDelta, topN } from './trends';

describe('periodOverPeriodDelta', () => {
  it('computes absolute and percentage change', () => {
    expect(periodOverPeriodDelta(120, 100)).toEqual({ current: 120, previous: 100, deltaAbs: 20, deltaPct: 20 });
  });

  it('handles a decrease', () => {
    expect(periodOverPeriodDelta(80, 100)).toEqual({ current: 80, previous: 100, deltaAbs: -20, deltaPct: -20 });
  });

  it('deltaPct is null when previous is 0 (undefined percentage change)', () => {
    expect(periodOverPeriodDelta(50, 0)).toEqual({ current: 50, previous: 0, deltaAbs: 50, deltaPct: null });
  });
});

describe('movingAverage', () => {
  const series: TimeSeriesPoint[] = [10, 20, 30, 40].map((value, i) => ({
    bucketStart: `2026-01-0${i + 1}`,
    value,
    count: 1,
  }));

  it('computes a trailing average with a normal window', () => {
    expect(movingAverage(series, 2).map((p) => p.average)).toEqual([10, 15, 25, 35]);
  });

  it('a window larger than the series just averages what is available (cumulative)', () => {
    expect(movingAverage(series, 10).map((p) => p.average)).toEqual([10, 15, 20, 25]);
  });

  it('empty series yields no points', () => {
    expect(movingAverage([], 3)).toEqual([]);
  });

  it('throws on a non-positive window size', () => {
    expect(() => movingAverage(series, 0)).toThrow();
  });
});

describe('topN', () => {
  const items = [
    { id: 'a', name: 'A', v: 10 },
    { id: 'b', name: 'B', v: 30 },
    { id: 'c', name: 'C', v: 20 },
  ];

  it('returns the top N sorted descending by value', () => {
    const result = topN(items, (i) => i.id, (i) => i.name, (i) => i.v, 2);
    expect(result).toEqual([
      { key: 'b', label: 'B', value: 30 },
      { key: 'c', label: 'C', value: 20 },
    ]);
  });

  it('n larger than the item count returns everything', () => {
    expect(topN(items, (i) => i.id, (i) => i.name, (i) => i.v, 10)).toHaveLength(3);
  });

  it('empty input yields an empty result', () => {
    expect(topN([], (i: never) => '', (i: never) => '', (i: never) => 0, 5)).toEqual([]);
  });
});

describe('detectThresholdAnomalies', () => {
  const series: TimeSeriesPoint[] = [
    { bucketStart: '2026-01-01', value: 5, count: 1 },
    { bucketStart: '2026-01-02', value: 15, count: 1 },
    { bucketStart: '2026-01-03', value: 25, count: 1 },
  ];

  it('flags points strictly above the threshold', () => {
    expect(detectThresholdAnomalies(series, 10)).toEqual([series[1], series[2]]);
  });

  it('empty series yields no anomalies', () => {
    expect(detectThresholdAnomalies([], 10)).toEqual([]);
  });

  it('a threshold above every value yields no anomalies', () => {
    expect(detectThresholdAnomalies(series, 100)).toEqual([]);
  });
});
