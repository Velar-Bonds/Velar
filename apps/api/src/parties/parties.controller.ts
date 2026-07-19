import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PartiesService } from './parties.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreatePartyDto } from './dto/parties.dto';

@ApiTags('parties')
@ApiBearerAuth()
@Controller('parties')
@UseGuards(AuthGuard)
export class PartiesController {
  constructor(private parties: PartiesService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Lista de partidos políticos' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  findAll() { return this.parties.findAll(); }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Detalle del partido' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Partido no encontrado' })
  findOne(@Param('id') id: string) { return this.parties.findOne(id); }

  @Post()
  @ApiResponse({ status: 201, description: 'Partido creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  create(@Body() body: CreatePartyDto, @CurrentUser() user: { id: string }) { return this.parties.create(body, user.id); }
}
