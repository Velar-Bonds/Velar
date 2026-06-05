import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { StellarBondService } from './stellar-bond.service';
import { TrustlessWorkService } from './trustless-work.service';
import { SorobanBondService } from './soroban-bond.service';

@Module({
  providers: [WalletService, StellarBondService, TrustlessWorkService, SorobanBondService],
  exports: [WalletService, StellarBondService, TrustlessWorkService, SorobanBondService],
})
export class EscrowModule {}
