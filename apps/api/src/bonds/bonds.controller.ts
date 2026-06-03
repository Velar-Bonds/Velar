import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { BondsService } from './bonds.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RegisterBondInput, Role } from '@velar/types';

@Controller('bonds')
@UseGuards(AuthGuard)
export class BondsController {
  constructor(private bonds: BondsService) {}

  @Post()
  register(@Body() body: RegisterBondInput, @CurrentUser() user: any) {
    return this.bonds.register(body, user.id, user.profile?.role as Role);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.bonds.findAll(user.id, user.profile?.role as Role);
  }

  @Get('available')
  findAvailable(@CurrentUser() user: any) {
    return this.bonds.findAvailable(user.id);
  }

  @Get(':tokenId')
  findOne(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.bonds.findOne(tokenId, user.id, user.profile?.role as Role);
  }

  @Get(':tokenId/onchain')
  onchain(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.bonds.onchainInfo(tokenId, user.id, user.profile?.role as Role);
  }

  @Patch(':tokenId/freeze')
  freeze(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.bonds.freeze(tokenId, user.id, user.profile?.role as Role);
  }

  @Patch(':tokenId/unfreeze')
  unfreeze(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.bonds.unfreeze(tokenId, user.id, user.profile?.role as Role);
  }

  @Post('hash')
  computeHash(@Body() body: { content: string }) {
    return { hash: BondsService.hashDocument(body.content) };
  }
}
