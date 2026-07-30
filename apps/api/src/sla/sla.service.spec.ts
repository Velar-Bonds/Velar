import { Test } from '@nestjs/testing';
import {
  AuditEventType,
  EscalationLevel,
  ReportStatus,
} from '@velar/types';
import { SlaService } from './sla.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';

type FakeRow = Record<string, unknown>;

let dbStore: Record<string, FakeRow[]> = {};
const emitted: Array<{ type: string; payload: Record<string, unknown> }> = [];

function resetDb() {
  dbStore = {
    reports: [],
    report_sla_state: [],
    sla_escalation_config: [],
    audit_events: [],
  };
  emitted.length = 0;
}

function fakeSupabase(): SupabaseService {
  const from = (table: string) => {
    const ctx: {
      filters: Array<[string, unknown, 'eq' | 'in']>;
      mode: 'select' | 'update' | 'insert';
      patch: FakeRow | null;
      insertPayload: FakeRow | FakeRow[] | null;
    } = {
      filters: [],
      mode: 'select',
      patch: null,
      insertPayload: null,
    };

    const matching = (): FakeRow[] => {
      let rows = dbStore[table] ?? [];
      for (const [col, val, op] of ctx.filters) {
        if (op === 'in') {
          const allowed = val as unknown[];
          rows = rows.filter((r) => allowed.includes(r[col]));
        } else {
          rows = rows.filter((r) => r[col] === val);
        }
      }
      return rows;
    };

    const exec = (): Promise<{ data: unknown; error: { message: string; code?: string } | null }> => {
      if (ctx.mode === 'update') {
        const matched = matching();
        if (matched.length === 0) {
          return Promise.resolve({ data: null, error: { message: 'no rows' } });
        }
        for (const row of matched) {
          Object.assign(row, ctx.patch);
        }
        return Promise.resolve({ data: matched, error: null });
      }

      if (ctx.mode === 'insert') {
        const payload = ctx.insertPayload;
        const rows = Array.isArray(payload) ? payload : payload ? [payload] : [];
        for (const row of rows) {
          (dbStore[table] ??= []).push({ ...row });
        }
        return Promise.resolve({ data: rows, error: null });
      }

      return Promise.resolve({ data: matching(), error: null });
    };

    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: (col: string, val: unknown) => {
        ctx.filters.push([col, val, 'eq']);
        return chain;
      },
      in: (col: string, val: unknown[]) => {
        ctx.filters.push([col, val, 'in']);
        return chain;
      },
      update: (patch: FakeRow) => {
        ctx.mode = 'update';
        ctx.patch = patch;
        return chain;
      },
      insert: (row: FakeRow | FakeRow[]) => {
        ctx.mode = 'insert';
        ctx.insertPayload = row;
        return chain;
      },
      single: () =>
        exec().then((result) => {
          if (ctx.mode === 'update' || ctx.mode === 'insert') {
            const rows = result.data as FakeRow[] | null;
            if (!rows || rows.length === 0) {
              return { data: null, error: result.error ?? { message: 'no rows', code: 'PGRST116' } };
            }
            return { data: rows[0], error: null };
          }
          const rows = result.data as FakeRow[];
          const row = rows[0] ?? null;
          return {
            data: row,
            error: row ? null : { message: 'no rows', code: 'PGRST116' },
          };
        }),
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        exec().then(resolve, reject),
    };

    return chain;
  };

  return { admin: { from } } as unknown as SupabaseService;
}

function makeReport(overrides: Partial<FakeRow> = {}): FakeRow {
  return {
    id: 'rep-1',
    party_id: 'party-1',
    period_year: 2026,
    period_month: 1,
    status: ReportStatus.EN_REVISION,
    submitted_at: null,
    ...overrides,
  };
}

/** Jan 2026 period due 2026-02-15; 8 days overdue → level_2 on default ladder. */
const NOW = '2026-02-23T12:00:00.000Z';

