import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@velar/types';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('overview')
  overview(@CurrentUser() user: any) {
    return this.analytics.overview(user.profile?.role as Role);
  }

  @Get('by-party')
  byParty(@CurrentUser() user: any) {
    return this.analytics.byParty(user.profile?.role as Role);
  }

  @Get('bonds/:tokenId/price-history')
  priceHistory(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.analytics.bondPriceHistory(tokenId, user.profile?.role as Role);
  }

  @Get('bonds/:tokenId/owners')
  owners(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.analytics.bondOwners(tokenId, user.profile?.role as Role);
  }

  @Get('top-bonds')
  top(@Query('limit') limit: string | undefined, @CurrentUser() user: any) {
    return this.analytics.topBonds(user.profile?.role as Role, limit ? Number(limit) : 5);
  }

  @Get('volume-over-time')
  volume(@Query('days') days: string | undefined, @CurrentUser() user: any) {
    return this.analytics.volumeOverTime(user.profile?.role as Role, days ? Number(days) : 30);
  }
}
