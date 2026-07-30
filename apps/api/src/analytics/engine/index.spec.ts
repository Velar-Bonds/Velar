import type { AnalyticsInput } from '@velar/types';
import { analyticsFixture, analyticsFixtureIds } from '@velar/types';
import { applyQueryFilters, applyScope, buildAnalyticsSnapshot } from './index';

const clone = (input: AnalyticsInput): AnalyticsInput => JSON.parse(JSON.stringify(input));
const ids = analyticsFixtureIds;
const FIXED_NOW = new Date('2026-07-01T00:00:00.000Z');

describe('applyScope', () => {
  it('"all" scope returns the input untouched (same reference)', () => {
    const input = clone(analyticsFixture);
    expect(applyScope(input, { kind: 'all' })).toBe(input);
  });

  it('"party" scope keeps only that party\'s bonds, transfers and reports', () => {
    const input = clone(analyticsFixture);
    const scoped = applyScope(input, { kind: 'party', partyId: ids.parties.libertad });
    expect(scoped.bonds.every((b) => b.issuerPartyId === ids.parties.libertad)).toBe(true);
    expect(scoped.bonds).toHaveLength(3);
    expect(scoped.reports.every((r) => r.partyId === ids.parties.libertad)).toBe(true);
    const scopedTokenIds = new Set(scoped.bonds.map((b) => b.tokenId));
    expect(scoped.transfers.every((t) => scopedTokenIds.has(t.bondTokenId))).toBe(true);
  });

  it('an unknown party yields empty collections', () => {
    const input = clone(analyticsFixture);
    const scoped = applyScope(input, { kind: 'party', partyId: 'no-such-party' });
    expect(scoped).toEqual({ bonds: [], transfers: [], reports: [] });
  });
});

describe('applyQueryFilters', () => {
  it('filters bonds/transfers by country', () => {
    const input = clone(analyticsFixture);
    const filtered = applyQueryFilters(input, { country: 'CO' });
    expect(filtered.bonds.map((b) => b.tokenId).sort()).toEqual(['bond-token-c1', 'bond-token-c2']);
    expect(filtered.transfers.map((t) => t.id).sort()).toEqual(['transfer-c1-1', 'transfer-c2-1']);
  });

  it('filters by partyId, scoping reports too', () => {
    const input = clone(analyticsFixture);
    const filtered = applyQueryFilters(input, { partyId: ids.parties.renovacion });
    expect(filtered.bonds.map((b) => b.tokenId).sort()).toEqual(['bond-token-b1', 'bond-token-b2']);
    expect(filtered.reports.every((r) => r.partyId === ids.parties.renovacion)).toBe(true);
  });

  it('filters by date range (from/to)', () => {
    const input = clone(analyticsFixture);
    const filtered = applyQueryFilters(input, { from: '2026-04-01T00:00:00.000Z' });
    expect(filtered.bonds.every((b) => b.createdAt >= '2026-04-01T00:00:00.000Z')).toBe(true);
    expect(filtered.bonds).toHaveLength(2); // c1, c2
  });

  it('no filters returns everything', () => {
    const input = clone(analyticsFixture);
    const filtered = applyQueryFilters(input, {});
    expect(filtered.bonds).toHaveLength(input.bonds.length);
    expect(filtered.transfers).toHaveLength(input.transfers.length);
    expect(filtered.reports).toHaveLength(input.reports.length);
  });
});

describe('buildAnalyticsSnapshot', () => {
  it('composes every sub-aggregate for the full (unscoped) fixture', () => {
    const snapshot = buildAnalyticsSnapshot(clone(analyticsFixture), {}, { kind: 'all' }, FIXED_NOW);
    expect(snapshot.valueVolume).toEqual({
      totalBonds: 7,
      totalEmittedValue: 16_750_000,
      totalTransfers: 9,
      totalSales: 3,
      totalVolumeMoved: 7_500_000,
    });
    expect(snapshot.compliance.parties).toHaveLength(2);
    expect(snapshot.generatedAt).toBe(FIXED_NOW.toISOString());
    expect(snapshot.scope).toEqual({ kind: 'all' });
    expect(snapshot.topBonds.slice(0, 3).map((b) => b.key)).toEqual([
      'bond-token-c2',
      'bond-token-b1',
      'bond-token-a1',
    ]);
    expect(snapshot.topBonds).toHaveLength(5);
  });

  it('restricts everything to a single party when scoped', () => {
    const snapshot = buildAnalyticsSnapshot(
      clone(analyticsFixture),
      {},
      { kind: 'party', partyId: ids.parties.libertad },
      FIXED_NOW,
    );
    expect(snapshot.partyBreakdown).toHaveLength(1);
    expect(snapshot.partyBreakdown[0].partyId).toBe(ids.parties.libertad);
    expect(snapshot.valueVolume.totalBonds).toBe(3);
  });

  it('never mutates the input', () => {
    const input = clone(analyticsFixture);
    const before = JSON.stringify(input);
    buildAnalyticsSnapshot(input, {}, { kind: 'all' }, FIXED_NOW);
    expect(JSON.stringify(input)).toBe(before);
  });

  it('an empty dataset yields a well-formed, all-zero snapshot', () => {
    const empty: AnalyticsInput = { bonds: [], transfers: [], reports: [] };
    const snapshot = buildAnalyticsSnapshot(empty, {}, { kind: 'all' }, FIXED_NOW);
    expect(snapshot.valueVolume.totalBonds).toBe(0);
    expect(snapshot.bondStatusBreakdown).toEqual([]);
    expect(snapshot.partyBreakdown).toEqual([]);
    expect(snapshot.funnel.totalStarted).toBe(0);
    expect(snapshot.compliance.parties).toEqual([]);
    expect(snapshot.topBonds).toEqual([]);
  });
});
