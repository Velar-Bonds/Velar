'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, ShieldCheck, Boxes, FileText, Wallet, Users, ArrowRightLeft,
} from 'lucide-react';
import { publicApiFetch } from '../../../lib/api';
import { useCountry } from '../../../lib/country';
import { StatusBadge, fmtDate } from '../../../components/status-ui';

type BondDetail = {
  bond_id: string;
  status: string;
  face_value: number;
  currency: string;
  document_hash: string;
  created_at: string;
  updated_at: string;
  party: { name: string; code: string; wallet: string | null } | null;
  current_owner: { id: string; name: string | null; email: string; wallet: string | null } | null;
  asset_url: string;
  soroban_contract_id: string | null;
  soroban_contract_url: string | null;
  trustless_work_contracts: Array<{ transfer_id: string; status: string; contract_id: string; url: string }>;
  transfers: Array<{
    id: string;
    status: string;
    amount: number | null;
    from: { id: string; name: string | null } | null;
    to: { id: string; name: string | null } | null;
    escrow_contract_id: string | null;
    escrow_contract_url: string | null;
    created_at: string;
    updated_at: string;
  }>;
};

const shortKey = (k: string, n = 8) => (k && k.length > 2 * n + 3 ? `${k.slice(0, n)}…${k.slice(-n)}` : k);

export default function BondDetailPage() {
  const { money } = useCountry();
  const params = useParams<{ bondId: string }>();
  const bondId = decodeURIComponent(params.bondId ?? '');

  const [data, setData] = useState<BondDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bondId) return;
    setData(null);
    setError('');
    publicApiFetch('GET', `/explorer/bonds/${encodeURIComponent(bondId)}`)
      .then((res) => setData(res as BondDetail))
      .catch((e: Error) => setError(e.message));
  }, [bondId]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className="border-b border-slate-200/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-5">
            <Link href="/explorer" className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900">
              <ArrowLeft size={15} /> Volver al explorador
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

      <div className="mx-auto max-w-[900px] px-6 py-12 pb-24">
        {error && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Link href="/explorer" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline">
              <ArrowLeft size={13} /> Volver al explorador
            </Link>
          </div>
        )}

        {!error && !data && (
          <div className="flex justify-center py-24">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {data && (
          <>
            {/* Hero */}
            <section className="mb-10">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-mono text-2xl font-bold text-slate-900 md:text-3xl" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {data.bond_id}
                </h1>
                <StatusBadge status={data.status} />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>
                {money(data.face_value)} <span className="text-sm font-medium text-slate-400">{data.currency}</span>
              </p>
            </section>

            {/* Partido y dueño */}
            <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2 text-slate-500">
                  <Users size={15} />
                  <p className="text-[11px] font-semibold uppercase tracking-wide">Partido emisor</p>
                </div>
                {data.party ? (
                  <>
                    <p className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>{data.party.name}</p>
                    <p className="text-[13px] text-slate-500">Código: {data.party.code}</p>
                    {data.party.wallet && <p className="mt-2 font-mono text-[11px] text-slate-400">{shortKey(data.party.wallet)}</p>}
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Sin dato</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2 text-slate-500">
                  <Wallet size={15} />
                  <p className="text-[11px] font-semibold uppercase tracking-wide">Dueño actual</p>
                </div>
                {data.current_owner ? (
                  <>
                    <p className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>{data.current_owner.name ?? 'Sin nombre'}</p>
                    <p className="text-[13px] text-slate-500">{data.current_owner.email}</p>
                    {data.current_owner.wallet && <p className="mt-2 font-mono text-[11px] text-slate-400">{shortKey(data.current_owner.wallet)}</p>}
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Sin dueño asignado</p>
                )}
              </div>
            </section>

            {/* On-chain */}
            <section className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <FileText size={14} /> Verificación on-chain
              </h2>
              <div className="flex flex-wrap gap-2">
                <a href={data.asset_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-slate-700 transition hover:border-primary hover:text-primary">
                  Ver asset Stellar <ExternalLink size={11} />
                </a>
                {data.soroban_contract_url && (
                  <a href={data.soroban_contract_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-[12.5px] font-medium text-purple-700 transition hover:bg-purple-100">
                    Ver contrato Soroban (NFT) <ExternalLink size={11} />
                  </a>
                )}
              </div>
              <p className="mt-3 text-[11px] text-slate-400">Hash del documento: <span className="font-mono">{data.document_hash}</span></p>
            </section>

            {/* Trustless Work */}
            {data.trustless_work_contracts.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  <ShieldCheck size={14} className="text-emerald-700" /> Contratos Trustless Work
                </h2>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {data.trustless_work_contracts.map((c) => (
                    <a key={c.contract_id} href={c.url} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center justify-between border-b border-slate-100 px-5 py-3 transition last:border-0 hover:bg-emerald-50/40">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{c.status}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-500">{shortKey(c.contract_id, 6)}</span>
                        <ExternalLink size={13} className="text-emerald-600 transition group-hover:scale-110" />
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Historial de transferencias */}
            <section className="mb-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <ArrowRightLeft size={14} /> Historial de transferencias
              </h2>
              {data.transfers.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
                  Este bono todavía no tuvo transferencias.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="hidden grid-cols-[1fr_1fr_110px_130px_130px] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
                    <span>De</span>
                    <span>A</span>
                    <span>Monto</span>
                    <span>Estado</span>
                    <span className="text-right">Fecha</span>
                  </div>
                  {data.transfers.map((t) => (
                    <div key={t.id} className="grid grid-cols-1 items-center gap-2 border-b border-slate-100 px-5 py-3.5 last:border-0 md:grid-cols-[1fr_1fr_110px_130px_130px]">
                      <span className="text-sm text-slate-700">{t.from?.name ?? '—'}</span>
                      <span className="text-sm text-slate-700">{t.to?.name ?? '—'}</span>
                      <span className="text-sm font-semibold text-slate-900">{t.amount != null ? money(t.amount) : '—'}</span>
                      <span><StatusBadge status={t.status} /></span>
                      <div className="flex items-center justify-end gap-2 text-[12px] text-slate-500">
                        {fmtDate(t.created_at)}
                        {t.escrow_contract_url && (
                          <a href={t.escrow_contract_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700">
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <p className="text-center text-[12px] text-slate-400">
              Emitido el {fmtDate(data.created_at)} · Última actualización {fmtDate(data.updated_at)}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
