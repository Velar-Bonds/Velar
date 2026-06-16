import { Module } from '@nestjs/common';
import { BondsService } from './bonds.service';
import { BondsController } from './bonds.controller';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { EscrowModule } from '../escrow/escrow.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuthModule, AuditModule, EscrowModule, NotificationsModule],
  providers: [BondsService],
  controllers: [BondsController],
  exports: [BondsService],
})
export class BondsModule {}
