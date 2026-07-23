import { Injectable } from '@nestjs/common';
import type { BondProvenance } from '@velar/types';
import { AuditService } from '../audit/audit.service';
import { reconstructProvenance } from './provenance-engine';

/**
 * Provenance & traceability (issue #36).
 *
 * Thin orchestration layer: pulls the raw ProvenanceInput from AuditService
 * (which owns all Supabase row-mapping) and runs the pure reconstruction &
 * verification engine. No business rules or I/O live here.
 */
@Injectable()
export class ProvenanceService {
  constructor(private audit: AuditService) {}

  /** Full reconstructed + verified provenance for an authenticated caller. */
  async getBondProvenance(tokenId: string): Promise<BondProvenance> {
    const input = await this.audit.getProvenanceInput(tokenId);
    return reconstructProvenance(input);
  }

  /**
   * Public provenance for citizen verification. Accepts a token_id or the
   * readable bond_id. The output carries no private negotiation messages
   * (transfer lifecycles expose only status/timestamps).
   */
  async getPublicBondProvenance(idOrToken: string): Promise<BondProvenance> {
    const tokenId = await this.audit.resolveTokenId(idOrToken);
    return this.getBondProvenance(tokenId);
  }
}
