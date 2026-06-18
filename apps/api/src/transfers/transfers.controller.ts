import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestTransferInput, Role } from '@velar/types';

@Controller('transfers')
@UseGuards(AuthGuard)
export class TransfersController {
  constructor(private transfers: TransfersService) {}

  @Get()
  findAll(
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @CurrentUser() user: any,
  ) {
    return this.transfers.findMyTransfers(user.id, user.profile?.role as Role, page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.transfers.findOne(id); }

  @Post()
  request(@Body() body: RequestTransferInput, @CurrentUser() user: any) {
    return this.transfers.requestTransfer(body, user.id);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transfers.acceptTransfer(id, user.id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transfers.rejectTransfer(id, user.id);
  }

  @Patch(':id/counter')
  counter(@Param('id') id: string, @Body() body: { amount: number; message?: string }, @CurrentUser() user: any) {
    return this.transfers.counterOffer(id, Number(body.amount), body.message, user.id);
  }

  @Patch(':id/accept-counter')
  acceptCounter(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transfers.acceptCounterOffer(id, user.id);
  }

  @Patch(':id/payment')
  registerPayment(
    @Param('id') id: string,
    @Body() body: { evidence?: string; evidenceContent?: string },
    @CurrentUser() user: any,
  ) {
    return this.transfers.registerPayment(id, body.evidence ?? body.evidenceContent ?? '', user.id);
  }

  @Patch(':id/validate')
  validate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transfers.validatePayment(id, user.id, user.profile?.role as Role);
  }

  @Patch(':id/release')
  release(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transfers.releaseToken(id, user.id, user.profile?.role as Role);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transfers.cancelTransfer(id, user.id);
  }

  /** Dueño solicita al TSE retirar el bono del escrow (cancelación con disputa). */
  @Patch(':id/request-return')
  requestReturn(@Param('id') id: string, @Body() body: { reason?: string }, @CurrentUser() user: any) {
    return this.transfers.requestReturn(id, body?.reason ?? '', user.id);
  }

  /** TSE aprueba el retorno: devuelve el token on-chain al dueño. */
  @Patch(':id/approve-return')
  approveReturn(@Param('id') id: string, @Body() body: { notes?: string }, @CurrentUser() user: any) {
    return this.transfers.approveReturn(id, body?.notes, user.id, user.profile?.role as Role);
  }

  /** TSE rechaza la solicitud de retorno. */
  @Patch(':id/reject-return')
  rejectReturn(@Param('id') id: string, @Body() body: { notes?: string }, @CurrentUser() user: any) {
    return this.transfers.rejectReturn(id, body?.notes, user.id, user.profile?.role as Role);
  }
}
