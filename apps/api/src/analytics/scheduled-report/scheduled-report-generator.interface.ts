import type { AnalyticsSnapshot, ScheduledReportConfig, ScheduledReportResult } from '@velar/types';

/**
 * Scheduled report generation, behind an INTERFACE + STUB (issue #44), same
 * discipline as `apps/api/src/reports/files/file-scanner.ts`'s antivirus hook:
 * no real cron/vendor. In production, a concrete cron-backed implementation
 * is injected without touching `AnalyticsService`.
 */
export const SCHEDULED_REPORT_GENERATOR = Symbol('SCHEDULED_REPORT_GENERATOR');

export interface ScheduledReportGenerator {
  generate(config: ScheduledReportConfig, snapshot: AnalyticsSnapshot): Promise<ScheduledReportResult>;
}
