'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, DollarSign, Activity, Boxes, Users, BarChart3, ArrowRight } from 'lucide-react';
import { TSEShell } from '../../../components/TSEShell';
import { useSession, apiFetch } from '../../../lib/api';

const fmtCRC = (n: number) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n || 0);
const fmtNum = (n: number) => new Intl.NumberFormat('es-CR').format(n || 0);

export default function AnalyticsPage() {
  const { token, me, loading, error } = useSession();
  const [overview, setOverview] = useState<any>(null);
  const [byParty, setByParty] = useState<any[]>([]);
  const [topBonds, setTopBonds] = useState<any[]>([]);
  const [volume, setVolume] = useState<any[]>([]);
  const [selBond, setSelBond] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<any>(null);
  const [owners, setOwners] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch(token, 'GET', '/analytics/overview').catch(() => null),
      apiFetch(token, 'GET', '/analytics/by-party').catch(() => []),
      apiFetch(token, 'GET', '/analytics/top-bonds?limit=5').catch(() => []),
      apiFetch(token, 'GET', '/analytics/volume-over-time?days=30').catch(() => []),
    ]).then(([ov, bp, tb, vol]) => {
      setOverview(ov);
      setByParty(bp);
      setTopBonds(tb);
      setVolume(vol);
      if (tb && tb[0]) setSelBond(tb[0].token_id);
    });
  }, [token]); // eslint-disable-line

  useEffect(() => {
    if (!token || !selBond) return;
    Promise.all([
      apiFetch(token, 'GET', `/analytics/bonds/${selBond}/price-history`).catch(() => null),
      apiFetch(token, 'GET', `/analytics/bonds/${selBond}/owners`).catch(() => null),
    ]).then(([ph, ow]) => { setPriceHistory(ph); setOwners(ow); });
  }, [token, selBond]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const maxVolume = Math.max(...byParty.map((p) => p.volume_moved), 1);
  const maxDayVol = Math.max(...volume.map((v) => v.volume), 1);

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Análisis de bonos</h1>
          <p className="text-sm text-on-surface-variant">Métricas, precios y propietarios</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1300px] p-8 pb-20">
        {/* Overview cards */}
        {overview && (
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Volumen movido', value: fmtCRC(overview.total_volume_crc), Icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Valor emitido', value: fmtCRC(overview.total_emitted_crc), Icon: Boxes, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Bonos emitidos', value: fmtNum(overview.total_bonds), Icon: BarChart3, color: 'text-primary', bg: 'bg-blue-50' },
              { label: 'Ventas completadas', value: fmtNum(overview.total_sales), Icon: Activity, color: 'text-teal-500', bg: 'bg-teal-50' },
            ].map(({ label, value, Icon, color, bg }) => (
              <div key={label} className="glass-card flex items-center gap-4 rounded-xl p-5 transition-transform hover:-translate-y-0.5">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} strokeWidth={2.1} />
                </div>
                <div>
                  <p className="text-xs font-medium text-on-surface-variant">{label}</p>
                  <p className="text-xl font-bold">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Volumen por partido */}
          <div className="glass-card rounded-2xl p-6 lg:col-span-2">
            <h2 className="mb-1 font-semibold" style={{ fontFamily: 'Geist' }}>Volumen movido por partido</h2>
            <p className="mb-5 text-xs text-on-surface-variant">Suma de ventas liberadas por partido emisor</p>
            {byParty.length === 0 ? (
              <p className="py-8 text-center text-sm text-on-surface-variant">Sin datos todavía.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {byParty.map((p) => (
                  <div key={p.party_id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{p.party_name}</span>
                      <span className="font-mono font-semibold text-primary">{fmtCRC(p.volume_moved)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-container to-primary transition-all"
                        style={{ width: `${(p.volume_moved / maxVolume) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 flex gap-4 text-[11px] text-on-surface-variant">
                      <span>{p.bonds_count} bonos</span>
                      <span>{p.sales_count} ventas</span>
                      <span>Emitido: {fmtCRC(p.emitted_value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top bonos */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="mb-1 font-semibold" style={{ fontFamily: 'Geist' }}>Top bonos más movidos</h2>
            <p className="mb-5 text-xs text-on-surface-variant">Por volumen acumulado</p>
            {topBonds.length === 0 ? (
              <p className="py-6 text-center text-sm text-on-surface-variant">Sin ventas todavía.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {topBonds.map((b, i) => (
                  <button
                    key={b.token_id}
                    onClick={() => setSelBond(b.token_id)}
                    className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${selBond === b.token_id ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:border-primary/30'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                      <div>
                        <p className="font-mono text-xs font-semibold text-primary">{b.bond_id}</p>
                        <p className="text-[11px] text-on-surface-variant">{b.party} · {b.sales} venta{b.sales !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-semibold">{fmtCRC(b.volume)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Volumen en el tiempo */}
        {volume.length > 0 && (
          <div className="glass-card mt-6 rounded-2xl p-6">
            <h2 className="mb-1 font-semibold" style={{ fontFamily: 'Geist' }}>Volumen últimos 30 días</h2>
            <p className="mb-5 text-xs text-on-surface-variant">Total CRC movido por día</p>
            <div className="flex h-40 items-end gap-1">
              {volume.map((v) => (
                <div key={v.date} className="group relative flex-1" title={`${v.date}: ${fmtCRC(v.volume)}`}>
                  <div
                    className="rounded-t bg-gradient-to-t from-primary-container to-primary transition-all hover:from-emerald-500 hover:to-emerald-400"
                    style={{ height: `${(v.volume / maxDayVol) * 100}%` }}
                  />
                  <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
                    {fmtCRC(v.volume)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-on-surface-variant">
              <span>{volume[0]?.date}</span>
              <span>{volume[volume.length - 1]?.date}</span>
            </div>
          </div>
        )}

        {/* Detalle del bono seleccionado */}
        {priceHistory && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Histórico de precios */}
            <div className="glass-card rounded-2xl p-6">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold" style={{ fontFamily: 'Geist' }}>Histórico de precios</h2>
                  <p className="text-xs text-on-surface-variant">{priceHistory.bond_id} · {priceHistory.party_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{fmtCRC(priceHistory.current_price)}</p>
                  <p className={`flex items-center justify-end gap-1 text-xs font-semibold ${priceHistory.total_change_pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {priceHistory.total_change_pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {priceHistory.total_change_pct > 0 ? '+' : ''}{priceHistory.total_change_pct}% vs facial
                  </p>
                </div>
              </div>

              {priceHistory.points.length === 0 ? (
                <p className="py-6 text-center text-sm text-on-surface-variant">No hay ventas registradas todavía.</p>
              ) : (
                <>
                  {/* Mini chart */}
                  <div className="mb-4 flex h-24 items-end gap-2 border-b border-l border-outline-variant/30 pl-2">
                    {priceHistory.points.map((pt: any, i: number) => {
                      const max = Math.max(priceHistory.facial_value, ...priceHistory.points.map((p: any) => p.price));
                      const h = (pt.price / max) * 100;
                      return (
                        <div key={i} className="group relative flex flex-1 flex-col items-center">
                          <div
                            className={`w-full rounded-t transition-all ${pt.change_pct >= 0 ? 'bg-emerald-500' : 'bg-red-400'}`}
                            style={{ height: `${h}%` }}
                          />
                          <span className="pointer-events-none absolute bottom-full mb-1 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
                            {fmtCRC(pt.price)} · {pt.change_pct > 0 ? '+' : ''}{pt.change_pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {priceHistory.points.map((pt: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-outline-variant/20 px-3 py-2 text-xs">
                        <span className="text-on-surface-variant">Venta #{pt.index}</span>
                        <span className="font-mono font-semibold">{fmtCRC(pt.price)}</span>
                        <span className={`flex items-center gap-1 font-semibold ${pt.change_pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {pt.change_pct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {pt.change_pct > 0 ? '+' : ''}{pt.change_pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Propietarios históricos */}
            {owners && (
              <div className="glass-card rounded-2xl p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Users size={18} className="text-primary" />
                  <h2 className="font-semibold" style={{ fontFamily: 'Geist' }}>Propietarios históricos</h2>
                </div>
                <p className="mb-4 text-xs text-on-surface-variant">{owners.owners_count} propietario{owners.owners_count !== 1 ? 's' : ''} en la historia del bono</p>

                <div className="flex flex-col gap-2">
                  {owners.owners.map((o: any, i: number) => (
                    <div key={i} className={`rounded-xl border p-3 ${o.current ? 'border-emerald-200 bg-emerald-50/30' : 'border-outline-variant/20'}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          {o.name ?? 'Sin dato'}
                          {o.current && <span className="ml-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">DUEÑO ACTUAL</span>}
                        </p>
                        {o.paid != null && <span className="font-mono text-xs font-semibold text-primary">{fmtCRC(o.paid)}</span>}
                      </div>
                      <p className="mt-1 text-[11px] text-on-surface-variant">
                        Desde {new Date(o.since).toLocaleDateString('es-CR')}
                        {o.until && <> hasta {new Date(o.until).toLocaleDateString('es-CR')}</>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </TSEShell>
  );
}
