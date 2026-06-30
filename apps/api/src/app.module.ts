import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
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
import { ExplorerModule } from './explorer/explorer.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { RolesGuard } from './auth/roles.guard';
import { AuthGuard } from './auth/auth.guard';

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: parsePositiveInt(config.get<string>('THROTTLE_TTL'), 60000),
          limit: parsePositiveInt(config.get<string>('THROTTLE_LIMIT'), 100),
        },
      ],
    }),
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
    ExplorerModule,
    NotificationsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
