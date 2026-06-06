'use client';
import { useEffect, useState, Fragment } from 'react';
import { Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { TSEShell } from '../../../components/TSEShell';
import { useSession, apiFetch } from '../../../lib/api';
import { bondAssetUrl } from '../../../lib/stellar';

type Bond = {
  token_id: string; bond_id: string; status: string; face_value: number | null; currency?: string;
  certificate_number?: string; series?: string; interest_rate?: number | null;
  issue_date?: string; maturity_date?: string; created_at?: string;
  soroban_contract_id?: string | null; soroban_init_tx_hash?: string | null;
  stellar_status?: string | null; stellar_transaction_hash?: string | null;
  parties?: { name?: string; code?: string };
  profiles?: { full_name?: string };
};

const CHIP: Record<string, string> = {
  activo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  en_venta: 'bg-blue-50 text-primary border-blue-200',
  en_escrow: 'bg-amber-50 text-amber-700 border-amber-200',
  vendido: 'bg-gray-100 text-gray-500 border-gray-200',
  emitido: 'bg-blue-50 text-primary border-blue-200',
  congelado: 'bg-red-50 text-red-600 border-red-200',
};

const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha';
const fmtMoney = (n: number | null, cur = 'CRC') =>
  n == null ? 'Sin dato' : new Intl.NumberFormat('es-CR', { style: 'currency', currency: cur || 'CRC', maximumFractionDigits: 0 }).format(n);
const shortContract = (id?: string | null) => id ? `${id.slice(0, 2)}...${id.slice(-4)}` : '';

export default function RegistrosPage() {
  const { token, me, loading, error } = useSession();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyOnchain, setBusyOnchain] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [loadError, setLoadError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterParty, setFilterParty] = useState('');
  const [filterMontoMin, setFilterMontoMin] = useState('');
  const [filterMontoMax, setFilterMontoMax] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const load = (tok: string) =>
    apiFetch(tok, 'GET', '/bonds').then((bs) => {
      setLoadError('');
      setBonds(Array.isArray(bs) ? bs : []);
    }).catch((e: any) => {
      setBonds([]);
      setLoadError(e.message ?? 'No se pudieron cargar los registros.');
    });

  useEffect(() => {
    if (token) load(token);
  }, [token]);

  async function issueOnchain(tokenId: string) {
    if (!token) return;
    setBusyOnchain(tokenId);
    setMsg('');
    try {
      const res = await apiFetch(token, 'PATCH', `/bonds/${tokenId}/issue-onchain`);
      setMsg(res?.txHash ? `Token emitido on-chain: ${res.txHash}` : 'Token emitido on-chain.');
      load(token);
    } catch (e: any) {
      setMsg(e.message ?? 'No se pudo emitir el token.');
    } finally {
      setBusyOnchain(null);
    }
  }

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const parties = Array.from(new Set(bonds.map((b) => b.parties?.name).filter(Boolean)));
  const filtered = bonds
    .filter((b) => {
      if (filterStatus && b.status !== filterStatus) return false;
      if (filterParty && b.parties?.name !== filterParty) return false;
      if (filterMontoMin && Number(b.face_value) < Number(filterMontoMin)) return false;
      if (filterMontoMax && Number(b.face_value) > Number(filterMontoMax)) return false;
      if (filterDateFrom && b.created_at && b.created_at < filterDateFrom) return false;
      if (filterDateTo && b.created_at && b.created_at > `${filterDateTo}T23:59:59`) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!`${b.bond_id} ${b.parties?.name ?? ''} ${b.certificate_number ?? ''}`.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const va = sortBy === 'date' ? (a.created_at ?? '') : (Number(a.face_value) || 0);
      const vb = sortBy === 'date' ? (b.created_at ?? '') : (Number(b.face_value) || 0);
      return sortAsc ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
    });

  const SortBtn = ({ col, label }: { col: 'date' | 'amount'; label: string }) => (
    <button onClick={() => { if (sortBy === col) setSortAsc(!sortAsc); else { setSortBy(col); setSortAsc(false); } }} className={`flex items-center gap-1 ${sortBy === col ? 'text-primary' : ''}`}>
      {label}
    </button>
  );

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Registros de bonos</h1>
          <p className="text-sm text-on-surface-variant">{filtered.length} de {bonds.length} bonos</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1300px] p-8 pb-20">
        {loadError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}
        {msg && <div className="mb-4 rounded-xl border border-[#d8e2f5] bg-white px-4 py-2.5 text-sm">{msg}</div>}

        <div className="mb-6 rounded-2xl border border-outline-variant/30 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
            <Filter size={15} /> Filtros
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-7">
            <div className="relative lg:col-span-2">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar bono, partido..." className="field-input pl-8 text-xs" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="field-input bg-white text-xs">
              <option value="">Todos los estados</option>
              {['activo', 'en_venta', 'en_escrow', 'vendido', 'emitido', 'congelado'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterParty} onChange={(e) => setFilterParty(e.target.value)} className="field-input bg-white text-xs">
              <option value="">Todos los partidos</option>
              {parties.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="number" value={filterMontoMin} onChange={(e) => setFilterMontoMin(e.target.value)} placeholder="Monto min." className="field-input text-xs" />
            <input type="number" value={filterMontoMax} onChange={(e) => setFilterMontoMax(e.target.value)} placeholder="Monto max." className="field-input text-xs" />
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="field-input text-xs" />
          </div>
        </div>

        <div className="glass-card rounded-2xl">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="border-b border-surface-variant/30 bg-surface-container-low/50 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3">ID del bono</th>
                  <th className="px-5 py-3">Partido emisor</th>
                  <th className="px-5 py-3">Titular actual</th>
                  <th className="px-5 py-3"><SortBtn col="amount" label="Monto" /></th>
                  <th className="px-5 py-3">Serie / Cert.</th>
                  <th className="px-5 py-3">Tasa</th>
                  <th className="px-5 py-3"><SortBtn col="date" label="Vencimiento" /></th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/20">
                {filtered.length === 0 && <tr><td colSpan={9} className="py-10 text-center text-on-surface-variant">No hay registros disponibles.</td></tr>}
                {filtered.map((b) => {
                  const isExp = expanded === b.token_id;
                  const hasSoroban = Boolean(b.soroban_contract_id);
                  const canIssueOnchain = b.stellar_status !== 'confirmed';
                  return (
                    <Fragment key={b.token_id}>
                      <tr className="bg-white/60 transition-colors hover:bg-primary/[0.02]">
                        <td className="px-5 py-3.5">
                          <button onClick={() => setExpanded(isExp ? null : b.token_id)} className="flex items-center gap-2 font-semibold text-primary">
                            <span style={{ fontFamily: 'JetBrains Mono' }}>{b.bond_id}</span>
                          </button>
                        </td>
                        <td className="px-5 py-3.5 font-medium">{b.parties?.name ?? 'Sin dato'}</td>
                        <td className="px-5 py-3.5 text-on-surface-variant">{b.profiles?.full_name ?? 'Sin dato'}</td>
                        <td className="px-5 py-3.5 font-semibold">{fmtMoney(b.face_value, b.currency)}</td>
                        <td className="px-5 py-3.5 text-on-surface-variant">{b.series ?? 'Sin dato'} {b.certificate_number ? `· ${b.certificate_number}` : ''}</td>
                        <td className="px-5 py-3.5">{b.interest_rate != null ? `${b.interest_rate}%` : 'Sin dato'}</td>
                        <td className="px-5 py-3.5 text-on-surface-variant">{fmtDate(b.maturity_date)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${CHIP[b.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>{b.status}</span>
                            {hasSoroban && (
                              <Link href={`/tse/bono/${b.token_id}`} className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-200">
                                NFT <span className="font-mono font-semibold">{shortContract(b.soroban_contract_id)}</span>
                              </Link>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/tse/trazabilidad?bono=${b.bond_id}`} className="rounded-lg border border-outline-variant/40 px-2.5 py-1 text-xs font-medium text-on-surface-variant transition hover:border-primary hover:text-primary">
                              Trazabilidad
                            </Link>
                            {canIssueOnchain && (
                              <button onClick={() => issueOnchain(b.token_id)} disabled={busyOnchain === b.token_id} className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-blue-100 disabled:opacity-60">
                                {busyOnchain === b.token_id ? '...' : 'Emitir on-chain'}
                              </button>
                            )}
                            <a href={bondAssetUrl(b.bond_id)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg border border-outline-variant/40 px-2 py-1 text-xs text-on-surface-variant hover:text-primary">
                              Stellar
                            </a>
                          </div>
                        </td>
                      </tr>
                      {isExp && (
                        <tr className="bg-surface-container-low/30">
                          <td colSpan={9} className="px-5 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                              {[
                                ['ID unico', b.token_id],
                                ['Numero de certificado', b.certificate_number ?? 'Sin dato'],
                                ['Serie / Lote', b.series ?? 'Sin dato'],
                                ['Moneda', b.currency ?? 'CRC'],
                                ['Tasa de interes', b.interest_rate != null ? `${b.interest_rate}%` : 'Sin dato'],
                                ['Fecha de emision', fmtDate(b.issue_date)],
                                ['Fecha de vencimiento', fmtDate(b.maturity_date)],
                                ['Emitido el', fmtDate(b.created_at)],
                                ['Estado Stellar', b.stellar_status ?? 'Sin dato'],
                                ['Tx Stellar', b.stellar_transaction_hash ?? 'Este registro aun no tiene transacciones asociadas.'],
                              ].map(([lbl, val]) => (
                                <div key={lbl}>
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">{lbl}</p>
                                  <p className="mt-0.5 break-all font-mono text-xs font-medium">{val}</p>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TSEShell>
  );
}
