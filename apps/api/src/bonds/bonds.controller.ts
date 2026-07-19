import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { BondsService } from './bonds.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@velar/types';
import {
  CreateBondDto,
  CreateBondRequestDto,
  HashDocumentDto,
  PublishBondDto,
  RejectBondRequestDto,
} from './dto/bonds.dto';

@ApiTags('bonds')
@ApiBearerAuth()
@Controller('bonds')
@UseGuards(AuthGuard)
export class BondsController {
  constructor(private bonds: BondsService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Bono registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 401,
    description: 'Token no proporcionado o inválido',
  })
  @ApiResponse({ status: 403, description: 'Se requiere rol tse o admin' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Roles('tse', 'admin')
  register(@Body() body: CreateBondDto, @CurrentUser() user: any) {
    return this.bonds.register(body, user.id, user.profile?.role as Role);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Lista de bonos' })
  @ApiResponse({
    status: 401,
    description: 'Token no proporcionado o inválido',
  })
  findAll(
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Query('country') country: string | undefined,
    @CurrentUser() user: any,
  ) {
    return this.bonds.findAll(
      user.id,
      user.profile?.role as Role,
      user.profile?.party_id,
      page,
      limit,
      country,
    );
  }

  @Get('requests')
  @ApiResponse({ status: 200, description: 'Solicitudes de bono' })
  @ApiResponse({
    status: 401,
    description: 'Token no proporcionado o inválido',
  })
  findRequests(@CurrentUser() user: any) {
    return this.bonds.findRequests(
      user.id,
      user.profile?.role as Role,
      user.profile?.party_id,
    );
  }

  @Post('requests')
  @ApiResponse({ status: 201, description: 'Solicitud creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 401,
    description: 'Token no proporcionado o inválido',
  })
  createRequest(@Body() body: CreateBondRequestDto, @CurrentUser() user: any) {
    const partyId = user.profile?.party_id;
    if (!partyId) throw new Error('No tenés un partido asociado');
    return this.bonds.requestBond(body, user.id, partyId);
  }

  @Patch('requests/:id/approve')
  @ApiResponse({ status: 200, description: 'Solicitud aprobada' })
  @ApiResponse({
    status: 401,
    description: 'Token no proporcionado o inválido',
  })
  @ApiResponse({ status: 403, description: 'Se requiere rol tse o admin' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  @Roles('tse', 'admin')
  approveRequest(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bonds.approveRequest(id, user.id, user.profile?.role as Role);
  }

  @Patch('requests/:id/reject')
  @ApiResponse({ status: 200, description: 'Solicitud rechazada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 401,
    description: 'Token no proporcionado o inválido',
  })
  @ApiResponse({ status: 403, description: 'Se requiere rol tse o admin' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  @Roles('tse', 'admin')
  rejectRequest(
    @Param('id') id: string,
    @Body() body: RejectBondRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.bonds.rejectRequest(
      id,
      body.reason ?? '',
      user.id,
      user.profile?.role as Role,
    );
  }

  @Get('available')
  @ApiResponse({ status: 200, description: 'Bonos disponibles en el mercado' })
  @ApiResponse({
    status: 401,
    description: 'Token no proporcionado o inválido',
  })
  findAvailable(
    @Query('country') country: string | undefined,
    @CurrentUser() user: any,
  ) {
    // Por defecto, el comprador ve el mercado de SU país. El selector del demo
    // puede pasar ?country= para explorar otros mercados (transparencia pública).
    const scope = country ?? user.profile?.country ?? undefined;
    return this.bonds.findAvailable(user.id, scope);
  }

  @Get(':tokenId')
  @ApiResponse({ status: 200, description: 'Detalle del bono' })
  @ApiResponse({
    status: 401,
    description: 'Token no proporcionado o inválido',
  })
  @ApiResponse({ status: 404, description: 'Bono no encontrado' })
  findOne(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.bonds.findOne(tokenId, user.id, user.profile?.role as Role);
  }

  @Get(':tokenId/onchain')
  @ApiResponse({ status: 200, description: 'Información on-chain del bono' })
  @ApiResponse({
    status: 401,
    description: 'Token no proporcionado o inválido',
  })
  @ApiResponse({ status: 404, description: 'Bono no encontrado' })
  onchain(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.bonds.onchainInfo(tokenId, user.id, user.profile?.role as Role);
  }

  @Patch(':tokenId/issue-onchain')
  @ApiResponse({ status: 200, description: 'Bono emitido on-chain' })
  @ApiResponse({
    status: 401,
    description: 'Token no proporcionado o inválido',
  })
  @ApiResponse({ status: 403, description: 'Se requiere rol tse o admin' })
  @ApiResponse({ status: 404, description: 'Bono no encontrado' })
  @Roles('tse', 'admin')
  issueOnchain(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.bonds.issueOnchain(
      tokenId,
      user.id,
      user.profile?.role as Role,
    );
  }

  @Patch(':tokenId/publish')
  @ApiResponse({ status: 200, description: 'Bono publicado en el mercado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 401,
    description: 'Token no proporcionado o inválido',
  })
  @ApiResponse({ status: 404, description: 'Bono no encontrado' })
  publish(
    @Param('tokenId') tokenId: string,
    @Body() body: PublishBondDto,
    @CurrentUser() user: any,
  ) {
    return this.bonds.publish(tokenId, user.id, body?.paymentMethods);
  }

  @Get(':tokenId/soroban-details')
  @ApiResponse({ status: 200, description: 'Detalles Soroban del bono' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Bono no encontrado' })
  sorobanDetails(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.bonds.readSorobanDetails(
      tokenId,
      user.id,
      user.profile?.role as Role,
    );
  }

  @Patch(':tokenId/freeze')
  @ApiResponse({ status: 200, description: 'Bono congelado' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 403, description: 'Se requiere rol tse o admin' })
  @ApiResponse({ status: 404, description: 'Bono no encontrado' })
  @Roles('tse', 'admin')
  freeze(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.bonds.freeze(tokenId, user.id, user.profile?.role as Role);
  }

  @Patch(':tokenId/unfreeze')
  @ApiResponse({ status: 200, description: 'Bono descongelado' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 403, description: 'Se requiere rol tse o admin' })
  @ApiResponse({ status: 404, description: 'Bono no encontrado' })
  @Roles('tse', 'admin')
  unfreeze(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.bonds.unfreeze(tokenId, user.id, user.profile?.role as Role);
  }

  @Post(':tokenId/document')
  @ApiResponse({ status: 200, description: 'Documento subido exitosamente' })
  @ApiResponse({ status: 400, description: 'Archivo no proporcionado o inválido' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 403, description: 'Se requiere rol tse o admin' })
  @ApiResponse({ status: 404, description: 'Bono no encontrado' })
  @Roles('tse', 'admin')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Param('tokenId') tokenId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.bonds.uploadDocument(
      tokenId,
      file,
      user.id,
      user.profile?.role as Role,
    );
  }

  @Get(':tokenId/document')
  @ApiResponse({ status: 200, description: 'Documento PDF del bono' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Bono no encontrado' })
  async downloadDocument(
    @Param('tokenId') tokenId: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const buffer = await this.bonds.downloadDocument(
      tokenId,
      user.id,
      user.profile?.role as Role,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bono-${tokenId}.pdf"`,
    });
    res.send(buffer);
  }

  @Post('hash')
  @ApiResponse({ status: 200, description: 'Hash calculado' })
  @ApiResponse({ status: 400, description: 'Contenido inválido' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  computeHash(@Body() body: HashDocumentDto) {
    return { hash: BondsService.hashDocument(body.content) };
  }
}
