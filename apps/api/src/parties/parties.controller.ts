import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PartiesService } from './parties.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('parties')
@UseGuards(AuthGuard)
export class PartiesController {
  constructor(private parties: PartiesService) {}

  @Get()
  findAll() { return this.parties.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.parties.findOne(id); }

  @Post()
  create(@Body() body: { code: string; name: string }) { return this.parties.create(body); }
}
