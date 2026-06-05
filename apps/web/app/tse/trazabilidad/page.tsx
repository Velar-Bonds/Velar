'use client';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, ExternalLink, User, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { TSEShell } from '../../../components/TSEShell';
import { useSession, apiFetch } from '../../../lib/api';
import { SEED_BONDS, SEED_TRANSFERS, SEED_TRACEABILITY } from '../../../lib/tse-seed';
import { bondAssetUrl } from '../../../lib/stellar';

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

function TrazabilidadContent({ token, me }: { token: string; me: any }) {
  const params = useSearchParams();
  const initialBono = params.get('bono') ?? '';

  const [bonds, setBonds] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [sel, setSel] = useState<string>('');
  const [filterParty, setFilterParty] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch(token, 'GET', '/bonds').catch(() => null),
      apiFetch(token, 'GET', '/transfers').catch(() => null),
    ]).then(([bs, trs]) => {
      const b = Array.isArray(bs) && bs.length ? bs : SEED_BONDS;
      const t = Array.isArray(trs) && trs.length ? trs : SEED_TRANSFERS;
      setBonds(b); setTransfers(t);
      const init = initialBono ? b.find((x: any) => x.bond_id === initialBono)?.token_id : b[0]?.token_id;
      setSel(init ?? b[0]?.token_id ?? '');
    });
  }, [token]); // eslint-disable-line

  const parties = Array.from(new Set(bonds.map((b) => b.parties?.name).filter(Boolean)));

  const filteredBonds = bonds.filter((b) => {
    if (filterParty && b.parties?.name !== filterParty) return false;
    if (search && !b.bond_id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const bond = bonds.find((b) => b.token_id === sel);

  // Historial de este bono: transfers + seed traceability
  const realMovs = transfers
    .filter((t) => t.bond_token_id === sel)
    .map((t) => ({
      owner: t.from_profile?.full_name ?? '?',
      to: t.to_profile?.full_name,
      since: t.created_at,
      status: t.status,
      amount: t.amount,
      tx: t.escrow_contract_id,
    }));

  const seedMovs = bond ? (SEED_TRACEABILITY[bond.bond_id] ?? []) : [];
  const movs = realMovs.length > 0 ? realMovs : seedMovs;

  const currentOwner = bond?.profiles?.full_name ?? (movs.length > 0 ? (movs.at(-1) as any)?.owner ?? '—' : '—');

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 backdrop-blur-md">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Trazabilidad completa</h1>
      </header>

      <div className="mx-auto w-full max-w-[1300px] p-8 pb-20">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Lista de bonos */}
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
                <button key={b.token_id} onClick={() => setSel(b.token_id)}
                  className={`flex items-center justify-between px-4 py-3 text-left transition ${sel === b.token_id ? 'bg-primary/10' : 'hover:bg-surface-container-low'}`}>
                  <div>
                    <p className="text-sm font-semibold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{b.bond_id}</p>
                    <p className="text-xs text-on-surface-variant">{b.parties?.name ?? '—'}</p>
                    <p className="text-xs font-medium">{fmtMoney(b.face_value, b.currency)}</p>
                  </div>
                  <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-variant">{b.status}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-8">
            {bond ? (
              <div className="glass-card rounded-2xl p-6">
                {/* Info del bono */}
                <div className="mb-5 grid grid-cols-2 gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-4 md:grid-cols-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">ID</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-primary">{bond.bond_id}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Partido emisor</p>
                    <p className="mt-0.5 text-sm font-semibold">{bond.parties?.name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Monto</p>
                    <p className="mt-0.5 text-sm font-bold">{fmtMoney(bond.face_value, bond.currency)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Dueño actual</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold"><User size={12} /> {currentOwner}</p>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">Historial de propietarios</h3>
                  <a href={bondAssetUrl(bond.bond_id)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-blue-100">
                    <ExternalLink size={12} /> Ver en Stellar Expert
                  </a>
                </div>

                {movs.length === 0 ? (
                  <p className="py-8 text-center text-sm text-on-surface-variant">No hay movimientos registrados para este bono.</p>
                ) : (
                  <div className="relative space-y-4 before:absolute before:bottom-2 before:left-[19px] before:top-2 before:w-0.5 before:bg-outline-variant/40">
                    {(movs as any[]).map((m, i) => {
                      const colorCls = STATUS_COLOR[m.status] ?? 'bg-gray-100 text-gray-500 border-gray-200';
                      const isLast = i === movs.length - 1;
                      return (
                        <div key={i} className="relative flex gap-4">
                          <span className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm ${colorCls}`}>
                            {isLast ? <CheckCircle size={16} /> : <ArrowRight size={16} />}
                          </span>
                          <div className={`flex-1 rounded-xl border p-3.5 ${isLast ? 'border-emerald-200 bg-emerald-50/30' : 'border-outline-variant/20 bg-white'}`}>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold">
                                  {m.owner}
                                  {m.to && <><span className="mx-1.5 text-on-surface-variant">→</span>{m.to}</>}
                                  {isLast && <span className="ml-2 text-xs font-normal text-emerald-600">(dueño actual)</span>}
                                </p>
                                {m.amount && <p className="text-xs font-medium text-on-surface-variant">{fmtMoney(m.amount)}</p>}
                                {m.tx && <p className="font-mono text-[11px] text-on-surface-variant">{m.tx}</p>}
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-on-surface-variant">{fmtDate(m.since)}</p>
                                {m.until && <p className="text-[11px] text-on-surface-variant">hasta {fmtDate(m.until)}</p>}
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
