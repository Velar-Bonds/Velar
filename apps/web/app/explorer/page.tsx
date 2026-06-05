'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, ShieldCheck, Coins, Server, Lock, Activity, Eye, BookOpen, Boxes,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

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
  recent_bonds: Array<{
    bond_id: string;
    party?: string;
    face_value: number;
    currency: string;
    status: string;
    asset_url: string;
    soroban_contract_url: string | null;
    soroban_contract_id: string | null;
  }>;
  soroban_nfts: Array<{ bond_id: string; contract_id: string; url: string }>;
  trustless_work_contracts: Array<{ transfer_id: string; bond_id?: string; status: string; contract_id: string; url: string }>;
  memo_glossary: Array<{ prefix: string; meaning: string }>;
};

const fmtCRC = (n: number) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n || 0);
const fmtNum = (n: number) => new Intl.NumberFormat('es-CR').format(n || 0);
const shortKey = (k: string, n = 8) => k.length > 2 * n + 3 ? `${k.slice(0, n)}…${k.slice(-n)}` : k;

export default function ExplorerPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/explorer/snapshot`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

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

      {/* ─── Header minimal ─────────────────────────────────────────────── */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900">
            <ArrowLeft size={15} /> Volver al inicio
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary-container to-primary text-white">
              <Boxes size={14} strokeWidth={2.3} />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>
              VELAR
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-500">EXPLORER</span>
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-6 py-12 pb-24">

        {/* Hero */}
        <section className="mb-12 text-center">
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

        {/* Stats */}
        <section className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ['Bonos emitidos', fmtNum(data.stats.total_bonds)],
            ['Valor total emitido', fmtCRC(data.stats.total_emitted_crc)],
            ['Ventas completadas', fmtNum(data.stats.total_sales)],
            ['Volumen movido', fmtCRC(data.stats.total_volume_crc)],
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
        {data.soroban_nfts.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>
              🪙 Soroban NFTs <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[12px] font-semibold text-purple-700">{data.soroban_nfts.length}</span>
            </h2>
            <p className="mb-6 text-sm text-slate-500">Cada bono nuevo es un contrato Soroban con toda su metadata on-chain.</p>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {data.soroban_nfts.map((n) => (
                <a key={n.contract_id} href={n.url} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3 transition hover:bg-purple-50">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold text-purple-900" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{n.bond_id}</p>
                    <p className="truncate font-mono text-[11px] text-purple-700">{shortKey(n.contract_id, 6)}</p>
                  </div>
                  <ExternalLink size={14} className="shrink-0 text-purple-600 transition group-hover:scale-110" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Trustless Work contracts */}
        {data.trustless_work_contracts.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>
              <ShieldCheck size={18} className="text-emerald-700" />
              Contratos Trustless Work <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[12px] font-semibold text-emerald-700">{data.trustless_work_contracts.length}</span>
            </h2>
            <p className="mb-6 text-sm text-slate-500">Cada venta crea un contrato Soroban Single-Release como registro inmutable del trade.</p>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {data.trustless_work_contracts.map((c) => (
                <a key={c.contract_id} href={c.url} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center justify-between border-b border-slate-100 px-5 py-3 transition last:border-0 hover:bg-emerald-50/40">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-emerald-700" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{c.bond_id ?? 'Bono'}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{c.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-500">{shortKey(c.contract_id, 6)}</span>
                    <ExternalLink size={13} className="text-emerald-600 transition group-hover:scale-110" />
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Bonos recientes */}
        {data.recent_bonds.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>
              <Activity size={18} className="text-primary" />
              Últimos bonos emitidos
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
              {data.recent_bonds.map((b) => (
                <div key={b.bond_id} className="grid grid-cols-1 items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-0 md:grid-cols-[140px_1fr_120px_120px_240px]">
                  <span className="font-mono text-sm font-bold text-primary" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{b.bond_id}</span>
                  <span className="text-sm text-slate-700">{b.party ?? '—'}</span>
                  <span className="text-sm font-semibold text-slate-900">{fmtCRC(b.face_value)}</span>
                  <span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{b.status}</span></span>
                  <div className="flex items-center justify-end gap-2">
                    <a href={b.asset_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-700 transition hover:border-primary hover:text-primary">
                      Asset <ExternalLink size={10} />
                    </a>
                    {b.soroban_contract_url && (
                      <a href={b.soroban_contract_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700 transition hover:bg-purple-100">
                        🪙 NFT <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
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
