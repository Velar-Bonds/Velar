'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, ShieldCheck, Coins, Server, Lock, Activity, Eye, BookOpen, Boxes,
  Search, X,
} from 'lucide-react';
import { publicApiFetch } from '../../lib/api';
import { useCountry } from '../../lib/country';
import { PaginationControls } from '../../components/PaginationControls';
import { StatusBadge } from '../../components/status-ui';
import type { PaginatedResponse } from '@velar/types';

type BondSummary = {
  bond_id: string;
  party?: string | null;
  face_value: number;
  currency: string;
  status: string;
  asset_url: string;
  soroban_contract_url: string | null;
  soroban_contract_id: string | null;
};

type Snapshot = {
  network: string;
  platform_account: { address: string; explorer_url: string };
  escrow_account: { address: string; explorer_url: string };
  assets: {
    vcrc: { symbol: string; issuer: string; purpose: string; explorer_url: string };
  };
  stats: {
    total_bonds: number;
    total_emitted_crc: number;
    total_sales: number;
    total_volume_crc: number;
    sorobanContracts: number;
    trustlessWorkContracts: number;
  };
  recent_bonds: PaginatedResponse<BondSummary>;
  soroban_nfts: PaginatedResponse<{ bond_id: string; contract_id: string; url: string }>;
  trustless_work_contracts: PaginatedResponse<{ transfer_id: string; bond_id?: string; status: string; contract_id: string; url: string }>;
  memo_glossary: Array<{ prefix: string; meaning: string }>;
};

type SearchResponse = { query: string; count: number; results: BondSummary[] };

const fmtNum = (n: number) => new Intl.NumberFormat('es-CR').format(n || 0);
const shortKey = (k: string, n = 8) => k.length > 2 * n + 3 ? `${k.slice(0, n)}…${k.slice(-n)}` : k;
const PAGE_LIMIT = 20;

