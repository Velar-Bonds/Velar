'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { User, CheckCircle } from 'lucide-react';
import { TSEShell } from '../../../components/TSEShell';
import { useSession, apiFetch } from '../../../lib/api';
import { bondAssetUrl } from '../../../lib/stellar';

const fmtDate = (s?: string) => s ? new Date(s).toLocaleString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha';
const fmtMoney = (n: number | null, cur = 'CRC') =>
  n == null ? 'Sin dato' : new Intl.NumberFormat('es-CR', { style: 'currency', currency: cur || 'CRC', maximumFractionDigits: 0 }).format(n);

const STATUS_COLOR: Record<string, string> = {
  emitido: 'bg-blue-100 text-primary border-blue-200',
  activo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  en_venta: 'bg-blue-100 text-primary border-blue-200',
  en_escrow: 'bg-amber-100 text-amber-700 border-amber-200',
  vendido: 'bg-gray-100 text-gray-500 border-gray-200',
  liberada: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  solicitada: 'bg-blue-50 text-primary border-blue-200',
};

function TrazabilidadContent({ token, me }: { token: string; me: any }) {
  const params = useSearchParams();
  const initialBono = params.get('bono') ?? '';
  const [bonds, setBonds] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [sel, setSel] = useState<string>('');
  const [filterParty, setFilterParty] = useState('');
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch(token, 'GET', '/bonds'),
      apiFetch(token, 'GET', '/transfers'),
    ]).then(([bs, trs]) => {
      const nextBonds = Array.isArray(bs) ? bs : [];
      const nextTransfers = Array.isArray(trs) ? trs : [];
      setLoadError('');
      setBonds(nextBonds);
      setTransfers(nextTransfers);
      const init = initialBono ? nextBonds.find((x: any) => x.bond_id === initialBono)?.token_id : nextBonds[0]?.token_id;
      setSel(init ?? nextBonds[0]?.token_id ?? '');
    }).catch((e: any) => {
      setLoadError(e.message ?? 'No se pudo cargar la trazabilidad.');
      setBonds([]);
      setTransfers([]);
      setSel('');
    });
  }, [initialBono, token]);

  const parties = Array.from(new Set(bonds.map((b) => b.parties?.name).filter(Boolean)));
  const filteredBonds = bonds.filter((b) => {
    if (filterParty && b.parties?.name !== filterParty) return false;
    if (search && !b.bond_id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const bond = bonds.find((b) => b.token_id === sel);
  const movs = transfers
    .filter((t) => t.bond_token_id === sel)
    .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
    .map((t) => ({
      owner: t.from_profile?.full_name ?? 'Sin dato',
      to: t.to_profile?.full_name ?? null,
      since: t.created_at,
      status: t.status,
      amount: t.amount,
      escrowContractId: t.escrow_contract_id,
    }));

  const lastReleased = [...movs].reverse().find((m) => m.status === 'liberada');
  const currentOwner = bond?.profiles?.full_name ?? lastReleased?.to ?? 'Sin dato';

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 backdrop-blur-md">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Trazabilidad completa</h1>
      </header>

      <div className="mx-auto w-full max-w-[1300px] p-8 pb-20">
        {loadError && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar bono..." className="field-input text-xs" />
              <select value={filterParty} onChange={(e) => setFilterParty(e.target.value)} className="field-input bg-white text-xs">
                <option value="">Todos los partidos</option>
                {parties.map((p: any) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="glass-card flex flex-col divide-y divide-surface-variant/20 overflow-hidden rounded-2xl">
              {filteredBonds.length === 0 && <p className="p-4 text-sm text-on-surface-variant">No hay registros disponibles todavia.</p>}
              {filteredBonds.map((b) => (
                <button key={b.token_id} onClick={() => setSel(b.token_id)} className={`flex items-center justify-between px-4 py-3 text-left transition ${sel === b.token_id ? 'bg-primary/10' : 'hover:bg-surface-container-low'}`}>
                  <div>
                    <p className="text-sm font-semibold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{b.bond_id}</p>
                    <p className="text-xs text-on-surface-variant">{b.parties?.name ?? 'Sin dato'}</p>
                    <p className="text-xs font-medium">{fmtMoney(b.face_value, b.currency)}</p>
                  </div>
                  <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-variant">{b.status}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8">
            {bond ? (
              <div className="glass-card rounded-2xl p-6">
                <div className="mb-5 grid grid-cols-2 gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-4 md:grid-cols-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">ID</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-primary">{bond.bond_id}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Partido emisor</p>
                    <p className="mt-0.5 text-sm font-semibold">{bond.parties?.name ?? 'Sin dato'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Monto</p>
                    <p className="mt-0.5 text-sm font-bold">{fmtMoney(bond.face_value, bond.currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Titular actual</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold"><User size={12} /> {currentOwner}</p>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">Historial de propietarios</h3>
                  <a href={bondAssetUrl(bond.bond_id)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-blue-100">
                    Ver en Stellar Expert
                  </a>
                </div>

                {movs.length === 0 ? (
                  <p className="py-8 text-center text-sm text-on-surface-variant">No hay movimientos registrados para este bono.</p>
                ) : (
                  <div className="relative space-y-4 before:absolute before:bottom-2 before:left-[19px] before:top-2 before:w-0.5 before:bg-outline-variant/40">
                    {movs.map((m, i) => {
                      const colorCls = STATUS_COLOR[m.status] ?? 'bg-gray-100 text-gray-500 border-gray-200';
                      const isLast = i === movs.length - 1;
                      const showsCurrent = isLast && m.status === 'liberada' && m.to === currentOwner;
                      return (
                        <div key={`${m.owner}-${m.since}-${i}`} className="relative flex gap-4">
                          <span className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm ${colorCls}`}>
                            {showsCurrent ? <CheckCircle size={16} /> : <span className="h-2 w-2 rounded-full bg-current" />}
                          </span>
                          <div className={`flex-1 rounded-xl border p-3.5 ${showsCurrent ? 'border-emerald-200 bg-emerald-50/30' : 'border-outline-variant/20 bg-white'}`}>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold">
                                  {m.owner}
                                  {m.to && <><span className="mx-1.5 text-on-surface-variant">a</span><span className={showsCurrent ? 'text-emerald-700' : ''}>{m.to}</span></>}
                                  {showsCurrent && <span className="ml-2 text-xs font-normal text-emerald-600">(titular actual)</span>}
                                </p>
                                {m.amount && <p className="text-xs font-medium text-on-surface-variant">{fmtMoney(m.amount)}</p>}
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-on-surface-variant">{fmtDate(m.since)}</p>
                                <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${colorCls}`}>{m.status}</span>
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
                Selecciona un bono para ver su historial.
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
