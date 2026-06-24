'use client';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, ExternalLink, User, CheckCircle } from 'lucide-react';
import { TSEShell } from '../../../components/TSEShell';
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

const fmtDate = (s?: string) => s ? new Date(s).toLocaleString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtMoney = (n: number | null, cur = 'CRC') =>
  n == null ? '—' : new Intl.NumberFormat('es-CR', { style: 'currency', currency: cur || 'CRC', maximumFractionDigits: 0 }).format(n);

const STATUS_COLOR: Record<string, string> = {
  emitido: 'bg-blue-100 text-primary border-blue-200',
  activo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  en_venta: 'bg-purple-100 text-purple-700 border-purple-200',
  en_escrow: 'bg-amber-100 text-amber-700 border-amber-200',
  vendido: 'bg-gray-100 text-gray-500 border-gray-200',
  liberada: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  solicitada: 'bg-blue-50 text-primary border-blue-200',
};

const OWNER_STATUS_COLOR: Record<string, string> = {
  true: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  false: 'bg-amber-100 text-amber-700 border-amber-200',
};

function TrazabilidadContent({ token, me }: { token: string; me: any }) {
  const params = useSearchParams();
  const initialBono = params.get('bono') ?? '';

  const [bonds, setBonds] = useState<BondSummary[]>([]);
  const [traceability, setTraceability] = useState<TraceabilityResponse | null>(null);
  const [sel, setSel] = useState<string>('');
  const [filterParty, setFilterParty] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch(token, 'GET', '/bonds/summary').catch(() => null).then((data: any) => {
      const b: BondSummary[] = Array.isArray(data) ? data : [];
      setBonds(b);
      const init = initialBono ? b.find((x) => x.name === initialBono)?.id : b[0]?.id;
      setSel(init ?? b[0]?.id ?? '');
    });
  }, [token]); // eslint-disable-line

  useEffect(() => {
    if (!sel) return;
    apiFetch(token, 'GET', `/audit/bonds/${sel}/traceability`)
      .then((data: any) => setTraceability(data as TraceabilityResponse))
      .catch(() => setTraceability(null));
  }, [sel, token]);

  const parties = Array.from(new Set(bonds.map((b) => b.name.split('-')[0]).filter(Boolean)));

  const filteredBonds = bonds.filter((b) => {
    if (filterParty && !b.name.includes(filterParty)) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const bond = traceability?.bond;
  const owners = traceability?.owners ?? [];

  // Derive current owner display from owners chain
  const currentOwnerName = owners.find((o) => o.current)?.name ?? (bond as any)?.currentOwner ?? '—';

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 backdrop-blur-md">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Trazabilidad completa</h1>
      </header>

      <div className="mx-auto w-full max-w-[1300px] p-8 pb-20">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Lista de bonos (sidebar) */}
          <div className="lg:col-span-4">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar bono…" className="field-input text-xs" />
              <select value={filterParty} onChange={(e) => setFilterParty(e.target.value)} className="field-input bg-white text-xs">
                <option value="">Todos los partidos</option>
                {parties.map((p: any) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="glass-card flex flex-col divide-y divide-surface-variant/20 rounded-2xl overflow-hidden">
              {filteredBonds.length === 0 && <p className="p-4 text-sm text-on-surface-variant">Sin resultados.</p>}
              {filteredBonds.map((b) => (
                <button key={b.id} onClick={() => setSel(b.id)}
                  className={`flex items-center justify-between px-4 py-3 text-left transition ${sel === b.id ? 'bg-primary/10' : 'hover:bg-surface-container-low'}`}>
                  <div>
                    <p className="text-sm font-semibold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{b.name}</p>
                    <p className="text-xs text-on-surface-variant">{fmtMoney(b.value)}</p>
                  </div>
                  <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-variant">{b.status}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-8">
            {traceability ? (
              <div className="glass-card rounded-2xl p-6">
                {/* Info del bono */}
                <div className="mb-5 grid grid-cols-2 gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-4 md:grid-cols-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">ID</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-primary">{(bond as any)?.bondId ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Partido emisor</p>
                    <p className="mt-0.5 text-sm font-semibold">{owners[0]?.name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Monto</p>
                    <p className="mt-0.5 text-sm font-bold">{fmtMoney((bond as any)?.faceValue ?? null)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Dueño actual</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold"><User size={12} /> {currentOwnerName}</p>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">Historial de propietarios</h3>
                  <a href={bondExplorerUrl((bond as any)?.sorobanContractId, (bond as any)?.bondId)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-blue-100">
                    <ExternalLink size={12} /> Ver en Stellar Expert
                  </a>
                </div>

                {owners.length === 0 ? (
                  <p className="py-8 text-center text-sm text-on-surface-variant">No hay propietarios registrados para este bono.</p>
                ) : (
                  <div className="relative space-y-4 before:absolute before:bottom-2 before:left-[19px] before:top-2 before:w-0.5 before:bg-outline-variant/40">
                    {owners.map((o, i) => {
                      const isLast = i === owners.length - 1;
                      const colorCls = OWNER_STATUS_COLOR[String(o.current)] ?? 'bg-gray-100 text-gray-500 border-gray-200';
                      return (
                        <div key={i} className="relative flex gap-4">
                          <span className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm ${colorCls}`}>
                            {isLast ? <CheckCircle size={16} /> : <ArrowRight size={16} />}
                          </span>
                          <div className={`flex-1 rounded-xl border p-3.5 ${isLast ? 'border-emerald-200 bg-emerald-50/30' : 'border-outline-variant/20 bg-white'}`}>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold">
                                  {o.name}
                                  {o.current && <span className="ml-2 text-xs font-normal text-emerald-600">(dueño actual)</span>}
                                </p>
                                {o.paid && <span className="mt-1 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Pagado</span>}
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-on-surface-variant">{fmtDate(o.since)}</p>
                                {o.until && <p className="text-[11px] text-on-surface-variant">hasta {fmtDate(o.until)}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant/40 text-on-surface-variant">
                Seleccioná un bono para ver su historial
              </div>
            )}
          </div>
        </div>
      </div>
    </TSEShell>
  );
}

export default function TrazabilidadPage() {
  const { token, me, loading, error } = useSession();
  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <TrazabilidadContent token={token} me={me} />
    </Suspense>
  );
}
