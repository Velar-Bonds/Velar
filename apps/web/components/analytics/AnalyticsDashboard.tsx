'use client';
import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Boxes, DollarSign } from 'lucide-react';
import type { AnalyticsQuery, AnalyticsSnapshot } from '@velar/types';
import { getCountryProfile } from '@velar/types';
import { apiFetch } from '../../lib/api';
import { fetchSnapshot } from '../../lib/analytics/client';
import { KpiCard } from './KpiCard';
import { FilterBar } from './FilterBar';
import { SavedViewsMenu } from './SavedViewsMenu';
import { ExportButtons } from './ExportButtons';
import { DrillDownPanel } from './DrillDownPanel';
import { AnalyticsBarChart } from './charts/BarChart';
import { AnalyticsPieChart } from './charts/PieChart';
import { AnalyticsAreaChart } from './charts/AreaChart';
import { AnalyticsLineChart } from './charts/LineChart';
import { AnalyticsStackedBarChart } from './charts/StackedBarChart';

const fmtCRC = (n: number) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n || 0);
const fmtNum = (n: number) => new Intl.NumberFormat('es-CR').format(n || 0);

/**
 * BI dashboard body shared by `/tse/analytics` and `/partido/analytics`
 * (issue #44). RBAC scoping happens entirely on the backend (docs/AGENTS.md
 * §5) — the frontend only decides whether to SHOW the country/party filters
 * and party-name column; a `partido` caller's snapshot is already restricted
 * to their own party regardless of what this component renders.
 */
