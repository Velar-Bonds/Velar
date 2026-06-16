import { Module } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { EscrowModule } from '../escrow/escrow.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuthModule, AuditModule, EscrowModule, NotificationsModule],
  providers: [TransfersService],
  controllers: [TransfersController],
})
export class TransfersModule {}
