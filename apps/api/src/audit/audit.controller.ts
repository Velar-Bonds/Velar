import {
  Controller, Get, Param, Query, UseGuards, ForbiddenException,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BondSearchQuery, Role } from '@velar/types';

@Controller('audit')
@UseGuards(AuthGuard)
export class AuditController {
  constructor(private audit: AuditService) {}

  @Get('bonds')
  searchBonds(@Query() query: BondSearchQuery, @CurrentUser() user: any) {
    const role: Role = user.profile?.role;
    if (!['tse', 'admin'].includes(role)) throw new ForbiddenException('TSE/Admin only');
    return this.audit.searchBonds(query);
  }

  @Get('bonds/:tokenId/timeline')
  getBondTimeline(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    const role: Role = user.profile?.role;
    if (!['tse', 'admin'].includes(role)) throw new ForbiddenException('TSE/Admin only');
    return this.audit.getBondTimeline(tokenId);
  }

  @Get('events')
  getRecentEvents(@Query('limit') limit: string, @CurrentUser() user: any) {
    const role: Role = user.profile?.role;
    if (!['tse', 'admin'].includes(role)) throw new ForbiddenException('TSE/Admin only');
    return this.audit.getRecentEvents(limit ? Number(limit) : 50);
  }
}
