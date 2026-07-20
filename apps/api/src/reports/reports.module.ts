import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportLifecycleController } from './report-lifecycle.controller';
import { ReportLifecycleService } from './report-lifecycle.service';
import { FILE_SCANNER, StubFileScanner } from './files/file-scanner';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuditModule, NotificationsModule, AuthModule],
  controllers: [ReportsController, ReportLifecycleController],
  providers: [
    ReportsService,
    ReportLifecycleService,
    // Antivirus: stub por defecto; se reemplaza por un vendor real vía este token.
    { provide: FILE_SCANNER, useClass: StubFileScanner },
  ],
})
export class ReportsModule {}
