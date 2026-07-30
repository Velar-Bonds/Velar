import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@velar/types';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { DecisionExportRow } from './csv-export';

@Injectable()
export class ExportsService {
  constructor(private supabase: SupabaseService) {}

  private assertAuth(role: Role) {
    if (role !== 'tse' && role !== 'admin') {
      throw new ForbiddenException('Solo TSE/admin');
    }
  }

  async getDecisionRows(role: Role): Promise<DecisionExportRow[]> {
    this.assertAuth(role);
    const db = this.supabase.admin;

    const { data: reports, error } = await db
      .from('reports')
      .select(
        'id, period_year, period_month, status, current_version, reviewed_by, reviewed_at, parties(name)',
      )
      .order('created_at', { ascending: true });

    if (error) throw error;

    const rows: DecisionExportRow[] = [];
    for (const report of reports ?? []) {
      const reportId = report.id as string;

      const { data: lineRows } = await db
        .from('report_line_items')
        .select('amount')
        .eq('report_id', reportId);
      const declaredTotal = (lineRows ?? []).reduce(
        (sum: number, r: { amount?: number | string | null }) => sum + Number(r.amount ?? 0),
        0,
      );

      const { data: evalRows } = await db
        .from('rule_evaluations')
        .select('rule_set_version, overall_severity')
        .eq('report_id', reportId)
        .order('evaluated_at', { ascending: false })
        .limit(1);
      const latestEval = (evalRows ?? [])[0] as
        | { rule_set_version?: string | null; overall_severity?: string | null }
        | undefined;

      const parties = report.parties as { name?: string } | { name?: string }[] | null;
      const partyName = Array.isArray(parties)
        ? (parties[0]?.name ?? '')
        : (parties?.name ?? '');

      rows.push({
        reportId,
        partyName,
        periodYear: Number(report.period_year),
        periodMonth: Number(report.period_month),
        status: String(report.status ?? ''),
        declaredTotal,
        reviewedBy: (report.reviewed_by as string | null) ?? null,
        reviewedAt: (report.reviewed_at as string | null) ?? null,
        ruleSetVersion: latestEval?.rule_set_version ?? null,
        overallSeverity: latestEval?.overall_severity ?? null,
      });
    }

    return rows;
  }
}
