'use client';
import { useEffect, useState } from 'react';
import { Waypoints, ArrowRight, ExternalLink, User } from 'lucide-react';
import { PartidoShell } from '../../../components/PartidoShell';
import { useSession, apiFetch } from '../../../lib/api';
import { bondExplorerUrl } from '../../../lib/stellar';

type BondSummary = { id: string; name: string; value: number | null; status: string };
type OwnerEntry = {
  ownerId: string; name: string; since: string; until: string | null;
  paid: boolean; current: boolean;
};
type TraceabilityResponse = {
  bond: any; events: any[]; transfers: any[]; owners: OwnerEntry[];
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmt = (n: number | null | undefined) => n == null ? '—' : '₡' + Number(n).toLocaleString('es-CR');

const STATUS_COLOR: Record<string, string> = {
  solicitada: 'bg-blue-100 text-primary',
  liberada: 'bg-emerald-100 text-emerald-700',
  cancelada: 'bg-gray-100 text-gray-500',
  en_escrow: 'bg-amber-100 text-amber-700',
  pago_registrado: 'bg-purple-100 text-purple-700',
};

export default function PartidoTrazabilidadPage() {
  const { token, me, loading, error } = useSession();
  const [bonds, setBonds] = useState<BondSummary[]>([]);
  const [traceability, setTraceability] = useState<TraceabilityResponse | null>(null);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch(token, 'GET', '/bonds/summary').catch(() => []).then((data: any) => {
      const b: BondSummary[] = Array.isArray(data) ? data : [];
      setBonds(b);
      if (b[0]) setSel(b[0].id);
    });
    /* eslint-disable-next-line */
  }, [token]);

  useEffect(() => {
    if (!sel || !token) return;
    apiFetch(token, 'GET', `/audit/bonds/${sel}/traceability`)
      .then((data: any) => setTraceability(data as TraceabilityResponse))
      .catch(() => setTraceability(null));
  }, [sel, token]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const bond = traceability?.bond;
  const owners = traceability?.owners ?? [];
  const currentOwnerName = owners.find((o) => o.current)?.name ?? '—';

  return (
    <PartidoShell me={me}>
      <header className="sticky top-0 z-40 flex h-20 items-center border-b border-outline-variant/30 bg-surface/70 px-10 shadow-sm backdrop-blur-xl">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Geist' }}>Trazabilidad</h1>
      </header>

      <div className="mx-auto w-full max-w-[1200px] p-10 pb-20">
        {bonds.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-outline-variant/40 py-20 text-center">
            <Waypoints size={36} className="text-outline" />
            <p className="font-semibold">Sin bonos para rastrear</p>
            <p className="text-sm text-on-surface-variant">Cuando tengas bonos aprobados, vas a poder ver su historial completo acá.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Lista de bonos */}
            <div className="lg:col-span-4">
              <div className="glass-card flex flex-col gap-1 rounded-2xl p-2">
                {bonds.map((b) => (
                  <button key={b.id} onClick={() => setSel(b.id)}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition ${sel === b.id ? 'bg-primary/10' : 'hover:bg-surface-container-low'}`}>
                    <div>
                      <p className="text-sm font-semibold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{b.name}</p>
                      <p className="text-xs text-on-surface-variant">{fmt(b.value)}</p>
                    </div>
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] text-on-surface-variant">{b.status}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="lg:col-span-8">
              <div className="glass-card rounded-2xl p-6">
                {bond && (
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-on-surface-variant">Bono seleccionado</p>
                      <p className="text-xl font-bold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{(bond as any)?.bondId ?? '—'}</p>
                      <p className="text-sm text-on-surface-variant">Valor: {fmt((bond as any)?.faceValue)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-on-surface-variant">Dueño actual</p>
                      <p className="flex items-center justify-end gap-1.5 text-sm font-semibold"><User size={14} /> {currentOwnerName}</p>
                    </div>
                  </div>
                )}

                {bond && (
                  <a href={bondExplorerUrl((bond as any)?.sorobanContractId, (bond as any)?.bondId)} target="_blank" rel="noopener noreferrer"
                    className="mb-5 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs font-medium text-primary transition hover:bg-blue-100">
                    <ExternalLink size={13} /> Ver transacciones en Stellar Expert
                  </a>
                )}

                {owners.length === 0 ? (
                  <p className="py-8 text-center text-sm text-on-surface-variant">Este bono todavía no tiene propietarios registrados.</p>
                ) : (
                  <div className="relative space-y-5 before:absolute before:bottom-2 before:left-[18px] before:top-2 before:w-0.5 before:bg-outline-variant/40">
                    {owners.map((o, i) => {
                      const isPaid = o.paid;
                      const isCurrent = o.current;
                      const colorCls = isPaid
                        ? 'bg-emerald-100 text-emerald-700'
                        : isCurrent
                          ? 'bg-blue-100 text-primary'
                          : 'bg-gray-100 text-gray-500';
                      return (
                        <div key={i} className="relative flex gap-4">
                          <span className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${colorCls}`}>
                            <ArrowRight size={15} />
                          </span>
                          <div className="flex-1 rounded-xl border border-outline-variant/20 bg-white p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold">
                                {o.name}
                                {isCurrent && <span className="ml-2 text-xs font-normal text-blue-600">(actual)</span>}
                              </p>
                              <span className="text-xs text-on-surface-variant">{fmtDate(o.since)}</span>
                            </div>
                            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-primary'}`}>
                              {o.paid ? 'Pagado' : (o.current ? 'Actual' : 'Anterior')}
                            </span>
                            {o.until && (
                              <p className="mt-1 text-[11px] text-on-surface-variant">hasta {fmtDate(o.until)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PartidoShell>
  );
}
