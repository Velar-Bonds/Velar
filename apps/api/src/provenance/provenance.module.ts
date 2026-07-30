import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ProvenanceController, PublicProvenanceController } from './provenance.controller';
import { ProvenanceService } from './provenance.service';

/**
 * Provenance & traceability explorer (issue #36). Depends on AuditModule for the
 * raw ProvenanceInput (bond + append-only events + transfers).
 */
@Module({
  imports: [AuditModule],
  providers: [ProvenanceService],
  controllers: [ProvenanceController, PublicProvenanceController],
  exports: [ProvenanceService],
})
export class ProvenanceModule {}
