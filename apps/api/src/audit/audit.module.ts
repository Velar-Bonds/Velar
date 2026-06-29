import { Module, forwardRef } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { PublicController } from './public.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  // forwardRef rompe el ciclo Auth → Escrow → Audit → Auth.
  imports: [forwardRef(() => AuthModule)],
  providers: [AuditService],
  controllers: [AuditController, PublicController],
  exports: [AuditService],
})
export class AuditModule {}
