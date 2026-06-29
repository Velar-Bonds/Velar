import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { PublicController } from './public.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [AuditService],
  controllers: [AuditController, PublicController],
  exports: [AuditService],
})
export class AuditModule {}
