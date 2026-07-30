import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { ComplianceAnalyticsController } from './compliance-analytics.controller';
import { ComplianceAnalyticsService } from './compliance-analytics.service';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [ComplianceAnalyticsController],
  providers: [ComplianceAnalyticsService],
})
export class ComplianceAnalyticsModule {}
