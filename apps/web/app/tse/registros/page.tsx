'use client';
import { notify } from '../../../components/Toast';
import { useEffect, useState, Fragment } from 'react';
import { Filter, Search, ExternalLink, ChevronDown, ChevronUp, FileCheck, Link2 } from 'lucide-react';
import Link from 'next/link';
import { TSEShell } from '../../../components/TSEShell';
import { PaginationControls } from '../../../components/PaginationControls';
import { useSession, apiFetch } from '../../../lib/api';
import { paginatedQuery, paginationMeta, unwrapPaginated } from '../../../lib/pagination';
import { bondExplorerUrl, contractUrl } from '../../../lib/stellar';

type Bond = {
  token_id: string; bond_id: string; status: string; face_value: number | null; currency?: string;
  certificate_number?: string; series?: string; interest_rate?: number | null;
  issue_date?: string; maturity_date?: string; created_at?: string;
  soroban_contract_id?: string | null; soroban_init_tx_hash?: string | null;
  parties?: { name?: string; code?: string };
  profiles?: { full_name?: string };
  issuer_party_id?: string;
};

const CHIP: Record<string, string> = {
  activo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  en_venta: 'bg-purple-50 text-purple-700 border-purple-200',
  en_escrow: 'bg-amber-50 text-amber-700 border-amber-200',
  vendido: 'bg-gray-100 text-gray-500 border-gray-200',
  emitido: 'bg-blue-50 text-primary border-blue-200',
  congelado: 'bg-red-50 text-red-600 border-red-200',
};

const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = (n: number | null, cur = 'CRC') =>
  n == null ? '—' : new Intl.NumberFormat('es-CR', { style: 'currency', currency: cur || 'CRC', maximumFractionDigits: 0 }).format(n);
const shortContract = (id?: string | null) => id ? `${id.slice(0, 2)}…${id.slice(-4)}` : '';

