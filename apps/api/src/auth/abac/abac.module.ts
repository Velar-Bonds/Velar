import { Module } from '@nestjs/common';
import { AbacService } from './abac.service';

@Module({ providers: [AbacService], exports: [AbacService] })
export class AbacModule {}
