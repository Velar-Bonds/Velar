import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './common/supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { BondsModule } from './bonds/bonds.module';
import { TransfersModule } from './transfers/transfers.module';
import { EscrowModule } from './escrow/escrow.module';
import { AuditModule } from './audit/audit.module';
import { UsersModule } from './users/users.module';
import { PartiesModule } from './parties/parties.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    BondsModule,
    TransfersModule,
    EscrowModule,
    AuditModule,
    UsersModule,
    PartiesModule,
    AnalyticsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
