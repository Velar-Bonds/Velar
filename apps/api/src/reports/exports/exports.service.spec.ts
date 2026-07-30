import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { ExportsService } from './exports.service';

type FakeRow = Record<string, unknown>;

let dbStore: Record<string, FakeRow[]> = {};

function resetDb() {
  dbStore = {
    reports: [],
    report_line_items: [],
    rule_evaluations: [],
  };
}

function fakeSupabase(): SupabaseService {
  const from = (table: string) => {
    const ctx: {
      filters: Array<[string, unknown]>;
      ascending: boolean | null;
      orderCol: string | null;
      limitN: number | null;
    } = {
      filters: [],
      ascending: null,
      orderCol: null,
      limitN: null,
    };

    const matching = (): FakeRow[] => {
      let rows = [...(dbStore[table] ?? [])];
      for (const [col, val] of ctx.filters) {
        rows = rows.filter((r) => r[col] === val);
      }
      if (ctx.orderCol) {
        const col = ctx.orderCol;
        const asc = ctx.ascending !== false;
        rows.sort((a, b) => {
          const av = a[col];
          const bv = b[col];
          if (av === bv) return 0;
          if (av == null) return asc ? -1 : 1;
          if (bv == null) return asc ? 1 : -1;
          return asc
            ? String(av).localeCompare(String(bv))
            : String(bv).localeCompare(String(av));
        });
      }
      if (ctx.limitN != null) {
        rows = rows.slice(0, ctx.limitN);
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
      order: (col: string, opts?: { ascending?: boolean }) => {
        ctx.orderCol = col;
        ctx.ascending = opts?.ascending ?? true;
        return chain;
      },
      limit: (n: number) => {
        ctx.limitN = n;
        return chain;
      },
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        exec().then(resolve, reject),
    };

    return chain;
  };

  return { admin: { from } } as unknown as SupabaseService;
}

function makeReport(overrides: FakeRow = {}): FakeRow {
  return {
    id: 'rep-1',
    period_year: 2026,
    period_month: 1,
    status: 'aprobado',
    current_version: 2,
    reviewed_by: 'tse-1',
    reviewed_at: '2026-02-01T00:00:00.000Z',
    created_at: '2026-01-15T00:00:00.000Z',
    parties: { name: 'Partido Alpha' },
    ...overrides,
  };
}

describe('ExportsService', () => {
  let service: ExportsService;

  beforeEach(async () => {
    resetDb();
    const mod = await Test.createTestingModule({
      providers: [
        ExportsService,
        { provide: SupabaseService, useValue: fakeSupabase() },
      ],
    }).compile();
    service = mod.get(ExportsService);
  });

  it('rejects non TSE/admin callers', async () => {
    await expect(service.getDecisionRows('emisor')).rejects.toThrow(ForbiddenException);
  });

  it('returns empty array when there are no reports', async () => {
    const rows = await service.getDecisionRows('tse');
    expect(rows).toEqual([]);
  });

  it('maps a single report with line-item sum and latest rule evaluation', async () => {
    dbStore.reports.push(makeReport());
    dbStore.report_line_items.push(
      { report_id: 'rep-1', amount: 100 },
      { report_id: 'rep-1', amount: '50.5' },
    );
    dbStore.rule_evaluations.push(
      {
        report_id: 'rep-1',
        rule_set_version: 'v1',
        overall_severity: 'LOW',
        evaluated_at: '2026-01-20T00:00:00.000Z',
      },
      {
        report_id: 'rep-1',
        rule_set_version: 'v2',
        overall_severity: 'HIGH',
        evaluated_at: '2026-01-25T00:00:00.000Z',
      },
    );

    const rows = await service.getDecisionRows('admin');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      reportId: 'rep-1',
      partyName: 'Partido Alpha',
      periodYear: 2026,
      periodMonth: 1,
      status: 'aprobado',
      declaredTotal: 150.5,
      reviewedBy: 'tse-1',
      reviewedAt: '2026-02-01T00:00:00.000Z',
      ruleSetVersion: 'v2',
      overallSeverity: 'HIGH',
    });
  });

  it('returns null rule fields when no evaluations exist', async () => {
    dbStore.reports.push(makeReport({ id: 'rep-lonely' }));
    dbStore.report_line_items.push({ report_id: 'rep-lonely', amount: 10 });

    const rows = await service.getDecisionRows('tse');
    expect(rows).toHaveLength(1);
    expect(rows[0].ruleSetVersion).toBeNull();
    expect(rows[0].overallSeverity).toBeNull();
    expect(rows[0].declaredTotal).toBe(10);
  });

  it('returns several reports in created_at ascending order', async () => {
    dbStore.reports.push(
      makeReport({
        id: 'rep-later',
        created_at: '2026-03-01T00:00:00.000Z',
        parties: { name: 'Later' },
      }),
      makeReport({
        id: 'rep-earlier',
        created_at: '2026-01-01T00:00:00.000Z',
        parties: { name: 'Earlier' },
      }),
      makeReport({
        id: 'rep-mid',
        created_at: '2026-02-01T00:00:00.000Z',
        parties: { name: 'Mid' },
      }),
    );

    const rows = await service.getDecisionRows('tse');
    expect(rows.map((r) => r.reportId)).toEqual(['rep-earlier', 'rep-mid', 'rep-later']);
    expect(rows.map((r) => r.partyName)).toEqual(['Earlier', 'Mid', 'Later']);
  });
});
