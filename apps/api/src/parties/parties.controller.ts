import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  findAll() { return this.parties.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.parties.findOne(id); }

  @Post()
  create(@Body() body: CreatePartyDto, @CurrentUser() user: { id: string }) { return this.parties.create(body, user.id); }
}
