import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EscrowModule } from '../escrow/escrow.module';

@Module({
  imports: [EscrowModule],
  providers: [AuthGuard, AuthService],
  controllers: [AuthController],
  exports: [AuthGuard],
})
export class AuthModule {}
