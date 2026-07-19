import {
  Controller, Get, Param, Query, UseGuards, ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BondSearchQuery, Role } from '@velar/types';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(AuthGuard)
export class AuditController {
  constructor(private audit: AuditService) {}

  @Get('bonds')
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda de bonos' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 403, description: 'Se requiere rol tse o admin' })
  searchBonds(@Query() query: BondSearchQuery, @CurrentUser() user: any) {
    const role: Role = user.profile?.role;
    if (!['tse', 'admin'].includes(role)) throw new ForbiddenException('TSE/Admin only');
    return this.audit.searchBonds(query);
  }

  @Get('bonds/:tokenId/timeline')
  @ApiResponse({ status: 200, description: 'Línea de tiempo del bono' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 403, description: 'Se requiere rol tse o admin' })
  @ApiResponse({ status: 404, description: 'Bono no encontrado' })
  getBondTimeline(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    const role: Role = user.profile?.role;
    if (!['tse', 'admin'].includes(role)) throw new ForbiddenException('TSE/Admin only');
    return this.audit.getBondTimeline(tokenId);
  }

  @Get('bonds/:tokenId/traceability')
  @ApiResponse({ status: 200, description: 'Trazabilidad del bono' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Bono no encontrado' })
  getBondTraceability(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.audit.getBondTraceability(tokenId);
  }

  @Get('events')
  @ApiResponse({ status: 200, description: 'Eventos recientes de auditoría' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 403, description: 'Se requiere rol tse o admin' })
  getRecentEvents(
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @CurrentUser() user: any,
  ) {
    const role: Role = user.profile?.role;
    if (!['tse', 'admin'].includes(role)) throw new ForbiddenException('TSE/Admin only');
    return this.audit.getRecentEvents(page, limit);
  }
}
