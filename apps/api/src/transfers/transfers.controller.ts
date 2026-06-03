import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestTransferInput, Role } from '@velar/types';

@Controller('transfers')
@UseGuards(AuthGuard)
export class TransfersController {
  constructor(private transfers: TransfersService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.transfers.findMyTransfers(user.id, user.profile?.role as Role);
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
}
