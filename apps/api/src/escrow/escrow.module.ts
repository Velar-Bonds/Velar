import { Module } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { WalletService } from './wallet.service';

@Module({
  providers: [EscrowService, WalletService],
  exports: [EscrowService, WalletService],
})
export class EscrowModule {}
