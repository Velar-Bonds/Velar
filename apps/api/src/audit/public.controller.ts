import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/public.decorator';
import { AuditService } from './audit.service';

/**
 * Endpoints PÚBLICOS (sin autenticación) para transparencia ciudadana.
 * Cualquiera puede verificar el historial on-chain de un bono sin tener cuenta.
 */
@Public()
@Controller('public')
export class PublicController {
  constructor(private audit: AuditService) {}

  @Get('bonds/:idOrToken/traceability')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  traceability(@Param('idOrToken') idOrToken: string) {
    return this.audit.getPublicBondTraceability(idOrToken);
  }
}
