import { Module } from '@nestjs/common';
import { EscrowService } from './escrow.service';

@Module({ providers: [EscrowService], exports: [EscrowService] })
export class EscrowModule {}