describe('SlaService', () => {
  let service: SlaService;

  beforeEach(async () => {
    resetDb();
    const auditMock = {
      emit: jest.fn(async (event: { type: string; payload?: Record<string, unknown> }) => {
        emitted.push({ type: event.type, payload: event.payload ?? {} });
        dbStore.audit_events.push({
          type: event.type,
          payload: event.payload ?? {},
          actor_id: null,
        });
      }),
    };

    const mod = await Test.createTestingModule({
      providers: [
        SlaService,
        { provide: SupabaseService, useValue: fakeSupabase() },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();

    service = mod.get(SlaService);
  });

  describe('getConfig', () => {
    it('returns default ladder when config row is missing', async () => {
      const config = await service.getConfig();
      expect(config.ladder).toHaveLength(3);
      expect(config.ladder[0].level).toBe(EscalationLevel.LEVEL_1);
    });

    it('returns ladder from sla_escalation_config when present', async () => {
      dbStore.sla_escalation_config.push({
        country_code: 'GLOBAL',
        ladder: [{ level: EscalationLevel.LEVEL_1, afterDays: 1, notify: ['admin'] }],
      });
      const config = await service.getConfig();
      expect(config.ladder).toEqual([
        { level: EscalationLevel.LEVEL_1, afterDays: 1, notify: ['admin'] },
      ]);
    });
  });

  describe('checkAndEscalate', () => {
    it('returns empty array when there are no open reports', async () => {
      dbStore.reports.push(makeReport({ status: ReportStatus.BORRADOR }));
      dbStore.reports.push(makeReport({ id: 'rep-2', status: ReportStatus.APROBADO }));
      dbStore.reports.push(makeReport({ id: 'rep-3', status: ReportStatus.RECHAZADO }));

      const results = await service.checkAndEscalate(NOW);
      expect(results).toEqual([]);
      expect(dbStore.report_sla_state).toHaveLength(0);
      expect(emitted).toHaveLength(0);
    });

    it('escalates a single overdue report and writes sla state + audit event', async () => {
      dbStore.reports.push(makeReport());
      dbStore.sla_escalation_config.push({
        country_code: 'GLOBAL',
        ladder: [
          { level: EscalationLevel.LEVEL_1, afterDays: 3, notify: ['tse'] },
          { level: EscalationLevel.LEVEL_2, afterDays: 7, notify: ['tse', 'admin'] },
        ],
      });

      const results = await service.checkAndEscalate(NOW);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        reportId: 'rep-1',
        previousLevel: EscalationLevel.NONE,
        newLevel: EscalationLevel.LEVEL_2,
        escalated: true,
        notified: ['tse', 'admin'],
      });
      expect(dbStore.report_sla_state).toHaveLength(1);
      expect(dbStore.report_sla_state[0]).toMatchObject({
        report_id: 'rep-1',
        current_level: EscalationLevel.LEVEL_2,
        last_escalated_at: NOW,
        breached: true,
        updated_at: NOW,
      });
      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual({
        type: AuditEventType.REPORT_SLA_ESCALATED,
        payload: {
          reportId: 'rep-1',
          previousLevel: EscalationLevel.NONE,
          newLevel: EscalationLevel.LEVEL_2,
        },
      });
    });

    it('updates existing report_sla_state on subsequent escalation', async () => {
      dbStore.reports.push(makeReport());
      dbStore.report_sla_state.push({
        report_id: 'rep-1',
        current_level: EscalationLevel.LEVEL_1,
        last_escalated_at: '2026-02-10T00:00:00.000Z',
        breached: true,
        updated_at: '2026-02-10T00:00:00.000Z',
      });

      const results = await service.checkAndEscalate(NOW);

      expect(results[0].escalated).toBe(true);
      expect(results[0].newLevel).toBe(EscalationLevel.LEVEL_2);
      expect(dbStore.report_sla_state).toHaveLength(1);
      expect(dbStore.report_sla_state[0].current_level).toBe(EscalationLevel.LEVEL_2);
      expect(dbStore.report_sla_state[0].last_escalated_at).toBe(NOW);
    });

    it('processes several reports — only escalated ones persist state and audit', async () => {
      dbStore.reports.push(
        makeReport({ id: 'rep-not-due', period_year: 2026, period_month: 2 }),
        makeReport({ id: 'rep-escalate', period_year: 2026, period_month: 1 }),
        makeReport({
          id: 'rep-already',
          period_year: 2026,
          period_month: 1,
        }),
      );
      dbStore.report_sla_state.push({
        report_id: 'rep-already',
        current_level: EscalationLevel.LEVEL_2,
        breached: true,
        updated_at: '2026-02-01T00:00:00.000Z',
      });

      const later = '2026-02-18T12:00:00.000Z';
      const results = await service.checkAndEscalate(later);

      expect(results).toHaveLength(3);

      const notDue = results.find((r) => r.reportId === 'rep-not-due');
      expect(notDue?.escalated).toBe(false);

      const escalated = results.find((r) => r.reportId === 'rep-escalate');
      expect(escalated?.escalated).toBe(true);
      expect(escalated?.newLevel).toBe(EscalationLevel.LEVEL_1);

      const already = results.find((r) => r.reportId === 'rep-already');
      expect(already?.escalated).toBe(false);
      expect(already?.newLevel).toBe(EscalationLevel.LEVEL_2);

      const slaIds = dbStore.report_sla_state.map((r) => r.report_id);
      expect(slaIds).toEqual(['rep-already', 'rep-escalate']);
      expect(emitted).toHaveLength(1);
      expect(emitted[0].payload.reportId).toBe('rep-escalate');
    });
  });
});
