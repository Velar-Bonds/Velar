import { Controller, Get, Param, Query } from '@nestjs/common';
import type { ReaderLocale } from '@velar/types';
import { Public } from '../auth/public.decorator';
import { ContractsService } from './contracts.service';

const SUPPORTED_LOCALES: ReaderLocale[] = ['es', 'en'];

function normalizeLocale(value?: string): ReaderLocale {
  return SUPPORTED_LOCALES.includes(value as ReaderLocale) ? (value as ReaderLocale) : 'es';
}

/**
 * Endpoints PÚBLICOS (sin auth) del lector de contratos (#39). Son públicos
 * porque el lector también se usa en la página de verificación pública
 * (`/verificar/[id]`). Solo exponen contenido de comprensión: glosario y
 * explicaciones en lenguaje simple. El contrato legal no se reemplaza.
 */
@Public()
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Get('glossary')
  getGlossary(@Query('locale') locale?: string) {
    return this.contracts.getGlossary(normalizeLocale(locale));
  }

  @Get(':bondId/reader')
  getReader(@Param('bondId') bondId: string, @Query('locale') locale?: string) {
    return this.contracts.getReader(bondId, normalizeLocale(locale));
  }
}
