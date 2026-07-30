import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ComplianceAnalyticsService } from './compliance-analytics.service';
import { SupabaseService } from '../common/supabase/supabase.service';

type FakeRow = Record<string, unknown>;
let dbStore: Record<string, FakeRow[]> = {};

function resetDb() {
  dbStore = {
    reports: [],
    report_deadlines: [],
    report_sla_state: [],
  };
}

function mockSupabase(): SupabaseService {
  const builder = (table: string) => {
    const ctx: {
      table: string;
      filters: Array<[string, unknown]>;
      inFilters: Array<[string, unknown[]]>;
    } = { table, filters: [], inFilters: [] };

    const matching = () => {
      let rows = dbStore[ctx.table] ?? [];
      for (const [col, val] of ctx.filters) {
        rows = rows.filter((r) => r[col] === val);
      }
      for (const [col, vals] of ctx.inFilters) {
        rows = rows.filter((r) => vals.includes(r[col]));
      }
      return rows;
    };

    const exec = () => Promise.resolve({ data: matching(), error: null });

    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: (col: string, val: unknown) => {
        ctx.filters.push([col, val]);
        return chain;
      },
      in: (col: string, vals: unknown[]) => {
        ctx.inFilters.push([col, vals]);
        return chain;
      },
      single: () => {
        const row = matching()[0] ?? null;
        return Promise.resolve({
          data: row,
          error: row ? null : { message: 'not found', code: 'PGRST116' },
        });
      },
      then: (resolve: (value: unknown) => unknown) => exec().then(resolve),
    };
    return chain;
  };

  return { admin: { from: builder } } as unknown as SupabaseService;
}

const NOW = '2026-06-20T12:00:00Z';

function makeReport(overrides: FakeRow = {}): FakeRow {
  return {
    id: 'report-1',
    party_id: 'party-a',
    period_year: 2026,
    period_month: 4,
    submitted_at: '2026-05-10T00:00:00Z',
    assigned_reviewer_id: null,
    reviewed_at: null,
    created_at: '2026-05-01T00:00:00Z',
    parties: { name: 'Partido Alpha' },
    assignee: null,
    ...overrides,
  };
}

describe('ComplianceAnalyticsService', () => {
  let service: ComplianceAnalyticsService;

  beforeEach(async () => {
    resetDb();
    dbStore.report_deadlines.push({
      due_day_of_month: 15,
      grace_days: 5,
      country_code: 'GLOBAL',
    });

    const mod = await Test.createTestingModule({
      providers: [
        ComplianceAnalyticsService,
        { provide: SupabaseService, useValue: mockSupabase() },
      ],
    }).compile();

    service = mod.get(ComplianceAnalyticsService);
  });

  it('rejects non TSE/admin callers', async () => {
    await expect(service.overview('emisor', NOW)).rejects.toThrow(
      ForbiddenException,
    );
  });

  describe('overview', () => {
    it('returns zeroed overview with no reports', async () => {
      const result = await service.overview('tse', NOW);
      expect(result).toEqual({
        totalReports: 0,
        onTimeRate: 0,
        overdueCount: 0,
        atRiskCount: 0,
        missingCount: 0,
      });
    });

    it('computes overview from one on-time report', async () => {
      dbStore.reports.push(makeReport());
      const result = await service.overview('admin', NOW);
      expect(result.totalReports).toBe(1);
      expect(result.onTimeRate).toBe(1);
      expect(result.overdueCount).toBe(0);
    });
  });

  describe('byParty', () => {
    it('returns empty array with no reports', async () => {
      expect(await service.byParty('tse', NOW)).toEqual([]);
    });

    it('groups by party and sorts worst compliance first', async () => {
      dbStore.reports.push(
        makeReport({
          id: 'r1',
          party_id: 'party-good',
          parties: { name: 'Good Party' },
          submitted_at: '2026-05-10T00:00:00Z',
        }),
        makeReport({
          id: 'r2',
          party_id: 'party-bad',
          parties: { name: 'Bad Party' },
          submitted_at: null,
          period_month: 1,
        }),
      );

      const result = await service.byParty('tse', NOW);
      expect(result).toHaveLength(2);
      expect(result[0].partyId).toBe('party-bad');
      expect(result[0].complianceRate).toBeLessThan(result[1].complianceRate);
    });
  });

  describe('reviewerWorkload', () => {
    it('returns empty array when no assigned reviewers', async () => {
      dbStore.reports.push(makeReport());
      expect(await service.reviewerWorkload('tse')).toEqual([]);
    });

    it('aggregates assigned reports and SLA attainment', async () => {
      dbStore.reports.push(
        makeReport({
          id: 'r1',
          assigned_reviewer_id: 'rev-1',
          reviewed_at: '2026-05-03T00:00:00Z',
          created_at: '2026-05-01T00:00:00Z',
          assignee: { full_name: 'Ana Revisora' },
        }),
        makeReport({
          id: 'r2',
          assigned_reviewer_id: 'rev-1',
          reviewed_at: '2026-05-08T00:00:00Z',
          created_at: '2026-05-02T00:00:00Z',
          assignee: { full_name: 'Ana Revisora' },
        }),
        makeReport({
          id: 'r3',
          assigned_reviewer_id: 'rev-1',
          reviewed_at: null,
          assignee: { full_name: 'Ana Revisora' },
        }),
      );
      dbStore.report_sla_state.push({ report_id: 'r2', breached: true });

      const result = await service.reviewerWorkload('admin');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        reviewerId: 'rev-1',
        reviewerName: 'Ana Revisora',
        assignedCount: 3,
        decidedCount: 2,
        slaAttainmentRate: 0.5,
      });
      expect(result[0].avgDecisionHours).not.toBeNull();
    });
  });

  describe('forecast', () => {
    it('returns moving_average forecast with sparse history', async () => {
      dbStore.reports.push(
        makeReport({
          id: 'r1',
          submitted_at: null,
          period_year: 2026,
          period_month: 1,
        }),
      );

      const result = await service.forecast('tse', NOW, 2);
      expect(result.method).toBe('moving_average');
      expect(result.horizonMonths).toBe(2);
      expect(result.points).toHaveLength(2);
      expect(result.points[0].periodYear).toBe(2026);
      expect(result.points[0].periodMonth).toBe(7);
    });

    it('falls back to default deadline config when lookup fails', async () => {
      dbStore.report_deadlines = [];
      dbStore.reports.push(makeReport());
      const result = await service.forecast('admin', NOW, 1);
      expect(result.points).toHaveLength(1);
    });
  });
});
