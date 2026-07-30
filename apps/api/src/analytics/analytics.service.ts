import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  AlertBreach,
  AlertRule,
  AlertRuleInput,
  AnalyticsQuery,
  AnalyticsScope,
  AnalyticsSnapshot,
  Role,
  SavedView,
  SavedViewInput,
  ScheduledReportConfig,
  ScheduledReportResult,
} from '@velar/types';
import { NotificationType } from '@velar/types';
import { SupabaseService } from '../common/supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnalyticsDataService } from './analytics-data.service';
import { renderSnapshotCsv } from './csv/analytics-csv';
import { applyScope, buildAnalyticsSnapshot, evaluateAlertRules } from './engine';
import { renderAnalyticsPdf } from './pdf/analytics-pdf';
import { SCHEDULED_REPORT_GENERATOR, ScheduledReportGenerator } from './scheduled-report/scheduled-report-generator.interface';

const AUTHORITY: Role[] = ['tse', 'admin'];
/** Legacy CSV columns, kept for the (unchanged) transfer-detail drill-down export. */
const CSV_HEADERS = ['bond_id', 'transfer_date', 'seller_name', 'buyer_name', 'amount_colones', 'party_name'] as const;

@Injectable()
export class AnalyticsService {
  constructor(
    private data: AnalyticsDataService,
    private supabase: SupabaseService,
    private notifications: NotificationsService,
    @Inject(SCHEDULED_REPORT_GENERATOR) private scheduledReportGenerator: ScheduledReportGenerator,
  ) {}

  private assertAuth(role: Role) {
    if (!AUTHORITY.includes(role)) throw new ForbiddenException('Solo TSE/admin');
  }

  /** TSE/admin see every party; `emisor` sees only their own party's data. Everyone else is out of scope for aggregate analytics. */
  private resolveScope(role: Role, partyId: string | null): AnalyticsScope {
    if (AUTHORITY.includes(role)) return { kind: 'all' };
    if (role === 'emisor') {
      if (!partyId) throw new ForbiddenException('Tu perfil no tiene un partido asociado');
      return { kind: 'party', partyId };
    }
    throw new ForbiddenException('No autorizado para ver analítica');
  }

  // ─── Snapshot & exports ─────────────────────────────────────────────────────

  async getSnapshot(role: Role, partyId: string | null, query: AnalyticsQuery = {}): Promise<AnalyticsSnapshot> {
    const scope = this.resolveScope(role, partyId);
    const input = await this.data.getAnalyticsInput();
    return buildAnalyticsSnapshot(input, query, scope);
  }

  async exportCsv(role: Role, partyId: string | null, query: AnalyticsQuery = {}): Promise<string> {
    return renderSnapshotCsv(await this.getSnapshot(role, partyId, query));
  }

  async exportPdf(role: Role, partyId: string | null, query: AnalyticsQuery = {}): Promise<Buffer> {
    return renderAnalyticsPdf(await this.getSnapshot(role, partyId, query));
  }

  // ─── Alert rules (TSE/admin only — enforced at the controller via @Roles) ──

