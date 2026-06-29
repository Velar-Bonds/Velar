'use client';
/**
 * Vista PÚBLICA de trazabilidad de un bono — sin login, compartible.
 * Cualquier ciudadano pega el ID y verifica el historial on-chain en Stellar.
 * Es la prueba viva del principio de VELAR: "la trazabilidad debe verse antes
 * de explicarse".
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, ExternalLink, FileCheck2, Boxes, ArrowLeft, CircleCheck, Lock,
  Send, Handshake, Banknote, Flag, Snowflake, FileUp, Circle,
} from 'lucide-react';
import { getCountryProfile, formatMoney } from '@velar/types';
import { publicApiFetch } from '../../lib/api';
import { stellarExpert, bondExplorerUrl, shortKey } from '../../lib/stellar';

type Ev = { id: string; type: string; txHash?: string | null; createdAt: string; payload?: any };
type Owner = { name: string; since: string; until: string | null; paid: boolean; current: boolean };
type Trace = {
  bond: any;
  events: Ev[];
  owners: Owner[];
};

const EVENT_META: Record<string, { label: string; Icon: any }> = {
  bond_emitido: { label: 'Bono emitido on-chain', Icon: Send },
  bond_asignado: { label: 'Asignado al partido', Icon: Flag },
  bond_published: { label: 'Publicado en el mercado', Icon: Boxes },
  transfer_solicitada: { label: 'Oferta de compra', Icon: Handshake },
  transfer_aceptada: { label: 'Oferta aceptada', Icon: CircleCheck },
  escrow_bloqueado: { label: 'Token bloqueado en escrow', Icon: Lock },
  pago_registrado: { label: 'Pago registrado', Icon: Banknote },
  pago_validado: { label: 'Pago validado', Icon: CircleCheck },
  token_liberado: { label: 'Token liberado al comprador', Icon: CircleCheck },
  transfer_rechazada: { label: 'Oferta rechazada', Icon: Circle },
  transfer_cancelada: { label: 'Transferencia cancelada', Icon: Circle },
  bond_congelado: { label: 'Bono congelado', Icon: Snowflake },
  bond_descongelado: { label: 'Bono descongelado', Icon: CircleCheck },
  bond_cancelado: { label: 'Bono cancelado', Icon: Circle },
  documento_subido: { label: 'Certificado subido · hash on-chain', Icon: FileUp },
  counter_offer_sent: { label: 'Contraoferta enviada', Icon: Handshake },
};

const metaFor = (type: string) =>
  EVENT_META[type] ?? { label: type.replace(/_/g, ' '), Icon: Circle };

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export function TraceabilityView({ idOrToken }: { idOrToken: string }) {
  const [data, setData] = useState<Trace | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    publicApiFetch('GET', `/public/bonds/${encodeURIComponent(idOrToken)}/traceability`)
      .then((res) => { if (active) setData(res as Trace); })
      .catch((e) => { if (active) setError(e.message ?? 'No se encontró el bono'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [idOrToken]);

  const bond = data?.bond;
  const profile = getCountryProfile(bond?.country);

  return (
    <div className="min-h-screen bg-[#fafcff] text-on-surface" style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className="border-b border-outline-variant/20 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[920px] items-center justify-between px-5">
          <Link href="/verificar" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-white"><Boxes size={18} /></span>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Geist' }}>VELAR</span>
          </Link>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <ShieldCheck size={13} /> Verificación pública
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[920px] px-5 py-8">
        <Link href="/verificar" className="mb-6 inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary-container">
          <ArrowLeft size={15} /> Verificar otro bono
        </Link>

        {loading && (
          <div className="flex items-center gap-3 py-16 text-on-surface-variant">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-container border-t-transparent" /> Consultando la cadena…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
            No se encontró ningún bono con el identificador <span className="font-mono font-semibold">{idOrToken}</span>. Verificá el ID e intentá de nuevo.
          </div>
        )}

        {!loading && bond && (
          <>
            <div className="glass-card rounded-2xl border border-outline-variant/30 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-sm font-semibold text-primary-container">{bond.bondId}</div>
                  <h1 className="mt-1 text-2xl font-bold" style={{ fontFamily: 'Geist' }}>
                    {data!.owners?.[0]?.name ?? 'Bono político'}
                  </h1>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {profile.flag} {profile.name} · {profile.authority.code} · {profile.instrument.label}
                  </p>
                </div>
                <span className="rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1 text-xs font-semibold capitalize text-on-surface">
                  {String(bond.status).replace(/_/g, ' ')}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Valor nominal" value={formatMoney(bond.faceValue, bond.country)} />
                <Stat label="Certificado" value={bond.certificateNumber ?? '—'} />
                <Stat label="Estado Stellar" value={bond.stellarStatus ?? 'pending'} />
                <Stat label="Emitido" value={fmtDate(bond.createdAt ?? data!.events?.[0]?.createdAt)} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <a href={bondExplorerUrl(bond.sorobanContractId, bond.bondId)} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-medium transition hover:border-primary-container/50">
                  <ExternalLink size={14} /> Ver activo en Stellar
                </a>
                {bond.documentHash && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3 py-2 text-xs text-on-surface-variant">
                    <FileCheck2 size={14} /> Hash certificado: <span className="font-mono">{shortKey(bond.documentHash, 6)}</span>
                  </span>
                )}
              </div>
            </div>

            {data!.owners?.length > 0 && (
              <section className="mt-7">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Cadena de propiedad</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {data!.owners.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`rounded-xl border px-3 py-2 text-sm ${o.current ? 'border-primary-container/40 bg-primary-container/5 font-semibold' : 'border-outline-variant/30 bg-white'}`}>
                        {o.name}
                        {o.current && <span className="ml-2 text-xs font-semibold text-primary-container">actual</span>}
                      </div>
                      {i < data!.owners.length - 1 && <span className="text-outline">→</span>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-7">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                Historial on-chain · {data!.events.length} eventos
              </h2>
              <ol className="relative ml-3 border-l-2 border-outline-variant/25">
                {data!.events.map((ev) => {
                  const { label, Icon } = metaFor(ev.type);
                  return (
                    <li key={ev.id} className="relative mb-6 pl-6">
                      <span className="absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/30 bg-white text-primary-container">
                        <Icon size={13} />
                      </span>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-on-surface">{label}</div>
                          <div className="text-xs text-on-surface-variant">{fmtDate(ev.createdAt)}</div>
                        </div>
                        {ev.txHash ? (
                          <a href={stellarExpert.tx(ev.txHash)} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100">
                            <ExternalLink size={12} /> tx {shortKey(ev.txHash, 5)}
                          </a>
                        ) : (
                          <span className="rounded-lg bg-surface-container-low px-2.5 py-1 text-xs text-on-surface-variant">registro</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <p className="mt-8 flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low/40 px-4 py-3 text-xs text-on-surface-variant">
              <ShieldCheck size={15} className="shrink-0 text-emerald-600" />
              Cada evento con <span className="font-medium text-on-surface">tx</span> es una transacción inmutable en la blockchain de Stellar, verificable por cualquier persona en stellar.expert. VELAR no puede alterar este historial.
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">{label}</div>
      <div className="mt-0.5 truncate text-sm font-semibold text-on-surface" title={value}>{value}</div>
    </div>
  );
}
