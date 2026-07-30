import type { AnalyticsBucket, BondToken, TimeSeriesPoint, Transfer } from '@velar/types';
import { TERMINAL_TRANSFER_STATUSES } from '@velar/types';
import { daysBetweenIso } from './util';

/**
 * Time-series bucketing (issue #44). All bucketing is UTC-based, deterministic
 * and pure — no timezone/locale dependence, matching `reports/domain/deadlines.ts`'s
 * discipline.
 */

function startOfDayUtc(iso: string): number {
  const d = new Date(iso);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function startOfWeekUtc(iso: string): number {
  const dayStart = startOfDayUtc(iso);
  const d = new Date(dayStart);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? 6 : day - 1;
  return dayStart - diffToMonday * 86_400_000;
}

function startOfMonthUtc(iso: string): number {
  const d = new Date(iso);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}

function bucketStartMs(iso: string, bucket: AnalyticsBucket): number {
  if (bucket === 'week') return startOfWeekUtc(iso);
  if (bucket === 'month') return startOfMonthUtc(iso);
  return startOfDayUtc(iso);
}

function toIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Generic bucketer: groups `items` by date into `TimeSeriesPoint`s, summing `valueOf`. */
export function bucketByDate<T>(
  items: T[],
  dateOf: (item: T) => string,
  valueOf: (item: T) => number,
  bucket: AnalyticsBucket = 'day',
): TimeSeriesPoint[] {
  const map = new Map<number, { value: number; count: number }>();
  for (const item of items) {
    const ms = bucketStartMs(dateOf(item), bucket);
    const cur = map.get(ms) ?? { value: 0, count: 0 };
    cur.value += valueOf(item);
    cur.count += 1;
    map.set(ms, cur);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ms, v]) => ({ bucketStart: toIsoDate(ms), value: v.value, count: v.count }));
}

export function issuanceTimeSeries(bonds: BondToken[], bucket: AnalyticsBucket = 'day'): TimeSeriesPoint[] {
  return bucketByDate(bonds, (b) => b.createdAt, (b) => Number(b.faceValue) || 0, bucket);
}

export function transferTimeSeries(transfers: Transfer[], bucket: AnalyticsBucket = 'day'): TimeSeriesPoint[] {
  const liberadas = transfers.filter((t) => t.status === 'liberada');
  return bucketByDate(liberadas, (t) => t.createdAt, (t) => Number(t.amount) || 0, bucket);
}

/**
 * Escrow "throughput" v1: approximated as resolution time (createdAt→updatedAt,
 * in days) for terminal transfers, bucketed by resolution date. Does not
 * depend on `AuditEvent` — scope is bonds/transfers/reports only.
 */
export function escrowResolutionTimeSeries(transfers: Transfer[], bucket: AnalyticsBucket = 'day'): TimeSeriesPoint[] {
  const terminal = transfers.filter((t) => (TERMINAL_TRANSFER_STATUSES as readonly string[]).includes(t.status));
  return bucketByDate(terminal, (t) => t.updatedAt, (t) => daysBetweenIso(t.createdAt, t.updatedAt), bucket);
}
