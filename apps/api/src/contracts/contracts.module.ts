import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

/**
 * Contract reading & comprehension experience (#39). SupabaseModule is global,
 * so SupabaseService is available for injection without importing it here.
 */
@Module({
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
