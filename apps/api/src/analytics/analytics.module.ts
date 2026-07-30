import { Module } from '@nestjs/common';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsDataService } from './analytics-data.service';
import { AnalyticsService } from './analytics.service';
import { ManualScheduledReportGenerator } from './scheduled-report/manual-scheduled-report.generator';
import { SCHEDULED_REPORT_GENERATOR } from './scheduled-report/scheduled-report-generator.interface';

@Module({
  imports: [SupabaseModule, NotificationsModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsDataService,
    { provide: SCHEDULED_REPORT_GENERATOR, useClass: ManualScheduledReportGenerator },
  ],
})
export class AnalyticsModule {}
