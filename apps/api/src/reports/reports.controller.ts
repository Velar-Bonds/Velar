import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto, ReviewReportDto } from './dto/reports.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@velar/types';
import { ApiBearerAuth, ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Reporte creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 403, description: 'Solo partidos políticos pueden enviar reportes' })
  create(@Body() body: CreateReportDto, @CurrentUser() user: any) {
    return this.reports.create(body, user.id, user.profile?.party_id ?? null);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Lista de reportes' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  list(@CurrentUser() user: any) {
    return this.reports.list(
      user.id,
      user.profile?.role as Role,
      user.profile?.party_id ?? null,
    );
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Detalle del reporte' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Reporte no encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reports.findOne(
      id,
      user.id,
      user.profile?.role as Role,
      user.profile?.party_id ?? null,
    );
  }

  @Patch(':id/review')
  @ApiResponse({ status: 200, description: 'Reporte revisado' })
  @ApiResponse({ status: 400, description: 'Estado inválido' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 403, description: 'Solo TSE puede revisar reportes' })
  @ApiResponse({ status: 404, description: 'Reporte no encontrado' })
  review(
    @Param('id') id: string,
    @Body()
    body: ReviewReportDto,
    @CurrentUser() user: any,
  ) {
    return this.reports.review(
      id,
      body.status,
      body.notes,
      user.id,
      user.profile?.role as Role,
    );
  }
}
