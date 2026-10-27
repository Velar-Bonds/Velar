import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService, CreateReportInput } from './reports.service';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@velar/types';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Reporte creado y enviado al TSE.' })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos.' })
  @ApiResponse({ status: 401, description: 'Token Bearer ausente o invalido.' })
  create(@Body() body: CreateReportInput, @CurrentUser() user: any) {
    return this.reports.create(body, user.id, user.profile?.party_id ?? null);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Listado de reportes visibles para el usuario.' })
  @ApiResponse({ status: 401, description: 'Token Bearer ausente o invalido.' })
  list(@CurrentUser() user: any) {
    return this.reports.list(user.id, user.profile?.role as Role, user.profile?.party_id ?? null);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Detalle del reporte.' })
  @ApiResponse({ status: 401, description: 'Token Bearer ausente o invalido.' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reports.findOne(id, user.id, user.profile?.role as Role, user.profile?.party_id ?? null);
  }

  @Patch(':id/review')
  @ApiResponse({ status: 200, description: 'Estado de revision actualizado.' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes.' })
  review(
    @Param('id') id: string,
    @Body() body: { status: 'revisado' | 'observado' | 'aprobado' | 'rechazado'; notes?: string; expectedVersion?: number },
    @CurrentUser() user: any,
  ) {
    return this.reports.review(id, body.status, body.notes, user.id, user.profile?.role as Role, body.expectedVersion);
  }

  @Patch(':id/assign')
  @Roles('admin')
  @ApiResponse({ status: 200, description: 'Revisor asignado.' })
  @ApiResponse({ status: 403, description: 'Requiere rol admin.' })
  assign(@Param('id') id: string, @Body() body: { reviewerId: string }, @CurrentUser() user: any) {
    return this.reports.assignReviewer(id, body.reviewerId, user.id, user.profile?.role as Role);
  }
}
