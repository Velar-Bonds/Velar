import { ComplianceForecast, ComplianceForecastPoint } from '@velar/types';

export interface OverdueHistoryPoint {
  periodYear: number;
  periodMonth: number;
  overdueCount: number;
}

function comparePeriod(
  a: Pick<OverdueHistoryPoint, 'periodYear' | 'periodMonth'>,
  b: Pick<OverdueHistoryPoint, 'periodYear' | 'periodMonth'>,
): number {
  if (a.periodYear !== b.periodYear) return a.periodYear - b.periodYear;
  return a.periodMonth - b.periodMonth;
}

function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  let y = year;
  let m = month + delta;
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  return { year: y, month: m };
}

function clampNonNegativeRound(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function movingAverage(history: OverdueHistoryPoint[]): number {
  if (history.length === 0) return 0;
  const window = history.slice(-Math.min(3, history.length));
  const sum = window.reduce((acc, p) => acc + p.overdueCount, 0);
  return sum / window.length;
}

function linearTrendProject(
  history: OverdueHistoryPoint[],
  horizonMonths: number,
): number[] {
  const n = history.length;
  if (n === 0) {
    return Array.from({ length: horizonMonths }, () => 0);
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i += 1) {
    const y = history[i].overdueCount;
    sumX += i;
    sumY += y;
    sumXY += i * y;
    sumX2 += i * i;
  }

  const denom = n * sumX2 - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;

  const projections: number[] = [];
  for (let step = 1; step <= horizonMonths; step += 1) {
    const index = n - 1 + step;
    projections.push(clampNonNegativeRound(slope * index + intercept));
  }
  return projections;
}

export function forecastOverdue(
  history: OverdueHistoryPoint[],
  horizonMonths: number,
  anchorYear: number,
  anchorMonth: number,
): ComplianceForecast {
  const sorted = [...history].sort(comparePeriod);
  const method: ComplianceForecast['method'] =
    sorted.length >= 3 ? 'linear_trend' : 'moving_average';

  const projectedValues =
    method === 'linear_trend'
      ? linearTrendProject(sorted, horizonMonths)
      : Array.from({ length: horizonMonths }, () =>
          clampNonNegativeRound(movingAverage(sorted)),
        );

  const points: ComplianceForecastPoint[] = projectedValues.map(
    (projectedOverdue, i) => {
      const { year, month } = addMonths(anchorYear, anchorMonth, i + 1);
      return { periodYear: year, periodMonth: month, projectedOverdue };
    },
  );

  return { method, horizonMonths, points };
}
