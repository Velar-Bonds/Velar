import { Injectable } from '@nestjs/common';
import {
  AuditEventType,
  EscalationLevel,
  EscalationLadderStep,
  SlaCheckResult,
  SlaConfig,
} from '@velar/types';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { computeCompliance } from '../reports/domain/deadlines';
import { checkEscalation } from './sla-engine';

const CLOSED_STATUSES = ['borrador', 'aprobado', 'rechazado'];

const DEFAULT_LADDER: EscalationLadderStep[] = [
  { level: EscalationLevel.LEVEL_1, afterDays: 3, notify: ['tse'] },
  { level: EscalationLevel.LEVEL_2, afterDays: 7, notify: ['tse', 'admin'] },
  { level: EscalationLevel.LEVEL_3, afterDays: 14, notify: ['admin'] },
];

@Injectable()
export class SlaService {
  constructor(
    private supabase: SupabaseService,
    private audit: AuditService,
  ) {}

  async getConfig(): Promise<SlaConfig> {
    const { data, error } = await this.supabase.admin
      .from('sla_escalation_config')
      .select('ladder')
      .eq('country_code', 'GLOBAL')
      .single();

    if (error || !data?.ladder) {
      return { ladder: DEFAULT_LADDER };
    }

    return { ladder: data.ladder as EscalationLadderStep[] };
  }

  async checkAndEscalate(now: string): Promise<SlaCheckResult[]> {
    const { data: rows } = await this.supabase.admin
      .from('reports')
      .select('id, party_id, period_year, period_month, status, submitted_at');

    const reports = (rows ?? []).filter(
      (r) => !CLOSED_STATUSES.includes(r.status as string),
    );

    if (reports.length === 0) {
      return [];
    }

    const reportIds = reports.map((r) => r.id as string);
    const { data: slaRows } = await this.supabase.admin
      .from('report_sla_state')
      .select('report_id, current_level')
      .in('report_id', reportIds);

    const slaByReport = new Map<string, EscalationLevel>();
    for (const row of slaRows ?? []) {
      slaByReport.set(
        row.report_id as string,
        (row.current_level as EscalationLevel) ?? EscalationLevel.NONE,
      );
    }

    const ladder = (await this.getConfig()).ladder;
    const results: SlaCheckResult[] = [];

    for (const report of reports) {
      const reportId = report.id as string;
      const currentLevel =
        slaByReport.get(reportId) ?? EscalationLevel.NONE;

      const compliance = computeCompliance({
        periodYear: report.period_year as number,
        periodMonth: report.period_month as number,
        config: { dueDayOfMonth: 15, graceDays: 5 },
        submittedAt: (report.submitted_at as string | null) ?? null,
        now,
      });

      const result = checkEscalation(
        reportId,
        compliance,
        ladder,
        currentLevel,
      );
      results.push(result);

      if (result.escalated) {
        await this.upsertSlaState(reportId, result.newLevel, now);
        // NotificationsService skipped — no NotificationType for SLA escalation yet.
        await this.audit.emit({
          type: AuditEventType.REPORT_SLA_ESCALATED,
          actorId: null,
          payload: {
            reportId,
            previousLevel: result.previousLevel,
            newLevel: result.newLevel,
          },
        });
      }
    }

    return results;
  }

  private async upsertSlaState(
    reportId: string,
    currentLevel: EscalationLevel,
    now: string,
  ): Promise<void> {
    const { data: existing } = await this.supabase.admin
      .from('report_sla_state')
      .select('report_id')
      .eq('report_id', reportId)
      .single();

    const patch = {
      current_level: currentLevel,
      last_escalated_at: now,
      breached: true,
      updated_at: now,
    };

    if (existing) {
      await this.supabase.admin
        .from('report_sla_state')
        .update(patch)
        .eq('report_id', reportId);
    } else {
      await this.supabase.admin.from('report_sla_state').insert({
        report_id: reportId,
        ...patch,
      });
    }
  }
}
