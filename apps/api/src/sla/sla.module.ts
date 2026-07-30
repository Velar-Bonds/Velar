import { Module } from '@nestjs/common';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { AuditModule } from '../audit/audit.module';
import { SlaController } from './sla.controller';
import { SlaService } from './sla.service';

@Module({
  imports: [SupabaseModule, AuditModule],
  controllers: [SlaController],
  providers: [SlaService],
  exports: [SlaService],
})
export class SlaModule {}
