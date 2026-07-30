import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  ComplianceForecast,
  ComplianceOverview,
  ComplianceStatus,
  PartyComplianceMetric,
  ReviewerWorkload,
  Role,
} from '@velar/types';
import { SupabaseService } from '../common/supabase/supabase.service';
import { computeComplianceForPeriods } from '../reports/domain/deadlines';
import {
  computeComplianceOverview,
  computePartyComplianceMetric,
  computeReviewerWorkload,
} from './metrics';
import { forecastOverdue, OverdueHistoryPoint } from './forecast';

@Injectable()
export class ComplianceAnalyticsService {
  constructor(private supabase: SupabaseService) {}

  private assertAuth(role: Role) {
    if (role !== 'tse' && role !== 'admin') {
      throw new ForbiddenException('Solo TSE/admin');
    }
  }

  private async getDeadlineConfig(): Promise<{
    dueDayOfMonth: number;
    graceDays: number;
  }> {
    const { data, error } = await this.supabase.admin
      .from('report_deadlines')
      .select('due_day_of_month, grace_days')
      .eq('country_code', 'GLOBAL')
      .single();

    if (error || !data) {
      return { dueDayOfMonth: 15, graceDays: 5 };
    }

    return {
      dueDayOfMonth: data.due_day_of_month as number,
      graceDays: data.grace_days as number,
    };
  }

  async overview(role: Role, now: string): Promise<ComplianceOverview> {
    this.assertAuth(role);

    const { data: rows } = await this.supabase.admin
      .from('reports')
      .select('id, period_year, period_month, submitted_at');

    const config = await this.getDeadlineConfig();
    const compliances = computeComplianceForPeriods(
      (rows ?? []).map((r) => ({
        periodYear: r.period_year as number,
        periodMonth: r.period_month as number,
        submittedAt: (r.submitted_at as string | null) ?? null,
      })),
      config,
      now,
    );

    return computeComplianceOverview(compliances);
  }

  async byParty(role: Role, now: string): Promise<PartyComplianceMetric[]> {
    this.assertAuth(role);

    const { data: rows } = await this.supabase.admin
      .from('reports')
      .select(
        'id, party_id, period_year, period_month, submitted_at, parties(name)',
      );

    const config = await this.getDeadlineConfig();
    const byParty = new Map<
      string,
      {
        partyName: string;
        periods: Array<{
          periodYear: number;
          periodMonth: number;
          submittedAt: string | null;
        }>;
      }
    >();

    for (const row of rows ?? []) {
      const partyId = row.party_id as string;
      if (!partyId) continue;

      const parties = row.parties as { name?: string } | null;
      const partyName = parties?.name ?? partyId;
      const entry = byParty.get(partyId) ?? { partyName, periods: [] };
      entry.partyName = partyName;
      entry.periods.push({
        periodYear: row.period_year as number,
        periodMonth: row.period_month as number,
        submittedAt: (row.submitted_at as string | null) ?? null,
      });
      byParty.set(partyId, entry);
    }

    const metrics = [...byParty.entries()].map(([partyId, group]) => {
      const compliances = computeComplianceForPeriods(
        group.periods,
        config,
        now,
      );
      return computePartyComplianceMetric(partyId, group.partyName, compliances);
    });

    metrics.sort((a, b) => a.complianceRate - b.complianceRate);
    return metrics;
  }

  async reviewerWorkload(role: Role): Promise<ReviewerWorkload[]> {
    this.assertAuth(role);

    const { data: rows } = await this.supabase.admin
      .from('reports')
      .select(
        'id, assigned_reviewer_id, reviewed_by, reviewed_at, created_at, assignee:profiles!reports_assigned_reviewer_id_fkey(full_name)',
      );

    const reportIds = (rows ?? [])
      .map((r) => r.id as string)
      .filter(Boolean);

    const slaByReport = new Map<string, boolean>();
    if (reportIds.length > 0) {
      const { data: slaRows } = await this.supabase.admin
        .from('report_sla_state')
        .select('report_id, breached')
        .in('report_id', reportIds);

      for (const row of slaRows ?? []) {
        slaByReport.set(row.report_id as string, Boolean(row.breached));
      }
    }

    const byReviewer = new Map<
      string,
      {
        reviewerName: string;
        reports: Array<{
          id: string;
          reviewedAt: string | null;
          createdAt: string;
        }>;
      }
    >();

    for (const row of rows ?? []) {
      const reviewerId = row.assigned_reviewer_id as string | null;
      if (!reviewerId) continue;

      const assignee = row.assignee as { full_name?: string } | null;
      const entry = byReviewer.get(reviewerId) ?? {
        reviewerName: assignee?.full_name ?? reviewerId,
        reports: [],
      };
      if (assignee?.full_name) {
        entry.reviewerName = assignee.full_name;
      }
      entry.reports.push({
        id: row.id as string,
        reviewedAt: (row.reviewed_at as string | null) ?? null,
        createdAt: row.created_at as string,
      });
      byReviewer.set(reviewerId, entry);
    }

    return [...byReviewer.entries()].map(([reviewerId, group]) => {
      const decisions = group.reports
        .filter((r) => r.reviewedAt != null)
        .map((r) => ({
          startedAt: r.createdAt,
          decidedAt: r.reviewedAt as string,
        }));

      const onTimeDecisions = group.reports.filter(
        (r) => r.reviewedAt != null && !slaByReport.get(r.id),
      ).length;

      return computeReviewerWorkload({
        reviewerId,
        reviewerName: group.reviewerName,
        assignedCount: group.reports.length,
        decisions,
        onTimeDecisions,
      });
    });
  }

  async forecast(
    role: Role,
    now: string,
    horizonMonths = 3,
  ): Promise<ComplianceForecast> {
    this.assertAuth(role);

    const { data: rows } = await this.supabase.admin
      .from('reports')
      .select('period_year, period_month, submitted_at');

    const config = await this.getDeadlineConfig();
    const compliances = computeComplianceForPeriods(
      (rows ?? []).map((r) => ({
        periodYear: r.period_year as number,
        periodMonth: r.period_month as number,
        submittedAt: (r.submitted_at as string | null) ?? null,
      })),
      config,
      now,
    );

    const bucket = new Map<string, OverdueHistoryPoint>();
    for (const c of compliances) {
      if (
        c.status !== ComplianceStatus.OVERDUE &&
        c.status !== ComplianceStatus.MISSING
      ) {
        continue;
      }
      const key = `${c.periodYear}-${c.periodMonth}`;
      const existing = bucket.get(key) ?? {
        periodYear: c.periodYear,
        periodMonth: c.periodMonth,
        overdueCount: 0,
      };
      existing.overdueCount += 1;
      bucket.set(key, existing);
    }

    const history = [...bucket.values()]
      .sort((a, b) => {
        if (a.periodYear !== b.periodYear) return a.periodYear - b.periodYear;
        return a.periodMonth - b.periodMonth;
      })
      .slice(-12);

    const anchor = new Date(now);
    return forecastOverdue(
      history,
      horizonMonths,
      anchor.getUTCFullYear(),
      anchor.getUTCMonth() + 1,
    );
  }
}
