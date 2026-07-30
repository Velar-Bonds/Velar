import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { ProvenanceService } from './provenance.service';

/**
 * Provenance & traceability explorer (issue #36).
 *
 * Authenticated read: any signed-in role can reconstruct a bond's full history
 * (the global AuthGuard protects this route since it is not marked @Public).
 */
@ApiTags('provenance')
@ApiBearerAuth()
@Controller('bonds')
export class ProvenanceController {
  constructor(private provenance: ProvenanceService) {}

  @Get(':tokenId/provenance')
  get(@Param('tokenId') tokenId: string) {
    return this.provenance.getBondProvenance(tokenId);
  }
}

/**
 * Public read for citizen verification — no auth. Accepts a token_id or the
 * human-readable bond_id (e.g. "SOL-2026-114").
 */
@Public()
@ApiTags('provenance')
@Controller('public')
export class PublicProvenanceController {
  constructor(private provenance: ProvenanceService) {}

  @Get('bonds/:idOrToken/provenance')
  get(@Param('idOrToken') idOrToken: string) {
    return this.provenance.getPublicBondProvenance(idOrToken);
  }
}