export function AnalyticsDashboard({ token, showPartyControls }: { token: string; showPartyControls: boolean }) {
  const [query, setQuery] = useState<AnalyticsQuery>({});
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [parties, setParties] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drillDownTokenId, setDrillDownTokenId] = useState<string | null>(null);

  useEffect(() => {
    if (!showPartyControls) return;
    apiFetch(token, 'GET', '/parties')
      .then((rows) => setParties((rows ?? []).map((p: any) => ({ id: p.id, name: p.name }))))
      .catch(() => setParties([]));
  }, [token, showPartyControls]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchSnapshot(token, query)
      .then((s) => {
        if (active) setSnapshot(s);
      })
      .catch((e) => {
        if (active) setError(e.message ?? 'No se pudo cargar la analítica');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, query]);

  const partyNameById = useMemo(() => Object.fromEntries(parties.map((p) => [p.id, p.name])), [parties]);
  const labelForParty = (partyId: string) => partyNameById[partyId] ?? partyId;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-surface-variant/40 bg-surface/85 px-8 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Análisis de bonos</h1>
          <p className="text-sm text-on-surface-variant">Panel de inteligencia de negocio del ecosistema</p>
        </div>
        <div className="flex items-center gap-3">
          <SavedViewsMenu token={token} query={query} onApply={setQuery} />
          <ExportButtons token={token} query={query} />
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1300px] p-8 pb-20">
        <FilterBar
          query={query}
          onChange={setQuery}
          showCountry={showPartyControls}
          showParty={showPartyControls}
          partyOptions={parties}
        />

        {error && <p className="mb-4 text-sm text-error">{error}</p>}

        {loading || !snapshot ? (
          <div className="flex justify-center py-20">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <KpiCard label="Volumen movido" value={fmtCRC(snapshot.valueVolume.totalVolumeMoved)} Icon={DollarSign} color="text-success" bg="bg-success/10" />
              <KpiCard label="Valor emitido" value={fmtCRC(snapshot.valueVolume.totalEmittedValue)} Icon={Boxes} color="text-primary-container" bg="bg-primary-container/10" />
              <KpiCard label="Bonos emitidos" value={fmtNum(snapshot.valueVolume.totalBonds)} Icon={BarChart3} color="text-primary" bg="bg-primary/10" />
              <KpiCard label="Ventas completadas" value={fmtNum(snapshot.valueVolume.totalSales)} Icon={Activity} color="text-warning" bg="bg-warning/10" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <AnalyticsBarChart
                title="Bonos por estado"
                description="Cantidad de bonos en cada estado"
                data={snapshot.bondStatusBreakdown.map((b) => ({ key: b.status, label: b.status, value: b.count }))}
                valueLabel="Bonos"
              />
              <AnalyticsPieChart
                title="Volumen por país"
                description="Distribución del volumen movido por jurisdicción"
                data={snapshot.countryBreakdown.map((c) => ({
                  key: c.country,
                  label: `${getCountryProfile(c.country).flag} ${getCountryProfile(c.country).name}`,
                  value: c.volumeMoved,
                }))}
                valueLabel="Volumen"
              />
            </div>

            <div className="mt-6">
              <AnalyticsStackedBarChart
                title="Emitido vs. movido por partido"
                description="Valor emitido comparado con el volumen efectivamente vendido"
                data={snapshot.partyBreakdown.map((p) => ({
                  label: labelForParty(p.partyId),
                  emittedValue: p.emittedValue,
                  volumeMoved: p.volumeMoved,
                }))}
                segments={[
                  { key: 'emittedValue', label: 'Emitido', color: 'secondaryContainer' },
                  { key: 'volumeMoved', label: 'Movido', color: 'primary' },
                ]}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <AnalyticsAreaChart title="Emisión en el tiempo" description="Valor facial emitido por período" data={snapshot.issuanceSeries} valueLabel="Valor emitido" />
              <AnalyticsLineChart title="Volumen vendido en el tiempo" description="Ventas liberadas por período" data={snapshot.transferSeries} valueLabel="Volumen" />
            </div>

            <div className="glass-card mt-6 rounded-2xl p-6">
              <h2 className="mb-1 font-semibold" style={{ fontFamily: 'Geist' }}>Embudo de transferencias</h2>
              <p className="mb-5 text-xs text-on-surface-variant">
                {snapshot.funnel.totalStarted} transferencias iniciadas · {snapshot.funnel.completedCount} completadas ·{' '}
                {snapshot.funnel.rejectedCount} rechazadas · {snapshot.funnel.cancelledCount} canceladas
              </p>
              {snapshot.funnel.totalStarted === 0 ? (
                <p className="py-6 text-center text-sm text-on-surface-variant">Sin transferencias todavía.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {snapshot.funnel.stages.map((s) => (
                    <div key={s.step}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{s.step}</span>
                        <span className="font-mono text-xs text-on-surface-variant">
                          {s.reachedCount} · {s.conversionFromStartPct}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-container to-primary transition-all"
                          style={{ width: `${s.conversionFromStartPct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card mt-6 rounded-2xl p-6">
              <h2 className="mb-1 font-semibold" style={{ fontFamily: 'Geist' }}>Top bonos más movidos</h2>
              <p className="mb-5 text-xs text-on-surface-variant">Clic para ver histórico de precios y propietarios</p>
              {snapshot.topBonds.length === 0 ? (
                <p className="py-6 text-center text-sm text-on-surface-variant">Sin ventas todavía.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {snapshot.topBonds.map((b, i) => (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => setDrillDownTokenId(b.key)}
                      className="flex items-center justify-between rounded-xl border border-outline-variant/20 p-3 text-left transition hover:border-primary/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                        <p className="font-mono text-xs font-semibold text-primary">{b.label}</p>
                      </div>
                      <span className="font-mono text-xs font-semibold">{fmtCRC(b.value)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {snapshot.compliance.parties.length > 0 && (
              <div className="glass-card mt-6 rounded-2xl p-6">
                <h2 className="mb-1 font-semibold" style={{ fontFamily: 'Geist' }}>Cumplimiento de reportes</h2>
                <p className="mb-5 text-xs text-on-surface-variant">Estado de los reportes mensuales por partido</p>
                <div className="flex flex-col gap-2">
                  {snapshot.compliance.parties.map((p) => (
                    <div key={p.partyId} className="flex items-center justify-between rounded-xl border border-outline-variant/20 p-3 text-xs">
                      <span className="font-semibold">{labelForParty(p.partyId)}</span>
                      <span className="flex gap-3 text-on-surface-variant">
                        <span className="text-success">{p.onTimeCount} a tiempo</span>
                        <span className="text-warning">{p.lateCount} tarde</span>
                        <span className="text-error">{p.missingCount} sin enviar</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <DrillDownPanel token={token} tokenId={drillDownTokenId} onClose={() => setDrillDownTokenId(null)} />
    </>
  );
}
