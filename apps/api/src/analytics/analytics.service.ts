import { BadRequestException, Injectable, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { Role } from '@velar/types';

const AUTHORITY: Role[] = ['tse', 'admin'];
const CSV_HEADERS = ['bond_id', 'transfer_date', 'seller_name', 'buyer_name', 'amount_colones', 'party_name'] as const;

@Injectable()
export class AnalyticsService {
  constructor(private supabase: SupabaseService) {}

  private assertAuth(role: Role) {
    if (!AUTHORITY.includes(role)) throw new ForbiddenException('Solo TSE/admin');
  }

  private assertTseOnly(role: Role) {
    if (role !== 'tse') throw new ForbiddenException('Solo TSE');
  }

  /** Overview general del sistema. */
  async overview(role: Role) {
    this.assertAuth(role);
    const db = this.supabase.admin;

    const [bondsRes, transfersRes, requestsRes] = await Promise.all([
      db.from('bonds').select('*, parties(id, name)'),
      db.from('transfers').select('amount, status, from_owner, to_owner, bond_token_id, created_at, bonds(issuer_party_id, parties(name))'),
      db.from('bond_requests').select('id, status'),
    ]);

    const bonds = bondsRes.data ?? [];
    const transfers = transfersRes.data ?? [];
    const requests = requestsRes.data ?? [];

    const liberadas = transfers.filter((t: any) => t.status === 'liberada');
    const totalVolumen = liberadas.reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
    const valorEmitido = bonds.reduce((s: number, b: any) => s + (Number(b.face_value) || 0), 0);

    return {
      total_bonds: bonds.length,
      total_volume_crc: totalVolumen,
      total_emitted_crc: valorEmitido,
      total_transfers: transfers.length,
      total_sales: liberadas.length,
      pending_requests: requests.filter((r: any) => r.status === 'pendiente').length,
      approved_requests: requests.filter((r: any) => r.status === 'aprobado').length,
      rejected_requests: requests.filter((r: any) => r.status === 'rechazado').length,
      bonds_by_status: this.groupCount(bonds, (b: any) => b.status),
    };
  }

  /** Métricas por partido. */
  async byParty(role: Role) {
    this.assertAuth(role);
    const db = this.supabase.admin;

    const [partiesRes, bondsRes, transfersRes] = await Promise.all([
      db.from('parties').select('id, name, code'),
      db.from('bonds').select('issuer_party_id, face_value, status'),
      db.from('transfers').select('amount, status, bonds!inner(issuer_party_id)'),
    ]);

    const parties = partiesRes.data ?? [];
    const bonds = bondsRes.data ?? [];
    const transfers = (transfersRes.data ?? []) as any[];

    return parties.map((p: any) => {
      const partyBonds = bonds.filter((b: any) => b.issuer_party_id === p.id);
      const partyTransfers = transfers.filter((t: any) => t.bonds?.issuer_party_id === p.id);
      const sales = partyTransfers.filter((t: any) => t.status === 'liberada');
      const volume = sales.reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
      const emitted = partyBonds.reduce((s: number, b: any) => s + (Number(b.face_value) || 0), 0);

      return {
        party_id: p.id,
        party_name: p.name,
        party_code: p.code,
        bonds_count: partyBonds.length,
        emitted_value: emitted,
        sales_count: sales.length,
        volume_moved: volume,
        active_bonds: partyBonds.filter((b: any) => ['activo', 'en_venta'].includes(b.status)).length,
        sold_bonds: partyBonds.filter((b: any) => b.status === 'vendido').length,
      };
    }).sort((a, b) => b.volume_moved - a.volume_moved);
  }

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

    // Construir cadena de propietarios
    const owners: any[] = [];
    if (liberadas.length === 0) {
      // Solo el partido (emisor original)
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
      // Primer dueño = vendedor de la primera transferencia
      const first = liberadas[0];
      owners.push({
        name: first.from_profile?.full_name,
        email: first.from_profile?.email,
        since: bond.created_at,
        until: first.created_at,
        paid: null, // emitido, no comprado
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

  /** Top N bonos más movidos. */
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

  /** CSV de transferencias liberadas para auditores externos. Solo rol TSE. */
  async exportTransfersCsv(role: Role, format: string | undefined) {
    this.assertTseOnly(role);
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

  /** Serie temporal del volumen movido por día. */
  async volumeOverTime(role: Role, days = 30) {
    this.assertAuth(role);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data } = await this.supabase.admin
      .from('transfers')
      .select('amount, created_at')
      .eq('status', 'liberada')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    const byDay = new Map<string, { date: string; volume: number; sales: number }>();
    ((data ?? []) as any[]).forEach((t: any) => {
      const day = (t.created_at ?? '').slice(0, 10);
      const cur = byDay.get(day) ?? { date: day, volume: 0, sales: 0 };
      cur.volume += Number(t.amount) || 0;
      cur.sales += 1;
      byDay.set(day, cur);
    });
    return [...byDay.values()];
  }

  private groupCount<T>(arr: T[], key: (x: T) => string): Record<string, number> {
    return arr.reduce<Record<string, number>>((acc, x) => {
      const k = key(x) ?? 'unknown';
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
  }

  private csvCell(value: string | number): string {
    const s = String(value);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
}
