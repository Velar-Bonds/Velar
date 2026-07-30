import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@velar/types';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ComplianceAnalyticsService } from './compliance-analytics.service';

@Controller('compliance-analytics')
@UseGuards(AuthGuard)
export class ComplianceAnalyticsController {
  constructor(private service: ComplianceAnalyticsService) {}

  @Get('overview')
  overview(@CurrentUser() user: any) {
    return this.service.overview(
      user.profile?.role as Role,
      new Date().toISOString(),
    );
  }

  @Get('by-party')
  byParty(@CurrentUser() user: any) {
    return this.service.byParty(
      user.profile?.role as Role,
      new Date().toISOString(),
    );
  }

  @Get('reviewer-workload')
  reviewerWorkload(@CurrentUser() user: any) {
    return this.service.reviewerWorkload(user.profile?.role as Role);
  }

  @Get('forecast')
  forecast(
    @Query('horizonMonths') horizonMonths: string | undefined,
    @CurrentUser() user: any,
  ) {
    return this.service.forecast(
      user.profile?.role as Role,
      new Date().toISOString(),
      horizonMonths ? Number(horizonMonths) : 3,
    );
  }
}
