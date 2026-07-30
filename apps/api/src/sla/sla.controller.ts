import { Controller, Post, UseGuards } from '@nestjs/common';
import { SlaService } from './sla.service';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('sla')
@UseGuards(AuthGuard)
export class SlaController {
  constructor(private sla: SlaService) {}

  @Post('check')
  @Roles('admin')
  check() {
    return this.sla.checkAndEscalate(new Date().toISOString());
  }
}
