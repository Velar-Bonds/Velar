import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { StellarBondService } from './stellar-bond.service';
import { TrustlessWorkService } from './trustless-work.service';

@Module({
  providers: [WalletService, StellarBondService, TrustlessWorkService],
  exports: [WalletService, StellarBondService, TrustlessWorkService],
})
export class EscrowModule {}
