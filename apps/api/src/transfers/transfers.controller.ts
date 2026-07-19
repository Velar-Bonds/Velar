import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransfersService } from './transfers.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@velar/types';
import {
  CounterOfferDto,
  CreateTransferDto,
  RegisterPaymentDto,
  RequestReturnDto,
  ReturnDecisionDto,
  SubmitXdrDto,
} from './dto/transfers.dto';

@ApiTags('transfers')
@ApiBearerAuth()
@Controller('transfers')
@UseGuards(AuthGuard)
export class TransfersController {
  constructor(private transfers: TransfersService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Lista de transferencias del usuario' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  findAll(
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @CurrentUser() user: any,
  ) {
    return this.transfers.findMyTransfers(user.id, user.profile?.role as Role, page, limit);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Detalle de la transferencia' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  findOne(@Param('id') id: string) { return this.transfers.findOne(id); }

  @Post()
  @ApiResponse({ status: 201, description: 'Transferencia solicitada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  request(@Body() body: CreateTransferDto, @CurrentUser() user: any) {
    return this.transfers.requestTransfer(body, user.id);
  }

  @Patch(':id/accept')
  @ApiResponse({ status: 200, description: 'Transferencia aceptada' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  accept(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transfers.acceptTransfer(id, user.id);
  }

  @Patch(':id/reject')
  @ApiResponse({ status: 200, description: 'Transferencia rechazada' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  reject(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transfers.rejectTransfer(id, user.id);
  }

  @Patch(':id/counter')
  @ApiResponse({ status: 200, description: 'Contraoferta enviada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  counter(@Param('id') id: string, @Body() body: CounterOfferDto, @CurrentUser() user: any) {
    return this.transfers.counterOffer(id, Number(body.amount), body.message, user.id);
  }

  @Patch(':id/accept-counter')
  @ApiResponse({ status: 200, description: 'Contraoferta aceptada' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  acceptCounter(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transfers.acceptCounterOffer(id, user.id);
  }

  @Patch(':id/payment')
  @ApiResponse({ status: 200, description: 'Pago registrado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  registerPayment(
    @Param('id') id: string,
    @Body() body: RegisterPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.transfers.registerPayment(id, body.evidence ?? body.evidenceContent ?? '', user.id);
  }

  @Patch(':id/validate')
  @ApiResponse({ status: 200, description: 'Pago validado' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 403, description: 'Se requiere rol autorizado para validar pagos' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  validate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transfers.validatePayment(id, user.id, user.profile?.role as Role);
  }

  @Patch(':id/release')
  @ApiResponse({ status: 200, description: 'Token liberado al comprador' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 403, description: 'Se requiere rol autorizado para liberar tokens' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  release(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transfers.releaseToken(id, user.id, user.profile?.role as Role);
  }

  @Patch(':id/cancel')
  @ApiResponse({ status: 200, description: 'Transferencia cancelada' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transfers.cancelTransfer(id, user.id);
  }

  /** SELF-CUSTODY: devuelve el XDR sin firmar de la transferencia (no custodial). */
  @Post(':id/build-xdr')
  @ApiResponse({ status: 200, description: 'XDR de transferencia generado' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  buildXdr(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transfers.buildTransferXdr(id, user.id);
  }

  /** SELF-CUSTODY: somete el XDR firmado por el vendedor (Freighter) a Horizon. */
  @Post(':id/submit-xdr')
  @ApiResponse({ status: 200, description: 'XDR enviado a la red Stellar' })
  @ApiResponse({ status: 400, description: 'XDR inválido' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  submitXdr(@Param('id') id: string, @Body() body: SubmitXdrDto, @CurrentUser() user: any) {
    return this.transfers.submitTransferXdr(id, body.signedXdr, user.id);
  }

  /** COMPRA INSTANTÁNEA (pago con wallet/USDC): XDR atómico sin firmar. */
  @Post('instant-buy/:bondTokenId/build-xdr')
  @ApiResponse({ status: 200, description: 'XDR de compra instantánea generado' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Bono no encontrado' })
  buildInstantBuy(@Param('bondTokenId') bondTokenId: string, @CurrentUser() user: any) {
    return this.transfers.buildInstantBuyXdr(bondTokenId, user.id);
  }

  /** COMPRA INSTANTÁNEA: somete el XDR firmado por el comprador a Horizon. */
  @Post('instant-buy/:bondTokenId/submit-xdr')
  @ApiResponse({ status: 200, description: 'Compra instantánea ejecutada' })
  @ApiResponse({ status: 400, description: 'XDR inválido' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Bono no encontrado' })
  submitInstantBuy(
    @Param('bondTokenId') bondTokenId: string,
    @Body() body: SubmitXdrDto,
    @CurrentUser() user: any,
  ) {
    return this.transfers.submitInstantBuy(bondTokenId, body.signedXdr, user.id);
  }

  /** NEGOCIACIÓN + WALLET: XDR DvP tras aceptación (comprador firma con Freighter). */
  @Post(':id/build-wallet-payment-xdr')
  @ApiResponse({ status: 200, description: 'XDR de pago con wallet generado' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  buildWalletPayment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transfers.buildNegotiatedWalletPaymentXdr(id, user.id);
  }

  @Post(':id/submit-wallet-payment-xdr')
  @ApiResponse({ status: 200, description: 'Pago con wallet ejecutado' })
  @ApiResponse({ status: 400, description: 'XDR inválido' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  submitWalletPayment(
    @Param('id') id: string,
    @Body() body: SubmitXdrDto,
    @CurrentUser() user: any,
  ) {
    return this.transfers.submitNegotiatedWalletPaymentXdr(id, body.signedXdr, user.id);
  }

  /** Dueño solicita al TSE retirar el bono del escrow (cancelación con disputa). */
  @Patch(':id/request-return')
  @ApiResponse({ status: 200, description: 'Retorno solicitado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  requestReturn(@Param('id') id: string, @Body() body: RequestReturnDto, @CurrentUser() user: any) {
    return this.transfers.requestReturn(id, body?.reason ?? '', user.id);
  }

  /** TSE aprueba el retorno: devuelve el token on-chain al dueño. */
  @Patch(':id/approve-return')
  @ApiResponse({ status: 200, description: 'Retorno aprobado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 403, description: 'Se requiere rol tse o admin' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  approveReturn(@Param('id') id: string, @Body() body: ReturnDecisionDto, @CurrentUser() user: any) {
    return this.transfers.approveReturn(id, body?.notes, user.id, user.profile?.role as Role);
  }

  /** TSE rechaza la solicitud de retorno. */
  @Patch(':id/reject-return')
  @ApiResponse({ status: 200, description: 'Retorno rechazado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'Token no proporcionado o inválido' })
  @ApiResponse({ status: 403, description: 'Se requiere rol tse o admin' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  rejectReturn(@Param('id') id: string, @Body() body: ReturnDecisionDto, @CurrentUser() user: any) {
    return this.transfers.rejectReturn(id, body?.notes, user.id, user.profile?.role as Role);
  }
}
