import { Controller, Get, HttpException, HttpStatus, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/public.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** Liveness: el proceso responde. Sin dependencias externas. */
  @Get('live')
  live() {
    return this.healthService.liveness();
  }

  /** Readiness: Supabase, Horizon, Soroban RPC y fondeo de wallets. */
  @Get()
  async check(@Res() response: Response): Promise<void> {
    try {
      response.json(await this.healthService.check());
    } catch (error) {
      if (!(error instanceof HttpException) || error.getStatus() !== HttpStatus.SERVICE_UNAVAILABLE) {
        throw error;
      }
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json(error.getResponse());
    }
  }
}
