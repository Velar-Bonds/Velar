import type {
  AnalyticsInput,
  AnalyticsQuery,
  AnalyticsScope,
  AnalyticsSnapshot,
  DeadlineConfig,
} from '@velar/types';
import { aggregateByBondStatus, aggregateByCountry, aggregateByParty, aggregateValueVolume } from './aggregations';
import { computeComplianceSummary } from './compliance';
import { computeTransferFunnel } from './funnel';
import { escrowResolutionTimeSeries, issuanceTimeSeries, transferTimeSeries } from './timeseries';
import { topN } from './trends';

export * from './aggregations';
export * from './alerts';
export * from './compliance';
export * from './funnel';
export * from './timeseries';
export * from './trends';

/**
 * Root composition of the pure analytics engine (issue #44). Given raw
 * bonds/transfers/reports, an access scope and an optional query, computes
 * the full `AnalyticsSnapshot`. Never mutates `input`; RBAC scoping (which
 * party can see what) is resolved by the caller into `AnalyticsScope` before
 * this function runs — the engine itself never imports `Role`.
 */

/** Same deadline calendar used by the reports module (apps/api/src/reports/domain/deadlines.spec.ts). */
export const DEFAULT_DEADLINE_CONFIG: DeadlineConfig = { dueDayOfMonth: 15, graceDays: 5 };

export function applyScope(input: AnalyticsInput, scope: AnalyticsScope): AnalyticsInput {
  if (scope.kind === 'all') return input;
  const { partyId } = scope;
  const bonds = input.bonds.filter((b) => b.issuerPartyId === partyId);
  const bondTokenIds = new Set(bonds.map((b) => b.tokenId));
  return {
    bonds,
    transfers: input.transfers.filter((t) => bondTokenIds.has(t.bondTokenId)),
    reports: input.reports.filter((r) => r.partyId === partyId),
  };
}

/**
 * Applies `AnalyticsQuery` filters. `country`/`partyId`/`from`/`to` narrow the
 * bond set first, transfers follow via `bondTokenId`; `status` (which can be a
 * `BondStatus` or `TransferStatus`) then filters each collection independently
 * against its own status domain, since the two enums mostly don't overlap.
 */
export function applyQueryFilters(input: AnalyticsInput, query: AnalyticsQuery): AnalyticsInput {
  let bonds = input.bonds;
  let reports = input.reports;

  if (query.country) bonds = bonds.filter((b) => b.country === query.country);
  if (query.partyId) {
    bonds = bonds.filter((b) => b.issuerPartyId === query.partyId);
    reports = reports.filter((r) => r.partyId === query.partyId);
  }
  if (query.from) bonds = bonds.filter((b) => b.createdAt >= query.from!);
  if (query.to) bonds = bonds.filter((b) => b.createdAt <= query.to!);

  const bondTokenIds = new Set(bonds.map((b) => b.tokenId));
  let transfers = input.transfers.filter((t) => bondTokenIds.has(t.bondTokenId));
  if (query.from) transfers = transfers.filter((t) => t.createdAt >= query.from!);
  if (query.to) transfers = transfers.filter((t) => t.createdAt <= query.to!);

  if (query.status) {
    bonds = bonds.filter((b) => b.status === query.status);
    transfers = transfers.filter((t) => t.status === query.status);
  }

  return { bonds, transfers, reports };
}

export function buildAnalyticsSnapshot(
  input: AnalyticsInput,
  query: AnalyticsQuery = {},
  scope: AnalyticsScope = { kind: 'all' },
  now: Date = new Date(),
  deadlineConfig: DeadlineConfig = DEFAULT_DEADLINE_CONFIG,
): AnalyticsSnapshot {
  const scoped = applyScope(input, scope);
  const filtered = applyQueryFilters(scoped, query);
  const bucket = query.bucket ?? 'day';

  const topBonds = topN(
    filtered.bonds.map((b) => ({
      tokenId: b.tokenId,
      bondId: b.bondId,
      volume: filtered.transfers
        .filter((t) => t.bondTokenId === b.tokenId && t.status === 'liberada')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0),
    })),
    (x) => x.tokenId,
    (x) => x.bondId,
    (x) => x.volume,
    5,
  );

  return {
    query,
    scope,
    valueVolume: aggregateValueVolume(filtered.bonds, filtered.transfers),
    bondStatusBreakdown: aggregateByBondStatus(filtered.bonds),
    partyBreakdown: aggregateByParty(filtered.bonds, filtered.transfers),
    countryBreakdown: aggregateByCountry(filtered.bonds, filtered.transfers),
    funnel: computeTransferFunnel(filtered.transfers),
    issuanceSeries: issuanceTimeSeries(filtered.bonds, bucket),
    transferSeries: transferTimeSeries(filtered.transfers, bucket),
    escrowResolutionSeries: escrowResolutionTimeSeries(filtered.transfers, bucket),
    compliance: computeComplianceSummary(filtered.reports, deadlineConfig, now.toISOString()),
    topBonds,
    generatedAt: now.toISOString(),
  };
}
