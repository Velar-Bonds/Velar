import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { StellarBondService } from './stellar-bond.service';

@Module({
  providers: [WalletService, StellarBondService],
  exports: [WalletService, StellarBondService],
})
export class EscrowModule {}
