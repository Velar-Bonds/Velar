import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ContractsController } from './contracts.controller';
import { ContractEngineController } from './contract-engine.controller';
import { ContractsService } from './contracts.service';

/**
 * Contract intelligence & document assembly engine (#38) + the contract
 * reading & comprehension experience (#39) it feeds. SupabaseModule is
 * global, so SupabaseService is available for injection without importing it
 * here. `AuditModule` is imported for `AuditService.resolveTokenId` /
 * `getProvenanceInput`, reused instead of re-fetching/re-mapping bonds and
 * transfers from scratch.
 */
@Module({
  imports: [AuditModule],
  controllers: [ContractsController, ContractEngineController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
