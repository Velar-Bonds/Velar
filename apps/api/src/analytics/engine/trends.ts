import type { MovingAveragePoint, TimeSeriesPoint, TopNEntry, TrendDelta } from '@velar/types';
import { round2 } from './util';

/** Generic trend/analysis helpers (issue #44). Pure, reusable across metrics. */

export function periodOverPeriodDelta(current: number, previous: number): TrendDelta {
  const deltaAbs = current - previous;
  const deltaPct = previous !== 0 ? round2((deltaAbs / previous) * 100) : null;
  return { current, previous, deltaAbs, deltaPct };
}

/** Trailing moving average; windows shorter than `windowSize` at the series start use what's available. */
export function movingAverage(series: TimeSeriesPoint[], windowSize: number): MovingAveragePoint[] {
  if (windowSize <= 0) throw new Error('windowSize debe ser mayor a 0');
  return series.map((point, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const window = series.slice(start, i + 1);
    const average = window.reduce((s, p) => s + p.value, 0) / window.length;
    return { bucketStart: point.bucketStart, average: round2(average) };
  });
}

export function topN<T>(
  items: T[],
  keyOf: (item: T) => string,
  labelOf: (item: T) => string,
  valueOf: (item: T) => number,
  n: number,
): TopNEntry[] {
  return [...items]
    .map((item) => ({ key: keyOf(item), label: labelOf(item), value: valueOf(item) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

/** Simple threshold anomaly detection: points whose value exceeds `threshold`. */
export function detectThresholdAnomalies(series: TimeSeriesPoint[], threshold: number): TimeSeriesPoint[] {
  return series.filter((p) => p.value > threshold);
}
