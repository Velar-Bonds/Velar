import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as fc from 'fast-check';
import { ReportsService } from './reports.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { AbacService } from '../auth/abac/abac.service';
import { AuditEventType, ReportStatus } from '@velar/types';
import { getRuleSet, DEFAULT_RULE_SET_VERSION } from './rules/rule-sets';

// ─────────────────────────────────────────────────────────────────────────────
// In-memory Supabase fake (conditional updates / optimistic concurrency)
// ─────────────────────────────────────────────────────────────────────────────

type FakeRow = Record<string, unknown>;

let dbStore: Record<string, FakeRow[]> = {};
let idSeq = 0;

function resetDb() {
  dbStore = {
    reports: [],
    report_line_items: [],
    report_decision_approvals: [],
  };
  idSeq = 0;
}

function nextId(prefix: string) {
  idSeq += 1;
  return `${prefix}-${idSeq}`;
}

/** Chainable query builder over plain row arrays — filters apply before mutate. */
function fakeSupabase(): SupabaseService {
  const from = (table: string) => {
    const ctx: {
      filters: Array<[string, unknown]>;
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
      for (const [col, val] of ctx.filters) {
        rows = rows.filter((r) => r[col] === val);
      }
      return rows;
    };

    const exec = (): Promise<{ data: unknown; error: { message: string } | null }> => {
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
        const inserted: FakeRow[] = [];
        for (const row of rows) {
          const withDefaults: FakeRow = {
            created_at: new Date().toISOString(),
            ...row,
            id: row.id ?? nextId(table.replace(/s$/, '')),
          };
          (dbStore[table] ??= []).push(withDefaults);
          inserted.push(withDefaults);
        }
        return Promise.resolve({ data: inserted, error: null });
      }

      return Promise.resolve({ data: matching(), error: null });
    };

    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: (col: string, val: unknown) => {
        ctx.filters.push([col, val]);
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
              return { data: null, error: result.error ?? { message: 'no rows' } };
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

// ─────────────────────────────────────────────────────────────────────────────
// Factories
// ─────────────────────────────────────────────────────────────────────────────

const NOW = '2026-07-28T12:00:00Z';
const THRESHOLD = getRuleSet(DEFAULT_RULE_SET_VERSION).thresholdBreachAmount;

function reportRow(overrides: Partial<FakeRow> = {}): FakeRow {
  return {
    id: 'rep-1',
    party_id: 'party-1',
    status: ReportStatus.EN_REVISION,
    current_version: 3,
    tse_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    assigned_reviewer_id: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

/** Seed line-item rows whose amounts sum to `declaredTotal`. */
function seedLineItems(reportId: string, declaredTotal: number): FakeRow[] {
  const rows: FakeRow[] = [
    {
      id: nextId('li'),
      report_id: reportId,
      concept: 'Declarado',
      amount: declaredTotal,
      category: 'otro',
      created_at: NOW,
    },
  ];
  dbStore.report_line_items.push(...rows);
  return rows;
}

function approvalRow(overrides: Partial<FakeRow> = {}): FakeRow {
  return {
    id: 'appr-1',
    report_id: 'rep-1',
    decision: 'aprobado',
    first_approver_id: 'tse-a',
    first_approved_at: NOW,
    second_approver_id: null,
    second_approved_at: null,
    status: 'pending_second',
    created_at: NOW,
    ...overrides,
  };
}

function storedReport(id = 'rep-1'): FakeRow {
  return dbStore.reports.find((r) => r.id === id)!;
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('ReportsService', () => {
  let service: ReportsService;
  let audit: { emit: jest.Mock };

  beforeEach(async () => {
    resetDb();
    audit = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: SupabaseService, useValue: fakeSupabase() },
        { provide: AuditService, useValue: audit },
        AbacService,
      ],
    }).compile();

    service = module.get(ReportsService);
  });

  // ── 1. Legacy 'revisado' ───────────────────────────────────────────────────

  describe('legacy revisado', () => {
    it('marks reviewed without dual-control machinery', async () => {
      dbStore.reports.push(reportRow());

      const res = await service.review('rep-1', 'revisado', 'nota', 'tse-1', 'tse');

      const row = storedReport();
      expect(row.status).toBe('revisado');
      expect(row.reviewed_by).toBe('tse-1');
      expect(row.reviewed_at).toEqual(expect.any(String));
      expect(row.tse_notes).toBe('nota');
      expect(row.current_version).toBe(4);
      expect(audit.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AuditEventType.REPORT_MARKED_REVIEWED,
          actorId: 'tse-1',
          payload: expect.objectContaining({ reportId: 'rep-1', notes: 'nota' }),
        }),
      );
      expect(res.dualControl).toEqual({
        required: false,
        approval: null,
        threshold: THRESHOLD,
      });
      expect(dbStore.report_decision_approvals).toHaveLength(0);
    });
  });

  // ── 2. Direct approval under threshold ─────────────────────────────────────

  describe('direct approval under threshold', () => {
    it('approves immediately without creating an approval row', async () => {
      dbStore.reports.push(reportRow({ status: ReportStatus.EN_REVISION }));
      seedLineItems('rep-1', 100_000);

      const res = await service.review('rep-1', 'aprobado', 'ok', 'tse-1', 'tse');

      expect(storedReport().status).toBe(ReportStatus.APROBADO);
      expect(dbStore.report_decision_approvals).toHaveLength(0);
      expect(audit.emit.mock.calls.map((c) => c[0].type)).toEqual([
        AuditEventType.REPORT_APPROVED,
      ]);
      expect(res.dualControl.required).toBe(false);
      expect(res.dualControl.approval).toBeNull();
    });
  });

  // ── 3. Dual control over threshold ─────────────────────────────────────────

  describe('dual control over threshold', () => {
    it('parks at pendiente_segunda_aprobacion and inserts a pending approval', async () => {
      dbStore.reports.push(reportRow({ status: ReportStatus.EN_REVISION }));
      seedLineItems('rep-1', THRESHOLD);

      const res = await service.review('rep-1', 'aprobado', 'alto', 'tse-1', 'tse');

      expect(storedReport().status).toBe(ReportStatus.PENDIENTE_SEGUNDA_APROBACION);
      expect(dbStore.report_decision_approvals).toHaveLength(1);
      expect(dbStore.report_decision_approvals[0]).toMatchObject({
        report_id: 'rep-1',
        status: 'pending_second',
        first_approver_id: 'tse-1',
      });
      expect(audit.emit.mock.calls.map((c) => c[0].type)).toEqual([
        AuditEventType.REPORT_PENDING_SECOND_APPROVAL,
      ]);
      expect(res.dualControl.required).toBe(true);
      expect(res.dualControl.approval).not.toBeNull();
      expect(res.dualControl.approval?.firstApproverId).toBe('tse-1');
    });
  });

  // ── 4. Second approval by distinct reviewer ────────────────────────────────

  describe('second approval completes dual control', () => {
    it('moves to aprobado and marks the approval completed', async () => {
      dbStore.reports.push(
        reportRow({
          status: ReportStatus.PENDIENTE_SEGUNDA_APROBACION,
          current_version: 4,
        }),
      );
      seedLineItems('rep-1', THRESHOLD);
      dbStore.report_decision_approvals.push(
        approvalRow({ first_approver_id: 'tse-a', status: 'pending_second' }),
      );

      const res = await service.review('rep-1', 'aprobado', 'segundo', 'tse-b', 'tse');

      expect(storedReport().status).toBe(ReportStatus.APROBADO);
      expect(dbStore.report_decision_approvals[0]).toMatchObject({
        status: 'completed',
        second_approver_id: 'tse-b',
      });
      expect(audit.emit.mock.calls.map((c) => c[0].type)).toEqual([
        AuditEventType.REPORT_SECOND_APPROVED,
      ]);
      expect(res.dualControl.approval?.secondApproverId).toBe('tse-b');
    });
  });

  // ── 5. Segregation of duties ───────────────────────────────────────────────

  describe('segregation of duties', () => {
    it('rejects the same actor as first and second approver', async () => {
      dbStore.reports.push(
        reportRow({ status: ReportStatus.PENDIENTE_SEGUNDA_APROBACION }),
      );
      seedLineItems('rep-1', THRESHOLD);
      dbStore.report_decision_approvals.push(
        approvalRow({ first_approver_id: 'tse-a', status: 'pending_second' }),
      );

      await expect(
        service.review('rep-1', 'aprobado', 'mismo', 'tse-a', 'tse'),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(storedReport().status).toBe(ReportStatus.PENDIENTE_SEGUNDA_APROBACION);
      expect(dbStore.report_decision_approvals[0]!.status).toBe('pending_second');
      expect(audit.emit).not.toHaveBeenCalled();
    });
  });

  // ── 6. Missing pending approval row ────────────────────────────────────────

  describe('second approval without pending row', () => {
    it('throws BadRequestException', async () => {
      dbStore.reports.push(
        reportRow({ status: ReportStatus.PENDIENTE_SEGUNDA_APROBACION }),
      );
      seedLineItems('rep-1', THRESHOLD);

      await expect(
        service.review('rep-1', 'aprobado', 'huérfano', 'tse-b', 'tse'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(storedReport().status).toBe(ReportStatus.PENDIENTE_SEGUNDA_APROBACION);
      expect(audit.emit).not.toHaveBeenCalled();
    });
  });

  // ── 7. Illegal transition ──────────────────────────────────────────────────

  describe('illegal transition', () => {
    it('rejects aprobación from borrador without mutating store or auditing', async () => {
      dbStore.reports.push(
        reportRow({ status: ReportStatus.BORRADOR, current_version: 0 }),
      );
      seedLineItems('rep-1', 1_000);
      const before = { ...storedReport() };

      await expect(
        service.review('rep-1', 'aprobado', 'no', 'tse-1', 'tse'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(storedReport()).toEqual(before);
      expect(audit.emit).not.toHaveBeenCalled();
    });
  });

  // ── 8. Rejection path ──────────────────────────────────────────────────────

  describe('rejection', () => {
    it('resolves to rechazado and emits REPORT_REJECTED', async () => {
      dbStore.reports.push(reportRow({ status: ReportStatus.EN_REVISION }));
      seedLineItems('rep-1', 50_000);

      await service.review('rep-1', 'rechazado', 'incompleto', 'tse-1', 'tse');

      expect(storedReport().status).toBe(ReportStatus.RECHAZADO);
      expect(audit.emit.mock.calls.map((c) => c[0].type)).toEqual([
        AuditEventType.REPORT_REJECTED,
      ]);
    });
  });

  // ── 9. Optimistic concurrency — stale write rejected ───────────────────────

  describe('optimistic concurrency', () => {
    it('rejects a stale expectedVersion and leaves the first write intact', async () => {
      dbStore.reports.push(
        reportRow({ status: ReportStatus.EN_REVISION, current_version: 3 }),
      );
      seedLineItems('rep-1', 10_000);

      await service.review('rep-1', 'observado', 'first', 'actor-a', 'tse', 3);

      expect(storedReport().status).toBe(ReportStatus.OBSERVADO);
      expect(storedReport().current_version).toBe(4);
      expect(storedReport().tse_notes).toBe('first');

      // Second caller still holds expectedVersion 3. Use legacy 'revisado' so the
      // call reaches applyReportUpdate (aprobado from observado would fail the
      // workflow guard before the optimistic-concurrency check).
      await expect(
        service.review('rep-1', 'revisado', 'second', 'actor-b', 'tse', 3),
      ).rejects.toBeInstanceOf(ConflictException);

      // Second call had zero effect — proves conditional update rejected.
      expect(storedReport().status).toBe(ReportStatus.OBSERVADO);
      expect(storedReport().current_version).toBe(4);
      expect(storedReport().tse_notes).toBe('first');
      expect(storedReport().reviewed_by).toBe('actor-a');
      expect(audit.emit).toHaveBeenCalledTimes(1);
      expect(audit.emit.mock.calls[0]![0].type).toBe(AuditEventType.REPORT_OBSERVED);
    });

    // ── 10. No expectedVersion → unconditional update ────────────────────────

    it('updates unconditionally when expectedVersion is omitted', async () => {
      dbStore.reports.push(
        reportRow({ status: ReportStatus.EN_REVISION, current_version: 99 }),
      );
      seedLineItems('rep-1', 10_000);

      await service.review('rep-1', 'observado', 'sin versión', 'tse-1', 'tse');

      expect(storedReport().status).toBe(ReportStatus.OBSERVADO);
      expect(storedReport().current_version).toBe(100);
    });
  });

  // ── 11. Assigned-reviewer ABAC boundary ────────────────────────────────────

  describe('assigned reviewer boundary', () => {
    it('rejects a tse actor who is not the assigned reviewer', async () => {
      dbStore.reports.push(
        reportRow({
          status: ReportStatus.EN_REVISION,
          assigned_reviewer_id: 'tse-assigned',
        }),
      );
      seedLineItems('rep-1', 10_000);
      const before = { ...storedReport() };

      await expect(
        service.review('rep-1', 'observado', 'otro', 'tse-other', 'tse'),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(storedReport()).toEqual(before);
      expect(audit.emit).not.toHaveBeenCalled();
    });
  });

  // ── 12. assignReviewer ─────────────────────────────────────────────────────

  describe('assignReviewer', () => {
    it('rejects non-admin roles', async () => {
      dbStore.reports.push(reportRow());
      await expect(
        service.assignReviewer('rep-1', 'rev-1', 'tse-1', 'tse'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(storedReport().assigned_reviewer_id).toBeNull();
      expect(audit.emit).not.toHaveBeenCalled();
    });

    it('updates assigned_reviewer_id and emits REPORT_ASSIGNED for admin', async () => {
      dbStore.reports.push(reportRow());

      const res = await service.assignReviewer('rep-1', 'rev-1', 'admin-1', 'admin');

      expect(res.assigned_reviewer_id).toBe('rev-1');
      expect(storedReport().assigned_reviewer_id).toBe('rev-1');
      expect(audit.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AuditEventType.REPORT_ASSIGNED,
          actorId: 'admin-1',
          payload: { reportId: 'rep-1', reviewerId: 'rev-1' },
        }),
      );
    });

    it('rejects empty reviewerId', async () => {
      dbStore.reports.push(reportRow());
      await expect(
        service.assignReviewer('rep-1', '   ', 'admin-1', 'admin'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(audit.emit).not.toHaveBeenCalled();
    });
  });

  // ── 13. Property: stale vs refreshed expectedVersion ───────────────────────

  describe('concurrency property (fast-check)', () => {
    it('stale expectedVersion always conflicts; refreshed always succeeds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 500 }),
          fc.boolean(),
          async (startVersion, useStale) => {
            resetDb();
            audit.emit.mockClear();
            // Re-bind fake store to a fresh supabase client for this trial.
            const module: TestingModule = await Test.createTestingModule({
              providers: [
                ReportsService,
                { provide: SupabaseService, useValue: fakeSupabase() },
                { provide: AuditService, useValue: audit },
                AbacService,
              ],
            }).compile();
            const svc = module.get(ReportsService);

            dbStore.reports.push(
              reportRow({
                id: 'rep-prop',
                status: ReportStatus.EN_REVISION,
                current_version: startVersion,
              }),
            );

            // Legacy revisado bypasses workflow transitions — safe to call twice.
            await svc.review(
              'rep-prop',
              'revisado',
              'first',
              'actor-a',
              'tse',
              startVersion,
            );
            expect(storedReport('rep-prop').current_version).toBe(startVersion + 1);

            const secondExpected = useStale ? startVersion : startVersion + 1;

            if (useStale) {
              await expect(
                svc.review(
                  'rep-prop',
                  'revisado',
                  'stale',
                  'actor-b',
                  'tse',
                  secondExpected,
                ),
              ).rejects.toBeInstanceOf(ConflictException);
              expect(storedReport('rep-prop').current_version).toBe(startVersion + 1);
              expect(storedReport('rep-prop').tse_notes).toBe('first');
              expect(storedReport('rep-prop').reviewed_by).toBe('actor-a');
            } else {
              await svc.review(
                'rep-prop',
                'revisado',
                'refreshed',
                'actor-b',
                'tse',
                secondExpected,
              );
              expect(storedReport('rep-prop').current_version).toBe(startVersion + 2);
              expect(storedReport('rep-prop').tse_notes).toBe('refreshed');
              expect(storedReport('rep-prop').reviewed_by).toBe('actor-b');
            }
          },
        ),
        { numRuns: 40 },
      );
    });
  });
});
