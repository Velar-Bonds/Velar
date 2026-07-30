import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { SupabaseModule } from '../../common/supabase/supabase.module';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}
