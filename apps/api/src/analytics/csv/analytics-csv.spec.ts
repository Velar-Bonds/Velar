import type { AnalyticsInput } from '@velar/types';
import { analyticsFixture } from '@velar/types';
import { buildAnalyticsSnapshot } from '../engine';
import { renderSnapshotCsv } from './analytics-csv';

const clone = (input: AnalyticsInput): AnalyticsInput => JSON.parse(JSON.stringify(input));
const FIXED_NOW = new Date('2026-07-01T00:00:00.000Z');

describe('renderSnapshotCsv', () => {
  it('renders a deterministic, BOM-prefixed CSV with every section', () => {
    const snapshot = buildAnalyticsSnapshot(clone(analyticsFixture), {}, { kind: 'all' }, FIXED_NOW);
    const csv = renderSnapshotCsv(snapshot);

    expect(csv.startsWith('\uFEFFgenerated_at,2026-07-01T00:00:00.000Z')).toBe(true);
    expect(csv).toContain('section,status,count,face_value');
    expect(csv).toContain('bond_status,transferido,3,7200000');
    expect(csv).toContain('section,party_id,bonds_count,emitted_value,sales_count,volume_moved');
    expect(csv).toContain('section,country,bonds_count,emitted_value,sales_count,volume_moved');
    expect(csv).toContain('value_volume,total_bonds,7');
    expect(csv).toContain('value_volume,total_volume_moved,7500000');
  });

  it('is deterministic: same snapshot produces byte-identical CSV', () => {
    const snapshot = buildAnalyticsSnapshot(clone(analyticsFixture), {}, { kind: 'all' }, FIXED_NOW);
    expect(renderSnapshotCsv(snapshot)).toBe(renderSnapshotCsv(snapshot));
  });

  it('escapes commas/quotes in cell values', () => {
    const snapshot = buildAnalyticsSnapshot(clone(analyticsFixture), {}, { kind: 'all' }, FIXED_NOW);
    snapshot.partyBreakdown = [
      { partyId: 'party, "weird"', bondsCount: 1, emittedValue: 100, salesCount: 0, volumeMoved: 0 },
    ];
    const csv = renderSnapshotCsv(snapshot);
    expect(csv).toContain('"party, ""weird""",1,100,0,0');
  });

  it('an empty snapshot still renders every header row', () => {
    const snapshot = buildAnalyticsSnapshot({ bonds: [], transfers: [], reports: [] }, {}, { kind: 'all' }, FIXED_NOW);
    const csv = renderSnapshotCsv(snapshot);
    expect(csv).toContain('value_volume,total_bonds,0');
    expect(csv).not.toContain('bond_status,'); // no status rows for an empty dataset
  });
});