  private mapAlertRule(row: any): AlertRule {
    return {
      id: row.id,
      name: row.name,
      metricPath: row.metric_path,
      comparator: row.comparator,
      threshold: Number(row.threshold),
      scope: row.scope ?? { kind: 'all' },
      notifyUserIds: row.notify_user_ids ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listAlertRules(): Promise<AlertRule[]> {
    const { data, error } = await this.supabase.admin
      .from('analytics_alert_rules')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return (data ?? []).map((r: any) => this.mapAlertRule(r));
  }

  async createAlertRule(input: AlertRuleInput): Promise<AlertRule> {
    if (!input.name?.trim()) throw new BadRequestException('El nombre es obligatorio');
    if (!input.metricPath?.trim()) throw new BadRequestException('metricPath es obligatorio');
    const { data, error } = await this.supabase.admin
      .from('analytics_alert_rules')
      .insert({
        name: input.name.trim(),
        metric_path: input.metricPath.trim(),
        comparator: input.comparator,
        threshold: input.threshold,
        scope: input.scope,
        notify_user_ids: input.notifyUserIds ?? [],
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return this.mapAlertRule(data);
  }

  async updateAlertRule(id: string, input: Partial<AlertRuleInput>): Promise<AlertRule> {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.metricPath !== undefined) patch.metric_path = input.metricPath;
    if (input.comparator !== undefined) patch.comparator = input.comparator;
    if (input.threshold !== undefined) patch.threshold = input.threshold;
    if (input.scope !== undefined) patch.scope = input.scope;
    if (input.notifyUserIds !== undefined) patch.notify_user_ids = input.notifyUserIds;

    const { data, error } = await this.supabase.admin
      .from('analytics_alert_rules')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new NotFoundException('Regla no encontrada');
    return this.mapAlertRule(data);
  }

  async deleteAlertRule(id: string): Promise<{ ok: true }> {
    const { error } = await this.supabase.admin.from('analytics_alert_rules').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { ok: true };
  }

  private async evaluateAndNotify(rules: AlertRule[]): Promise<AlertBreach[]> {
    if (rules.length === 0) return [];
    const input = await this.data.getAnalyticsInput();
    const allBreaches: AlertBreach[] = [];
    for (const rule of rules) {
      const scopedInput = applyScope(input, rule.scope);
      const snapshot = buildAnalyticsSnapshot(scopedInput, {}, rule.scope);
      const breaches = evaluateAlertRules(snapshot, [rule]);
      for (const breach of breaches) {
        for (const userId of rule.notifyUserIds) {
          await this.notifications.emit(userId, NotificationType.ANALYTICS_THRESHOLD_BREACHED, { ...breach });
        }
      }
      allBreaches.push(...breaches);
    }
    return allBreaches;
  }

  async evaluateAlertRule(id: string): Promise<AlertBreach[]> {
    const { data, error } = await this.supabase.admin.from('analytics_alert_rules').select('*').eq('id', id).single();
    if (error || !data) throw new NotFoundException('Regla no encontrada');
    return this.evaluateAndNotify([this.mapAlertRule(data)]);
  }

  async evaluateAllAlertRules(): Promise<AlertBreach[]> {
    return this.evaluateAndNotify(await this.listAlertRules());
  }

  // ─── Saved views (owner-scoped) ─────────────────────────────────────────────

  private mapSavedView(row: any): SavedView {
    return {
      id: row.id,
      ownerId: row.owner_id,
      role: row.role,
      name: row.name,
      query: row.query ?? {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listSavedViews(ownerId: string): Promise<SavedView[]> {
    const { data, error } = await this.supabase.admin
      .from('analytics_saved_views')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return (data ?? []).map((r: any) => this.mapSavedView(r));
  }

  async createSavedView(ownerId: string, role: Role, input: SavedViewInput): Promise<SavedView> {
    if (!input.name?.trim()) throw new BadRequestException('El nombre es obligatorio');
    const { data, error } = await this.supabase.admin
      .from('analytics_saved_views')
      .insert({ owner_id: ownerId, role, name: input.name.trim(), query: input.query ?? {} })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return this.mapSavedView(data);
  }

  async deleteSavedView(id: string, ownerId: string): Promise<{ ok: true }> {
    const { error } = await this.supabase.admin
      .from('analytics_saved_views')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId);
    if (error) throw new BadRequestException(error.message);
    return { ok: true };
  }

  // ─── Scheduled report (manual trigger, no cron) ────────────────────────────

  async runScheduledReport(config: ScheduledReportConfig): Promise<ScheduledReportResult> {
    const input = await this.data.getAnalyticsInput();
    const scopedInput = applyScope(input, config.scope);
    const snapshot = buildAnalyticsSnapshot(scopedInput, {}, config.scope);
    return this.scheduledReportGenerator.generate(config, snapshot);
  }

  // ─── Legacy bond-detail drill-down (unchanged, TSE/admin only, live Supabase) ─

  /** Histórico de precios y % de cambio de un bono. */
  async bondPriceHistory(tokenId: string, role: Role) {
    this.assertAuth(role);
    const { data: bond } = await this.supabase.admin
      .from('bonds').select('*, parties(name)').eq('token_id', tokenId).single();
    if (!bond) return null;

    const { data: transfers } = await this.supabase.admin
      .from('transfers')
      .select('amount, status, created_at, from_profile:profiles!transfers_from_owner_fkey(full_name), to_profile:profiles!transfers_to_owner_fkey(full_name)')
      .eq('bond_token_id', tokenId)
      .eq('status', 'liberada')
      .order('created_at', { ascending: true });

    const liberadas = (transfers ?? []) as any[];
    const points = liberadas.map((t: any, i: number) => {
      const prev = i > 0 ? Number(liberadas[i - 1].amount) || 0 : Number(bond.face_value) || 0;
      const curr = Number(t.amount) || 0;
      const changePct = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
      return {
        index: i + 1,
        date: t.created_at,
        price: curr,
        change_pct: Number(changePct.toFixed(2)),
        from: t.from_profile?.full_name,
        to: t.to_profile?.full_name,
      };
    });

    const facialValue = Number(bond.face_value) || 0;
    const lastPrice = points.length > 0 ? points[points.length - 1].price : facialValue;
    const totalChangePct = facialValue > 0 ? Number((((lastPrice - facialValue) / facialValue) * 100).toFixed(2)) : 0;

    return {
      bond_id: bond.bond_id,
      party_name: bond.parties?.name,
      facial_value: facialValue,
      currency: bond.currency ?? 'CRC',
      current_price: lastPrice,
      total_change_pct: totalChangePct,
      sales_count: points.length,
      points,
    };
  }

  /** Lista de dueños históricos de un bono. */
  async bondOwners(tokenId: string, role: Role) {
    this.assertAuth(role);
    const { data: bond } = await this.supabase.admin
      .from('bonds').select('*, profiles!bonds_current_owner_fkey(id, full_name, email)').eq('token_id', tokenId).single();
    if (!bond) return null;

    const { data: transfers } = await this.supabase.admin
      .from('transfers')
      .select('amount, status, created_at, from_profile:profiles!transfers_from_owner_fkey(id, full_name, email), to_profile:profiles!transfers_to_owner_fkey(id, full_name, email)')
      .eq('bond_token_id', tokenId)
      .order('created_at', { ascending: true });

    const liberadas = ((transfers ?? []) as any[]).filter((t: any) => t.status === 'liberada');

    const owners: any[] = [];
    if (liberadas.length === 0) {
      if (bond.profiles) {
        owners.push({
          name: bond.profiles.full_name,
          email: bond.profiles.email,
          since: bond.created_at,
          until: null,
          paid: null,
          current: true,
        });
      }
    } else {
      const first = liberadas[0];
      owners.push({
        name: first.from_profile?.full_name,
        email: first.from_profile?.email,
        since: bond.created_at,
        until: first.created_at,
        paid: null,
        current: false,
      });
      liberadas.forEach((t: any, i: number) => {
        const next = liberadas[i + 1];
        owners.push({
          name: t.to_profile?.full_name,
          email: t.to_profile?.email,
          since: t.created_at,
          until: next?.created_at ?? null,
          paid: Number(t.amount) || null,
          current: !next,
        });
      });
    }

    return {
      bond_id: bond.bond_id,
      current_owner: bond.profiles?.full_name,
      owners_count: owners.length,
      owners,
    };
  }

  /** Top N bonos más movidos (detalle legado con nombre de partido, para drill-down). */
  async topBonds(role: Role, limit = 5) {
    this.assertAuth(role);
    const { data: transfers } = await this.supabase.admin
      .from('transfers')
      .select('bond_token_id, amount, status, bonds(bond_id, face_value, parties(name))')
      .eq('status', 'liberada');

    const agg = new Map<string, any>();
    ((transfers ?? []) as any[]).forEach((t: any) => {
      const k = t.bond_token_id;
      const cur = agg.get(k) ?? { token_id: k, bond_id: t.bonds?.bond_id, party: t.bonds?.parties?.name, sales: 0, volume: 0 };
      cur.sales += 1;
      cur.volume += Number(t.amount) || 0;
      agg.set(k, cur);
    });
    return [...agg.values()].sort((a, b) => b.volume - a.volume).slice(0, limit);
  }

  /** CSV legado de transferencias liberadas con nombres, para auditores externos. Solo rol TSE. */
  async exportTransfersCsv(role: Role, format: string | undefined) {
    if (role !== 'tse') throw new ForbiddenException('Solo TSE');
    if (format !== 'csv') throw new BadRequestException('format=csv requerido');

    const { data, error } = await this.supabase.admin
      .from('transfers')
      .select(`
        amount,
        created_at,
        from_profile:profiles!transfers_from_owner_fkey(full_name),
        to_profile:profiles!transfers_to_owner_fkey(full_name),
        bonds(bond_id, parties(name))
      `)
      .eq('status', 'liberada')
      .order('created_at', { ascending: true });

    if (error) throw new BadRequestException(error.message);

    const rows = ((data ?? []) as any[]).map((t) => [
      t.bonds?.bond_id ?? '',
      (t.created_at ?? '').slice(0, 10),
      t.from_profile?.full_name ?? '',
      t.to_profile?.full_name ?? '',
      Number(t.amount) || 0,
      t.bonds?.parties?.name ?? '',
    ]);

    return `\uFEFF${[CSV_HEADERS.join(','), ...rows.map((row) => row.map((cell) => this.csvCell(cell)).join(','))].join('\r\n')}\r\n`;
  }

  private csvCell(value: string | number): string {
    const s = String(value);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
}
