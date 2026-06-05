import { Module } from '@nestjs/common';
import { ExplorerController } from './explorer.controller';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { EscrowModule } from '../escrow/escrow.module';

@Module({
  imports: [SupabaseModule, EscrowModule],
  controllers: [ExplorerController],
})
export class ExplorerModule {}
