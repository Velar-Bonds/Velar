import type { BondStatus, BondToken } from './bond';
import type { Transfer, TransferStatus } from './transfer';
import type { MonthlyReport, PeriodCompliance } from './report';
import type { CountryCode } from './country';
import type { Role } from './roles';
import type { TransferLifecycleStep } from './provenance';

/**
 * Analytics & BI model (issue #44).
 *
 * `AnalyticsSnapshot` is a pure, deterministic aggregation over bonds, transfers
 * and reports — never touching Supabase directly. Like `ProvenanceInput`
 * (issue #36), `AnalyticsInput` is shaped so fixtures and the pure engine
 * (`apps/api/src/analytics/engine/`) share one contract; the engine never
 * imports `Role` or any authorization concept — RBAC scoping happens before
 * the input reaches the engine (see `AnalyticsScope`).
 */

// ─── Inputs & query ────────────────────────────────────────────────────────────

/** Raw inputs the aggregation engine consumes. Sourced from Supabase in
 * production (mocked in tests); fixture-fed in the engine's own unit tests. */
export interface AnalyticsInput {
  bonds: BondToken[];
  transfers: Transfer[];
  reports: MonthlyReport[];
}

export type AnalyticsBucket = 'day' | 'week' | 'month';

/** Filters applied to `AnalyticsInput` before aggregation. All optional. */
export interface AnalyticsQuery {
  /** ISO date (inclusive). Filters bonds/transfers/reports by their created/period date. */
  from?: string | null;
  /** ISO date (inclusive). */
  to?: string | null;
  country?: CountryCode | null;
  partyId?: string | null;
  status?: BondStatus | TransferStatus | null;
  bucket?: AnalyticsBucket;
}

/**
 * Resolved access scope, computed from the caller's role/party BEFORE the
 * engine runs. The engine only ever sees `AnalyticsScope`, never `Role` —
 * keeps aggregation authz-agnostic, same discipline as the provenance engine.
 */
export type AnalyticsScope = { kind: 'all' } | { kind: 'party'; partyId: string };

// ─── Breakdown results ─────────────────────────────────────────────────────────

export interface BondStatusBreakdown {
  status: BondStatus;
  count: number;
  faceValue: number;
}

export interface PartyBreakdown {
  partyId: string;
  bondsCount: number;
  emittedValue: number;
  salesCount: number;
  volumeMoved: number;
}

export interface CountryBreakdown {
  country: CountryCode;
  bondsCount: number;
  emittedValue: number;
  salesCount: number;
  volumeMoved: number;
}

export interface ValueVolumeAggregate {
  totalBonds: number;
  totalEmittedValue: number;
  totalTransfers: number;
  totalSales: number;
  totalVolumeMoved: number;
}

// ─── Transfer funnel ────────────────────────────────────────────────────────────

export interface TransferFunnelStage {
  step: TransferLifecycleStep;
  /** Count of transfers whose current status is at or past this step. */
  reachedCount: number;
  /** % of `totalStarted` that reached this step. */
  conversionFromStartPct: number;
  /** % drop from the previous step to this one (0 for the first step). */
  dropOffPct: number;
}

export interface TransferFunnel {
  totalStarted: number;
  stages: TransferFunnelStage[];
  rejectedCount: number;
  cancelledCount: number;
  completedCount: number;
}

// ─── Time series & trends ──────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  /** ISO date of the bucket's start (UTC, YYYY-MM-DD). */
  bucketStart: string;
  value: number;
  count: number;
}

export interface TrendDelta {
  current: number;
  previous: number;
  deltaAbs: number;
  /** null when `previous` is 0 (undefined percentage change). */
  deltaPct: number | null;
}

export interface MovingAveragePoint {
  bucketStart: string;
  average: number;
}

export interface TopNEntry {
  key: string;
  label: string;
  value: number;
}

// ─── Compliance ─────────────────────────────────────────────────────────────────

export interface PartyComplianceSummary {
  partyId: string;
  periods: PeriodCompliance[];
  onTimeCount: number;
  lateCount: number;
  overdueCount: number;
  missingCount: number;
}

export interface ComplianceSummary {
  parties: PartyComplianceSummary[];
}

// ─── Root snapshot ──────────────────────────────────────────────────────────────

export interface AnalyticsSnapshot {
  query: AnalyticsQuery;
  scope: AnalyticsScope;
  valueVolume: ValueVolumeAggregate;
  bondStatusBreakdown: BondStatusBreakdown[];
  partyBreakdown: PartyBreakdown[];
  countryBreakdown: CountryBreakdown[];
  funnel: TransferFunnel;
  issuanceSeries: TimeSeriesPoint[];
  transferSeries: TimeSeriesPoint[];
  escrowResolutionSeries: TimeSeriesPoint[];
  compliance: ComplianceSummary;
  topBonds: TopNEntry[];
  /** ISO-8601 timestamp of when the snapshot was computed. */
  generatedAt: string;
}

// ─── Threshold alerting ─────────────────────────────────────────────────────────

export type AlertComparator = 'gt' | 'lt' | 'gte' | 'lte';

export interface AlertRule {
  id: string;
  name: string;
  /** Dot-path into `AnalyticsSnapshot`, e.g. "valueVolume.totalVolumeMoved". */
  metricPath: string;
  comparator: AlertComparator;
  threshold: number;
  scope: AnalyticsScope;
  notifyUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating/editing a rule (no id/timestamps). */
export interface AlertRuleInput {
  name: string;
  metricPath: string;
  comparator: AlertComparator;
  threshold: number;
  scope: AnalyticsScope;
  notifyUserIds: string[];
}

export interface AlertBreach {
  ruleId: string;
  ruleName: string;
  metricPath: string;
  value: number;
  threshold: number;
  comparator: AlertComparator;
  at: string;
}

// ─── Saved views ────────────────────────────────────────────────────────────────

export interface SavedView {
  id: string;
  ownerId: string;
  role: Role;
  name: string;
  query: AnalyticsQuery;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a saved view (no id/owner/timestamps). */
export interface SavedViewInput {
  name: string;
  query: AnalyticsQuery;
}

// ─── Scheduled report generation (interface + stub, no vendor) ─────────────────

export type ScheduledReportCadence = 'weekly' | 'monthly';
export type ScheduledReportFormat = 'csv' | 'pdf';

export interface ScheduledReportConfig {
  id: string;
  cadence: ScheduledReportCadence;
  format: ScheduledReportFormat;
  scope: AnalyticsScope;
  recipients: string[];
}

export interface ScheduledReportResult {
  filename: string;
  mimeType: string;
  encoding: 'utf-8' | 'base64';
  content: string;
}
