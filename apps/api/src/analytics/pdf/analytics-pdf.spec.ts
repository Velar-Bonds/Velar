import { PDFDocument } from 'pdf-lib';
import type { AnalyticsInput } from '@velar/types';
import { analyticsFixture } from '@velar/types';
import { buildAnalyticsSnapshot } from '../engine';
import { renderAnalyticsPdf } from './analytics-pdf';

const clone = (input: AnalyticsInput): AnalyticsInput => JSON.parse(JSON.stringify(input));
const FIXED_NOW = new Date('2026-07-01T00:00:00.000Z');

/**
 * PDF internal object ordering/IDs are not byte-stable across runs, so these
 * assertions are STRUCTURAL (valid PDF, re-parseable, has content) rather than
 * byte-exact snapshots — per the plan's documented trade-off.
 */
describe('renderAnalyticsPdf', () => {
  it('produces a well-formed, re-parseable PDF with at least one page', async () => {
    const snapshot = buildAnalyticsSnapshot(clone(analyticsFixture), {}, { kind: 'all' }, FIXED_NOW);
    const buffer = await renderAnalyticsPdf(snapshot);

    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');

    const reloaded = await PDFDocument.load(buffer);
    expect(reloaded.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('an empty snapshot still produces a valid single-page PDF', async () => {
    const snapshot = buildAnalyticsSnapshot({ bonds: [], transfers: [], reports: [] }, {}, { kind: 'all' }, FIXED_NOW);
    const buffer = await renderAnalyticsPdf(snapshot);
    const reloaded = await PDFDocument.load(buffer);
    expect(reloaded.getPageCount()).toBe(1);
  });

  it('a snapshot with many rows overflows onto more than one page', async () => {
    const manyStatuses = Array.from({ length: 60 }, (_, i) => ({
      status: 'activo' as const,
      count: i,
      faceValue: i * 100,
    }));
    const snapshot = buildAnalyticsSnapshot({ bonds: [], transfers: [], reports: [] }, {}, { kind: 'all' }, FIXED_NOW);
    snapshot.bondStatusBreakdown = manyStatuses;
    const buffer = await renderAnalyticsPdf(snapshot);
    const reloaded = await PDFDocument.load(buffer);
    expect(reloaded.getPageCount()).toBeGreaterThan(1);
  });
});