export default function RegistrosPage() {
  const { token, me, loading, error } = useSession();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [partyOptions, setPartyOptions] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyOnchain, setBusyOnchain] = useState<string | null>(null);
  
  const [filterStatus, setFilterStatus] = useState('');
  const [filterParty, setFilterParty] = useState('');
  const [filterMontoMin, setFilterMontoMin] = useState('');
  const [filterMontoMax, setFilterMontoMax] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const load = (tok: string, p = page) =>
    apiFetch(tok, 'GET', `/bonds?${paginatedQuery(p, limit)}`)
      .then((res) => {
        setBonds(unwrapPaginated(res));
        setTotal(paginationMeta(res).total);
      })
      .catch(() => { setBonds([]); setTotal(0); });

  useEffect(() => { if (token) load(token, page); }, [token, page]); // eslint-disable-line
  useEffect(() => {
    if (!token) return;
    apiFetch(token, 'GET', '/parties')
      .then((rows) => setPartyOptions((Array.isArray(rows) ? rows : []).map((p: { name?: string }) => p.name).filter(Boolean)))
      .catch(() => {});
  }, [token]);

  async function issueOnchain(tokenId: string) {
    if (!token) return;
    setBusyOnchain(tokenId); 
    try {
      const res = await apiFetch(token, 'PATCH', `/bonds/${tokenId}/issue-onchain`);
      notify.tx(res?.txHash, 'Token emitido on-chain.');
      load(token, page);
    } catch (e: any) { notify.err(e.message); } finally { setBusyOnchain(null); }
  }

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const parties = partyOptions;

  const filtered = bonds
    .filter((b) => {
      if (filterStatus && b.status !== filterStatus) return false;
      if (filterParty && b.parties?.name !== filterParty) return false;
      if (filterMontoMin && Number(b.face_value) < Number(filterMontoMin)) return false;
      if (filterMontoMax && Number(b.face_value) > Number(filterMontoMax)) return false;
      if (filterDateFrom && b.created_at && b.created_at < filterDateFrom) return false;
      if (filterDateTo && b.created_at && b.created_at > filterDateTo + 'T23:59:59') return false;
      if (search) {
        const q = search.toLowerCase();
        if (!b.bond_id.toLowerCase().includes(q) && !b.parties?.name?.toLowerCase().includes(q) && !b.certificate_number?.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const va = sortBy === 'date' ? (a.created_at ?? '') : (Number(a.face_value) || 0);
      const vb = sortBy === 'date' ? (b.created_at ?? '') : (Number(b.face_value) || 0);
      return sortAsc ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
    });

  const SortBtn = ({ col, label }: { col: 'date' | 'amount'; label: string }) => (
    <button onClick={() => { if (sortBy === col) setSortAsc(!sortAsc); else { setSortBy(col); setSortAsc(false); } }}
      className={`flex items-center gap-1 ${sortBy === col ? 'text-primary' : ''}`}>
      {label}{sortBy === col ? (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null}
    </button>
  );

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Registros de bonos</h1>
          <p className="text-sm text-on-surface-variant">{filtered.length} en esta página · {total} bonos en total</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1300px] p-8 pb-20">
        {/* Filtros */}
        <div className="mb-6 rounded-2xl border border-outline-variant/30 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
            <Filter size={15} /> Filtros
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-7">
            <div className="relative lg:col-span-2">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar bono, partido…" className="field-input pl-8 text-xs" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="field-input bg-white text-xs">
              <option value="">Todos los estados</option>
              {['activo', 'en_venta', 'en_escrow', 'vendido', 'emitido', 'congelado'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterParty} onChange={(e) => setFilterParty(e.target.value)} className="field-input bg-white text-xs">
              <option value="">Todos los partidos</option>
              {parties.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="number" value={filterMontoMin} onChange={(e) => setFilterMontoMin(e.target.value)} placeholder="Monto mín." className="field-input text-xs" />
            <input type="number" value={filterMontoMax} onChange={(e) => setFilterMontoMax(e.target.value)} placeholder="Monto máx." className="field-input text-xs" />
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="field-input text-xs" />
          </div>
        </div>


        <div className="glass-card rounded-2xl">
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-variant/30 bg-surface-container-low/50 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 w-[160px]">ID del bono</th>
                <th className="px-4 py-3">Partido</th>
                <th className="px-4 py-3">Dueño actual</th>
                <th className="px-4 py-3 text-right"><SortBtn col="amount" label="Monto" /></th>
                <th className="px-4 py-3 text-center"><SortBtn col="date" label="Vencimiento" /></th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center w-[130px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/20">
              {filtered.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-on-surface-variant">Sin bonos con estos filtros.</td></tr>}
              {filtered.map((b) => {
                const isExp = expanded === b.token_id;
                const hasSoroban = Boolean(b.soroban_contract_id);
                return (
                  <Fragment key={b.token_id}>
                    <tr className="bg-white/60 transition-colors hover:bg-primary/[0.02]">
                      <td className="px-4 py-3">
                        <button onClick={() => setExpanded(isExp ? null : b.token_id)} className="flex items-center gap-1.5 font-semibold text-primary">
                          {isExp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          <span className="font-mono text-xs">{b.bond_id}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-sm">{b.parties?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">{b.profiles?.full_name ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmtMoney(b.face_value, b.currency)}</td>
                      <td className="px-4 py-3 text-center text-sm text-on-surface-variant">{fmtDate(b.maturity_date)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${CHIP[b.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>{b.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Trazabilidad */}
                          <Link href={`/tse/trazabilidad?bono=${b.bond_id}`}
                            title="Trazabilidad"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-outline-variant/40 text-on-surface-variant transition hover:border-primary hover:text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                          </Link>
                          {/* Stellar Expert */}
                          <a href={bondExplorerUrl(b.soroban_contract_id, b.bond_id)} target="_blank" rel="noopener noreferrer"
                            title="Ver en Stellar Expert"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-outline-variant/40 text-on-surface-variant transition hover:border-primary hover:text-primary">
                            <ExternalLink size={12} />
                          </a>
                          {/* NFT Soroban */}
                          {hasSoroban && (
                            <Link href={`/tse/bono/${b.token_id}`}
                              title="Ver certificado NFT on-chain"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-300 bg-violet-50 text-violet-700 transition hover:bg-violet-100">
                              <FileCheck size={13} />
                            </Link>
                          )}
                          {/* Emitir on-chain */}
                          <button onClick={() => issueOnchain(b.token_id)} disabled={busyOnchain === b.token_id}
                            title="Emitir token en Stellar"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-primary transition hover:bg-blue-100 disabled:opacity-50">
                            {busyOnchain === b.token_id
                              ? <span className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
                              : <Link2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExp && (
                      <tr key={`${b.token_id}-exp`} className="bg-surface-container-low/30">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                            {[
                              ['ID único', b.token_id],
                              ['Número de certificado', b.certificate_number ?? '—'],
                              ['Serie / Lote', b.series ?? '—'],
                              ['Moneda', b.currency ?? 'CRC'],
                              ['Tasa de interés', b.interest_rate != null ? `${b.interest_rate}%` : '—'],
                              ['Fecha de emisión', fmtDate(b.issue_date)],
                              ['Fecha de vencimiento', fmtDate(b.maturity_date)],
                              ['Emitido el', fmtDate(b.created_at)],
                            ].map(([lbl, val]) => (
                              <div key={lbl}>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">{lbl}</p>
                                <p className="mt-0.5 break-all font-mono text-xs font-medium">{val}</p>
                              </div>
                            ))}
                          </div>
                          {hasSoroban && (
                            <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/80 p-4">
                              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                                Soroban NFT
                              </p>
                              <p className="break-all font-mono text-xs text-violet-950">{b.soroban_contract_id}</p>
                              {b.soroban_init_tx_hash === 'deployed-only' && (
                                <p className="mt-2 text-[11px] text-violet-800">
                                  Contrato desplegado. Metadata Soroban pendiente de inicializar.
                                </p>
                              )}
                              <a href={contractUrl(b.soroban_contract_id)} target="_blank" rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:text-violet-950">
                                Ver contrato en Stellar Expert <ExternalLink size={10} />
                              </a>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          </div>
          <PaginationControls page={page} limit={limit} total={total} onPageChange={setPage} />
        </div>
      </div>
    </TSEShell>
  );
}
