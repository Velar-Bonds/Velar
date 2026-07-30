import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { AnalyticsInput } from '@velar/types';
import { analyticsFixture, analyticsFixtureIds } from '@velar/types';
import { AnalyticsService } from './analytics.service';

const clone = (input: AnalyticsInput): AnalyticsInput => JSON.parse(JSON.stringify(input));
const ids = analyticsFixtureIds;

/** Thenable Supabase query-builder mock: every chain method returns itself, and
 * awaiting the chain (or calling `.single()`) resolves to the configured result. */
function makeChain(result: { data: any; error: any }) {
  const chain: any = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    order: jest.fn(() => chain),
    insert: jest.fn(() => chain),
    update: jest.fn(() => chain),
    delete: jest.fn(() => chain),
    single: jest.fn(() => Promise.resolve(result)),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

describe('AnalyticsService', () => {
  let dataService: { getAnalyticsInput: jest.Mock };
  let notifications: { emit: jest.Mock };
  let scheduledReportGenerator: { generate: jest.Mock };
  let fromMock: jest.Mock;
  let service: AnalyticsService;

  function build(tableResults: Record<string, { data: any; error: any }> = {}) {
    dataService = { getAnalyticsInput: jest.fn().mockResolvedValue(clone(analyticsFixture)) };
    notifications = { emit: jest.fn().mockResolvedValue(undefined) };
    scheduledReportGenerator = {
      generate: jest.fn().mockResolvedValue({ filename: 'x.csv', mimeType: 'text/csv', encoding: 'utf-8', content: 'stub' }),
    };
    fromMock = jest.fn((table: string) => makeChain(tableResults[table] ?? { data: [], error: null }));
    const supabase = { admin: { from: fromMock } };
    service = new AnalyticsService(dataService as any, supabase as any, notifications as any, scheduledReportGenerator as any);
    return service;
  }

  beforeEach(() => {
    service = build();
  });

  // ─── RBAC / scoping ───────────────────────────────────────────────────────

  describe('getSnapshot RBAC', () => {
    it('tse sees every party', async () => {
      const snapshot = await service.getSnapshot('tse', null, {});
      expect(snapshot.scope).toEqual({ kind: 'all' });
      expect(snapshot.partyBreakdown).toHaveLength(3);
    });

    it('admin sees every party', async () => {
      const snapshot = await service.getSnapshot('admin', null, {});
      expect(snapshot.scope).toEqual({ kind: 'all' });
    });

    it('emisor with a party_id is scoped to only that party', async () => {
      const snapshot = await service.getSnapshot('emisor', ids.parties.libertad, {});
      expect(snapshot.scope).toEqual({ kind: 'party', partyId: ids.parties.libertad });
      expect(snapshot.partyBreakdown).toHaveLength(1);
      expect(snapshot.partyBreakdown[0].partyId).toBe(ids.parties.libertad);
    });

    it('emisor with no party_id is forbidden', async () => {
      await expect(service.getSnapshot('emisor', null, {})).rejects.toThrow(ForbiddenException);
    });

    it.each(['comprador', 'recomprador', 'validador'] as const)('%s has no aggregate-analytics access', async (role) => {
      await expect(service.getSnapshot(role, null, {})).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Exports ──────────────────────────────────────────────────────────────

  describe('exportCsv / exportPdf', () => {
    it('exportCsv renders the snapshot as CSV, scoped by role', async () => {
      const csv = await service.exportCsv('tse', null, {});
      expect(csv).toContain('value_volume,total_bonds,7');
    });

    it('exportCsv respects party scoping', async () => {
      const csv = await service.exportCsv('emisor', ids.parties.renovacion, {});
      expect(csv).toContain('value_volume,total_bonds,2');
    });

    it('exportPdf renders a valid PDF buffer', async () => {
      const buffer = await service.exportPdf('tse', null, {});
      expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    });

    it('exportCsv is forbidden for roles with no analytics access', async () => {
      await expect(service.exportCsv('comprador', null, {})).rejects.toThrow(ForbiddenException);
    });
  });

  describe('legacy exportTransfersCsv', () => {
    it('rejects roles other than tse', async () => {
      await expect(service.exportTransfersCsv('admin', 'csv')).rejects.toThrow(ForbiddenException);
    });

    it('rejects formats other than csv', async () => {
      await expect(service.exportTransfersCsv('tse', 'pdf')).rejects.toThrow(BadRequestException);
    });

    it('generates a CSV with the required columns for tse + format=csv', async () => {
      service = build({
        transfers: {
          data: [
            {
              amount: 150000,
              created_at: '2026-06-10T15:30:00.000Z',
              from_profile: { full_name: 'Partido ABC' },
              to_profile: { full_name: 'Juan Pérez' },
              bonds: { bond_id: 'BONO-001', parties: { name: 'Partido XYZ' } },
            },
          ],
          error: null,
        },
      });
      const csv = await service.exportTransfersCsv('tse', 'csv');
      expect(csv.startsWith('\uFEFFbond_id,transfer_date,seller_name,buyer_name,amount_colones,party_name')).toBe(true);
      expect(csv).toContain('BONO-001,2026-06-10,Partido ABC,Juan Pérez,150000,Partido XYZ');
    });
  });

  // ─── Alert rules: evaluation + notification emission ─────────────────────

  describe('alert rule evaluation', () => {
    const ruleRow = {
      id: 'rule-1',
      name: 'Volumen alto',
      metric_path: 'valueVolume.totalVolumeMoved',
      comparator: 'gt',
      threshold: 1_000_000,
      scope: { kind: 'all' },
      notify_user_ids: ['user-a', 'user-b'],
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };

    it('emits a notification per recipient when the rule breaches', async () => {
      service = build({ analytics_alert_rules: { data: ruleRow, error: null } });
      const breaches = await service.evaluateAlertRule('rule-1');
      expect(breaches).toHaveLength(1);
      expect(notifications.emit).toHaveBeenCalledTimes(2);
      expect(notifications.emit).toHaveBeenCalledWith('user-a', 'analytics_threshold_breached', expect.objectContaining({ ruleId: 'rule-1' }));
      expect(notifications.emit).toHaveBeenCalledWith('user-b', 'analytics_threshold_breached', expect.objectContaining({ ruleId: 'rule-1' }));
    });

    it('does not notify when the rule does not breach', async () => {
      service = build({ analytics_alert_rules: { data: { ...ruleRow, threshold: 100_000_000 }, error: null } });
      const breaches = await service.evaluateAlertRule('rule-1');
      expect(breaches).toHaveLength(0);
      expect(notifications.emit).not.toHaveBeenCalled();
    });

    it('respects the rule scope when evaluating', async () => {
      service = build({
        analytics_alert_rules: {
          data: { ...ruleRow, scope: { kind: 'party', partyId: ids.parties.libertad }, threshold: 500_000 },
          error: null,
        },
      });
      // Libertad's own volumeMoved is 1_050_000 > 500_000 → breaches.
      const breaches = await service.evaluateAlertRule('rule-1');
      expect(breaches).toHaveLength(1);
    });

    it('throws NotFoundException for an unknown rule id', async () => {
      service = build({ analytics_alert_rules: { data: null, error: null } });
      await expect(service.evaluateAlertRule('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Scheduled report stub ────────────────────────────────────────────────

  describe('runScheduledReport', () => {
    it('builds a scope-filtered snapshot and delegates to the generator', async () => {
      const config = { id: 'cfg-1', cadence: 'monthly' as const, format: 'csv' as const, scope: { kind: 'all' as const }, recipients: [] };
      const result = await service.runScheduledReport(config);
      expect(result.filename).toBe('x.csv');
      expect(scheduledReportGenerator.generate).toHaveBeenCalledTimes(1);
      const [passedConfig, passedSnapshot] = scheduledReportGenerator.generate.mock.calls[0];
      expect(passedConfig).toBe(config);
      expect(passedSnapshot.valueVolume.totalBonds).toBe(7);
    });

    it('scopes the snapshot to a single party when the config scope is party-based', async () => {
      const config = {
        id: 'cfg-2',
        cadence: 'weekly' as const,
        format: 'pdf' as const,
        scope: { kind: 'party' as const, partyId: ids.parties.avanza },
        recipients: [],
      };
      await service.runScheduledReport(config);
      const [, passedSnapshot] = scheduledReportGenerator.generate.mock.calls[0];
      expect(passedSnapshot.valueVolume.totalBonds).toBe(2);
    });
  });

  // ─── Saved views ──────────────────────────────────────────────────────────

  describe('saved views', () => {
    it('createSavedView rejects an empty name', async () => {
      await expect(service.createSavedView('owner-1', 'tse', { name: '  ', query: {} })).rejects.toThrow(BadRequestException);
    });

    it('createSavedView persists owner/role/name/query', async () => {
      service = build({
        analytics_saved_views: {
          data: { id: 'view-1', owner_id: 'owner-1', role: 'tse', name: 'Mi vista', query: { country: 'CR' }, created_at: 'x', updated_at: 'x' },
          error: null,
        },
      });
      const view = await service.createSavedView('owner-1', 'tse', { name: 'Mi vista', query: { country: 'CR' } });
      expect(view).toMatchObject({ id: 'view-1', ownerId: 'owner-1', name: 'Mi vista' });
    });
  });
});
