import { Injectable } from '@nestjs/common';
import type { AnalyticsSnapshot, ScheduledReportConfig, ScheduledReportResult } from '@velar/types';
import { renderSnapshotCsv } from '../csv/analytics-csv';
import { renderAnalyticsPdf } from '../pdf/analytics-pdf';
import type { ScheduledReportGenerator } from './scheduled-report-generator.interface';

/**
 * Manual-trigger stub implementation (issue #44): produces a CSV/PDF summary
 * from the CURRENT snapshot on demand (`POST /analytics/scheduled-reports/run`).
 * No cron, no delivery — that's future work behind this same interface.
 */
@Injectable()
export class ManualScheduledReportGenerator implements ScheduledReportGenerator {
  async generate(config: ScheduledReportConfig, snapshot: AnalyticsSnapshot): Promise<ScheduledReportResult> {
    const timestamp = snapshot.generatedAt.slice(0, 10);
    if (config.format === 'pdf') {
      const buffer = await renderAnalyticsPdf(snapshot);
      return {
        filename: `velar-analytics-${config.cadence}-${timestamp}.pdf`,
        mimeType: 'application/pdf',
        encoding: 'base64',
        content: buffer.toString('base64'),
      };
    }
    return {
      filename: `velar-analytics-${config.cadence}-${timestamp}.csv`,
      mimeType: 'text/csv; charset=utf-8',
      encoding: 'utf-8',
      content: renderSnapshotCsv(snapshot),
    };
  }
}
