import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { BondsService } from './bonds.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RegisterBondInput, BondRequestInput, Role } from '@velar/types';

@Controller('bonds')
@UseGuards(AuthGuard)
export class BondsController {
  constructor(private bonds: BondsService) {}

  @Post()
  register(@Body() body: RegisterBondInput, @CurrentUser() user: any) {
    return this.bonds.register(body, user.id, user.profile?.role as Role);
  }

  @Get()
  findAll(
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @CurrentUser() user: any,
  ) {
    return this.bonds.findAll(user.id, user.profile?.role as Role, user.profile?.party_id, page, limit);
  }

  @Get('requests')
  findRequests(@CurrentUser() user: any) {
    return this.bonds.findRequests(user.id, user.profile?.role as Role, user.profile?.party_id);
  }

  @Post('requests')
  createRequest(@Body() body: BondRequestInput, @CurrentUser() user: any) {
    const partyId = user.profile?.party_id;
    if (!partyId) throw new Error('No tenés un partido asociado');
    return this.bonds.requestBond(body, user.id, partyId);
  }

  @Patch('requests/:id/approve')
  approveRequest(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bonds.approveRequest(id, user.id, user.profile?.role as Role);
  }

  @Patch('requests/:id/reject')
  rejectRequest(@Param('id') id: string, @Body() body: { reason?: string }, @CurrentUser() user: any) {
    return this.bonds.rejectRequest(id, body.reason ?? '', user.id, user.profile?.role as Role);
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

  @Patch(':tokenId/issue-onchain')
  issueOnchain(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.bonds.issueOnchain(tokenId, user.id, user.profile?.role as Role);
  }

  @Patch(':tokenId/publish')
  publish(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.bonds.publish(tokenId, user.id);
  }

  /** Lee el contrato Soroban del bono directamente de la cadena y lo devuelve legible. */
  @Get(':tokenId/soroban-details')
  sorobanDetails(@Param('tokenId') tokenId: string, @CurrentUser() user: any) {
    return this.bonds.readSorobanDetails(tokenId, user.id, user.profile?.role as Role);
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
