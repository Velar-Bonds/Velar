import { PDFDocument } from 'pdf-lib';
import type { AnalyticsInput, ScheduledReportConfig } from '@velar/types';
import { analyticsFixture } from '@velar/types';
import { buildAnalyticsSnapshot } from '../engine';
import { ManualScheduledReportGenerator } from './manual-scheduled-report.generator';

const clone = (input: AnalyticsInput): AnalyticsInput => JSON.parse(JSON.stringify(input));
const FIXED_NOW = new Date('2026-07-01T00:00:00.000Z');

describe('ManualScheduledReportGenerator', () => {
  const generator = new ManualScheduledReportGenerator();
  const snapshot = buildAnalyticsSnapshot(clone(analyticsFixture), {}, { kind: 'all' }, FIXED_NOW);

  const baseConfig: Omit<ScheduledReportConfig, 'format'> = {
    id: 'config-1',
    cadence: 'monthly',
    scope: { kind: 'all' },
    recipients: [],
  };

  it('generates a CSV result', async () => {
    const result = await generator.generate({ ...baseConfig, format: 'csv' }, snapshot);
    expect(result.mimeType).toBe('text/csv; charset=utf-8');
    expect(result.encoding).toBe('utf-8');
    expect(result.filename).toBe('velar-analytics-monthly-2026-07-01.csv');
    expect(result.content).toContain('value_volume,total_bonds,7');
  });

  it('generates a PDF result, base64-encoded and re-parseable', async () => {
    const result = await generator.generate({ ...baseConfig, format: 'pdf' }, snapshot);
    expect(result.mimeType).toBe('application/pdf');
    expect(result.encoding).toBe('base64');
    expect(result.filename).toBe('velar-analytics-monthly-2026-07-01.pdf');

    const buffer = Buffer.from(result.content, 'base64');
    const doc = await PDFDocument.load(buffer);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });
});
