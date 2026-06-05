import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ReportsService, CreateReportInput } from './reports.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@velar/types';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Post()
  create(@Body() body: CreateReportInput, @CurrentUser() user: any) {
    return this.reports.create(body, user.id, user.profile?.party_id ?? null);
  }

  @Get()
  list(@CurrentUser() user: any) {
    return this.reports.list(user.id, user.profile?.role as Role, user.profile?.party_id ?? null);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reports.findOne(id, user.id, user.profile?.role as Role, user.profile?.party_id ?? null);
  }

  @Patch(':id/review')
  review(
    @Param('id') id: string,
    @Body() body: { status: 'revisado' | 'observado' | 'aprobado'; notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.reports.review(id, body.status, body.notes, user.id, user.profile?.role as Role);
  }
}
