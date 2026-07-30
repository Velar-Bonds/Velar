import { Body, Controller, Delete, Get, Param, Patch, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import type { AlertRuleInput, AnalyticsBucket, AnalyticsQuery, Role, SavedViewInput, ScheduledReportConfig } from '@velar/types';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { AnalyticsService } from './analytics.service';

/** Raw query-string shape as Express/Nest hands it to us — everything is a string or absent. */
interface RawAnalyticsQuery {
  from?: string;
  to?: string;
  country?: string;
  partyId?: string;
  status?: string;
  bucket?: string;
}

function toAnalyticsQuery(q: RawAnalyticsQuery): AnalyticsQuery {
  return {
    from: q.from ?? null,
    to: q.to ?? null,
    country: (q.country as AnalyticsQuery['country']) ?? null,
    partyId: q.partyId ?? null,
    status: (q.status as AnalyticsQuery['status']) ?? null,
    bucket: (q.bucket as AnalyticsBucket) ?? undefined,
  };
}

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  // ─── Snapshot ───────────────────────────────────────────────────────────────

  @Get('snapshot')
  snapshot(@Query() q: RawAnalyticsQuery, @CurrentUser() user: any) {
    return this.analytics.getSnapshot(user.profile?.role as Role, user.profile?.party_id ?? null, toAnalyticsQuery(q));
  }

  // ─── Legacy bond-detail drill-down (unchanged routes/behavior) ─────────────

  @Get('top-bonds')
  legacyTopBonds(@Query('limit') limit: string | undefined, @CurrentUser() user: any) {
    return this.analytics.topBonds(user.profile?.role as Role, limit ? Number(limit) : 5);
  }

  @Get('bonds/:tokenId/price-history')
  priceHistory(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.analytics.bondPriceHistory(tokenId, user.profile?.role as Role);
  }

  @Get('bonds/:tokenId/owners')
  owners(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.analytics.bondOwners(tokenId, user.profile?.role as Role);
  }

  @Get('legacy-export')
  async legacyExport(@Query('format') format: string | undefined, @CurrentUser() user: any) {
    const csv = await this.analytics.exportTransfersCsv(user.profile?.role as Role, format);
    const filename = `velar-transfers-${new Date().toISOString().slice(0, 10)}.csv`;
    return new StreamableFile(Buffer.from(csv, 'utf-8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  // ─── Snapshot-based CSV/PDF export (issue #44) ─────────────────────────────

  @Get('export')
  async export(@Query('format') format: string | undefined, @Query() q: RawAnalyticsQuery, @CurrentUser() user: any) {
    const role = user.profile?.role as Role;
    const partyId = user.profile?.party_id ?? null;
    const query = toAnalyticsQuery(q);
    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === 'pdf') {
      const buffer = await this.analytics.exportPdf(role, partyId, query);
      return new StreamableFile(buffer, {
        type: 'application/pdf',
        disposition: `attachment; filename="velar-analytics-${timestamp}.pdf"`,
      });
    }
    const csv = await this.analytics.exportCsv(role, partyId, query);
    return new StreamableFile(Buffer.from(csv, 'utf-8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="velar-analytics-${timestamp}.csv"`,
    });
  }

  // ─── Saved views (owner-scoped, any authenticated role) ────────────────────

  @Get('views')
  listViews(@CurrentUser() user: any) {
    return this.analytics.listSavedViews(user.id);
  }

  @Post('views')
  createView(@Body() body: SavedViewInput, @CurrentUser() user: any) {
    return this.analytics.createSavedView(user.id, user.profile?.role as Role, body);
  }

  @Delete('views/:id')
  deleteView(@Param('id') id: string, @CurrentUser() user: any) {
    return this.analytics.deleteSavedView(id, user.id);
  }

  // ─── Alert rules (config is TSE/admin-only privileged action) ──────────────

  @Get('alert-rules')
  @Roles('tse', 'admin')
  listAlertRules() {
    return this.analytics.listAlertRules();
  }

  @Post('alert-rules')
  @Roles('tse', 'admin')
  createAlertRule(@Body() body: AlertRuleInput) {
    return this.analytics.createAlertRule(body);
  }

  @Patch('alert-rules/:id')
  @Roles('tse', 'admin')
  updateAlertRule(@Param('id') id: string, @Body() body: Partial<AlertRuleInput>) {
    return this.analytics.updateAlertRule(id, body);
  }

  @Delete('alert-rules/:id')
  @Roles('tse', 'admin')
  deleteAlertRule(@Param('id') id: string) {
    return this.analytics.deleteAlertRule(id);
  }

  @Post('alert-rules/:id/evaluate')
  @Roles('tse', 'admin')
  evaluateAlertRule(@Param('id') id: string) {
    return this.analytics.evaluateAlertRule(id);
  }

  // ─── Scheduled report (manual trigger, no cron) ────────────────────────────

  @Post('scheduled-reports/run')
  @Roles('tse', 'admin')
  runScheduledReport(@Body() body: Omit<ScheduledReportConfig, 'id'>) {
    return this.analytics.runScheduledReport({ id: `manual-${Date.now()}`, ...body });
  }
}