export default function ExplorerPage() {
  const { money } = useCountry();
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    setError('');
    publicApiFetch('GET', `/explorer/snapshot?page=${page}&limit=${PAGE_LIMIT}`)
      .then((res) => setData(res as Snapshot))
      .catch((e: Error) => setError(e.message));
  }, [page]);

  async function runSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError('');
    try {
      const res = await publicApiFetch('GET', `/explorer/search?q=${encodeURIComponent(q)}`);
      setSearchResult(res as SearchResponse);
    } catch (e: any) {
      setSearchError(e.message ?? 'No se pudo buscar');
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setQuery('');
    setSearchResult(null);
    setSearchError('');
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-600">
          No se pudo cargar el snapshot: {error}
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-200/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-5">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900">
              <ArrowLeft size={15} /> Volver al inicio
            </Link>
            <span className="hidden h-5 w-px bg-slate-200 sm:block" />
            <Link href="/" className="hidden items-center gap-2 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary-container to-primary text-white">
                <Boxes size={14} strokeWidth={2.3} />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>
                VELAR
                <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-500">EXPLORER</span>
              </span>
            </Link>
          </div>
          <Link
            href="/login"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white transition hover:bg-primary-container hover:shadow-lg hover:shadow-primary/25"
          >
            Acceder a la plataforma
            <ExternalLink size={13} />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-6 py-12 pb-24">

        {/* Hero */}
        <section className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Red Stellar · {data.network}
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 md:text-5xl"
              style={{ fontFamily: 'Geist, sans-serif' }}>
            Ledger público de VELAR
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-600">
            Todos los componentes blockchain del sistema en un solo lugar.
            Cada enlace abre directamente la fuente de verdad en Stellar Expert.
            No necesitás cuenta ni confiar en VELAR para verificar.
          </p>
        </section>

        {/* Búsqueda */}
        <section className="mb-12">
          <form onSubmit={runSearch} className="mx-auto flex max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por ID de bono, partido o wallet Stellar…"
                className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-9 text-sm text-slate-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-[13px] font-semibold text-white transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
            >
              {searching ? 'Buscando…' : 'Buscar'}
            </button>
          </form>

          {searchError && (
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-red-600">{searchError}</p>
          )}

          {searchResult && (
            <div className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                <p className="text-[13px] font-semibold text-slate-700">
                  {searchResult.count === 0
                    ? `Sin resultados para "${searchResult.query}"`
                    : `${searchResult.count} resultado${searchResult.count === 1 ? '' : 's'} para "${searchResult.query}"`}
                </p>
                <button onClick={clearSearch} className="text-[12px] font-medium text-slate-500 transition hover:text-slate-800">
                  Limpiar
                </button>
              </div>
              {searchResult.results.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                  <Eye size={22} className="text-slate-300" />
                  <p className="text-sm text-slate-500">No encontramos ningún bono, partido o wallet que coincida.</p>
                </div>
              ) : (
                searchResult.results.map((b) => (
                  <Link
                    key={b.bond_id}
                    href={`/explorer/${encodeURIComponent(b.bond_id)}`}
                    className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 transition last:border-0 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-primary" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{b.bond_id}</p>
                      <p className="truncate text-[12.5px] text-slate-500">{b.party ?? 'Sin partido'} · {money(b.face_value)}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </Link>
                ))
              )}
            </div>
          )}
        </section>

        {/* Stats */}
        <section className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ['Bonos emitidos', fmtNum(data.stats.total_bonds)],
            ['Valor total emitido', money(data.stats.total_emitted_crc)],
            ['Ventas completadas', fmtNum(data.stats.total_sales)],
            ['Volumen movido', money(data.stats.total_volume_crc)],
          ].map(([l, v]) => (
            <div key={l} className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{l}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>{v}</p>
            </div>
          ))}
        </section>

        {/* Componentes on-chain */}
        <section className="mb-12">
          <h2 className="mb-1 text-xl font-semibold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>
            Infraestructura on-chain
          </h2>
          <p className="mb-6 text-sm text-slate-500">Los activos y cuentas Stellar que sostienen la plataforma.</p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Asset VCRC */}
            <a
              href={data.assets.vcrc.explorer_url}
              target="_blank" rel="noopener noreferrer"
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-primary-container hover:shadow-lg"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Coins size={16} strokeWidth={2.3} />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Asset</p>
              </div>
              <p className="font-mono text-lg font-bold text-emerald-700" style={{ fontFamily: 'JetBrains Mono, monospace' }}>VCRC</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{data.assets.vcrc.purpose}</p>
              <p className="mt-3 font-mono text-[11px] text-slate-400">{shortKey(data.assets.vcrc.issuer, 8)}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-primary group-hover:underline">
                Ver volumen total <ExternalLink size={11} />
              </span>
            </a>

            {/* Plataforma issuer */}
            <a
              href={data.platform_account.explorer_url}
              target="_blank" rel="noopener noreferrer"
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-primary-container hover:shadow-lg"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Server size={16} strokeWidth={2.3} />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cuenta plataforma</p>
              </div>
              <p className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>Issuer VELAR</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600">Cuenta que emite todos los bonos y el VCRC. Toda la actividad de la plataforma pasa por aquí.</p>
              <p className="mt-3 font-mono text-[11px] text-slate-400">{shortKey(data.platform_account.address, 8)}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-primary group-hover:underline">
                Ver actividad histórica <ExternalLink size={11} />
              </span>
            </a>

            {/* Escrow */}
            <a
              href={data.escrow_account.explorer_url}
              target="_blank" rel="noopener noreferrer"
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-primary-container hover:shadow-lg"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Lock size={16} strokeWidth={2.3} />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Canasta escrow</p>
              </div>
              <p className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>Custodia activa</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600">Cuenta donde se bloquean los tokens durante una venta hasta que el TSE/validador apruebe.</p>
              <p className="mt-3 font-mono text-[11px] text-slate-400">{shortKey(data.escrow_account.address, 8)}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-primary group-hover:underline">
                Ver bonos en custodia <ExternalLink size={11} />
              </span>
            </a>
          </div>
        </section>

        {/* Soroban NFTs */}
        {data.soroban_nfts.data.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>
              Soroban NFTs <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[12px] font-semibold text-purple-700">{data.soroban_nfts.total}</span>
            </h2>
            <p className="mb-6 text-sm text-slate-500">Cada bono nuevo es un contrato Soroban con toda su metadata on-chain.</p>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {data.soroban_nfts.data.map((n) => (
                <Link key={n.contract_id} href={`/explorer/${encodeURIComponent(n.bond_id)}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 transition hover:bg-purple-50">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold text-purple-900" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{n.bond_id}</p>
                    <p className="truncate font-mono text-[11px] text-purple-700">{shortKey(n.contract_id, 6)}</p>
                  </div>
                  <ExternalLink size={14} className="shrink-0 text-purple-600 transition group-hover:scale-110" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Trustless Work contracts */}
        {data.trustless_work_contracts.data.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>
              <ShieldCheck size={18} className="text-emerald-700" />
              Contratos Trustless Work <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[12px] font-semibold text-emerald-700">{data.trustless_work_contracts.total}</span>
            </h2>
            <p className="mb-6 text-sm text-slate-500">Cada venta crea un contrato Soroban Single-Release como registro inmutable del trade.</p>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {data.trustless_work_contracts.data.map((c) => (
                <div key={c.contract_id}
                  className="group flex items-center justify-between border-b border-slate-100 px-5 py-3 transition last:border-0 hover:bg-emerald-50/40">
                  <div className="flex items-center gap-3">
                    {c.bond_id ? (
                      <Link href={`/explorer/${encodeURIComponent(c.bond_id)}`} className="font-mono text-sm font-bold text-emerald-700 hover:underline" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {c.bond_id}
                      </Link>
                    ) : (
                      <span className="font-mono text-sm font-bold text-emerald-700" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Bono</span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{c.status}</span>
                  </div>
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-500">{shortKey(c.contract_id, 6)}</span>
                    <ExternalLink size={13} className="text-emerald-600 transition group-hover:scale-110" />
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bonos recientes */}
        {data.recent_bonds.data.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>
              <Activity size={18} className="text-primary" />
              Bonos emitidos
            </h2>
            <p className="mb-6 text-sm text-slate-500">Cada uno con su asset Stellar (clásico) y opcionalmente su contrato Soroban (NFT con metadata).</p>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="hidden grid-cols-[140px_1fr_120px_120px_240px] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
                <span>Bono</span>
                <span>Partido</span>
                <span>Monto</span>
                <span>Estado</span>
                <span className="text-right">On-chain</span>
              </div>
              {data.recent_bonds.data.map((b) => (
                <div key={b.bond_id} className="grid grid-cols-1 items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-0 md:grid-cols-[140px_1fr_120px_120px_240px]">
                  <Link href={`/explorer/${encodeURIComponent(b.bond_id)}`} className="font-mono text-sm font-bold text-primary hover:underline" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {b.bond_id}
                  </Link>
                  <span className="text-sm text-slate-700">{b.party ?? '—'}</span>
                  <span className="text-sm font-semibold text-slate-900">{money(b.face_value)}</span>
                  <span><StatusBadge status={b.status} /></span>
                  <div className="flex items-center justify-end gap-2">
                    <a href={b.asset_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-700 transition hover:border-primary hover:text-primary">
                      Asset <ExternalLink size={10} />
                    </a>
                    {b.soroban_contract_url && (
                      <a href={b.soroban_contract_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700 transition hover:bg-purple-100">
                        NFT <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
              <PaginationControls
                page={data.recent_bonds.page}
                limit={data.recent_bonds.limit}
                total={data.recent_bonds.total}
                onPageChange={setPage}
              />
            </div>
          </section>
        )}

        {/* Glosario de memos */}
        <section className="mb-6">
          <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>
            <BookOpen size={18} className="text-slate-500" />
            Glosario de memos
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            Cada transacción on-chain de VELAR lleva un memo legible. Así podés leer cualquier tx en stellar.expert sin contexto.
          </p>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {data.memo_glossary.map((m) => (
              <div key={m.prefix} className="grid grid-cols-1 items-center gap-3 border-b border-slate-100 px-5 py-3.5 last:border-0 md:grid-cols-[180px_1fr]">
                <code className="rounded bg-slate-100 px-2 py-1 font-mono text-[12.5px] font-semibold text-slate-900 md:justify-self-start" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{m.prefix}</code>
                <span className="text-[14px] text-slate-700">{m.meaning}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer del explorer */}
        <p className="mt-8 text-center text-[12px] text-slate-400">
          Este explorador no requiere cuenta. Toda la información viene directamente de la red Stellar testnet.
        </p>
      </div>
    </main>
  );
}
