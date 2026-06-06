'use client';
import { useEffect, useState } from 'react';
import { Shield, ExternalLink, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { TSEShell } from '../../../components/TSEShell';
import { useSession, apiFetch } from '../../../lib/api';

const fmtCRC = (n: number | null) => n == null ? 'Sin dato' : new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ':';

const STATUS_LBL: Record<string, [string, string, any]> = {
  solicitada: ['bg-blue-50 text-primary border-blue-200', 'Solicitada', Clock],
  aceptada: ['bg-amber-50 text-amber-700 border-amber-200', 'Aceptada', Clock],
  en_escrow: ['bg-amber-50 text-amber-700 border-amber-200', 'En escrow', Shield],
  pago_registrado: ['bg-blue-50 text-primary border-blue-200', 'Pago registrado', Clock],
  pago_validado: ['bg-emerald-50 text-emerald-700 border-emerald-200', 'Pago validado', CheckCircle],
  liberada: ['bg-emerald-50 text-emerald-700 border-emerald-200', 'Liberada', CheckCircle],
};

export default function EscrowsPage() {
  const { token, me, loading, error } = useSession();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [tab, setTab] = useState<'all' | 'with' | 'without'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    if (!token) return;
    apiFetch(token, 'GET', '/transfers').then(setTransfers).catch(() => {});
  }, [token]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  // Token bloqueado ahora mismo en la canasta de escrow
  const IN_ESCROW_STATUSES = ['en_escrow', 'pago_registrado', 'pago_validado'];
  const enCanasta = transfers.filter((t) => IN_ESCROW_STATUSES.includes(t.status));
  const liberadas = transfers.filter((t) => t.status === 'liberada');
  const canceladas = transfers.filter((t) => t.status === 'cancelada');
  const withEscrow = transfers.filter((t) => t.escrow_contract_id);

  const base =
    tab === 'with'    ? enCanasta :
    tab === 'without' ? canceladas.concat(liberadas) :
    transfers;
  const list = statusFilter ? base.filter((t) => t.status === statusFilter) : base;
  const statuses = Array.from(new Set(transfers.map((t) => t.status))).sort();

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 flex h-20 items-center border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Escrows on-chain</h1>
          <p className="text-sm text-on-surface-variant">
            <span className="font-semibold text-amber-700">{enCanasta.length}</span> token{enCanasta.length !== 1 ? 's' : ''} en canasta ahora
            · <span className="font-semibold text-emerald-700">{withEscrow.length}</span> con Trustless Work
            · <span className="text-on-surface-variant">{transfers.length}</span> totales
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1200px] p-8 pb-20">
        {/* Info card */}
        <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <h2 className="font-semibold text-emerald-900">Coordinación on-chain con Trustless Work</h2>
              <p className="mt-1 text-sm text-emerald-800/80">
                Cada venta crea un contrato Soroban Single-Release como registro inmutable del trade.
                El contrato no maneja dinero : VELAR sigue custodiando el token del bono y el VCRC del precio.
                Trustless Work deja huella pública del lifecycle: <strong>deploy  a  milestone completed  a  milestone approved</strong>.
              </p>
              <p className="mt-2 text-xs text-emerald-700">
                Cualquier persona puede verificar el estado del trade abriendo el link al contrato.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs + filtros */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex overflow-hidden rounded-xl border border-outline-variant/40 bg-white">
            {([
              ['all',     'Todas',          transfers.length],
              ['with',    'En canasta',     enCanasta.length],
              ['without', 'Cerradas',       liberadas.length + canceladas.length],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold transition ${
                  tab === key
                    ? 'bg-primary-container text-white'
                    : 'bg-white text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {label}
                <span className={`rounded-full px-1.5 text-[10px] ${tab === key ? 'bg-white/20' : 'bg-surface-container'}`}>{count}</span>
              </button>
            ))}
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="field-input w-auto bg-white text-xs">
            <option value="">Todos los estados</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Lista */}
        {list.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-outline-variant/30 p-12 text-center text-on-surface-variant">
            <Shield size={32} className="mx-auto mb-3 text-outline" />
            <p className="font-medium">
              {tab === 'with' && 'No hay tokens en canasta ahora mismo'}
              {tab === 'without' && 'Todavía no hay transferencias cerradas'}
              {tab === 'all' && 'No hay transferencias todavía'}
            </p>
            <p className="mt-1 text-sm">
              {tab === 'with' && 'Cuando alguien acepte una oferta el token queda bloqueado en escrow hasta que se libere.'}
              {tab === 'without' && 'Cuando una negociación se libere o cancele, aparecerá acá.'}
              {tab === 'all' && 'Cuando alguien acepte una oferta se creará un contrato escrow.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((t) => {
              const [cls, lbl, Icon] = STATUS_LBL[t.status] ?? ['bg-gray-100 text-gray-600 border-gray-200', t.status, Clock];
              return (
                <div key={t.id} className="glass-card rounded-2xl p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${t.escrow_contract_id ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                        <Shield size={20} />
                      </span>
                      <div>
                        <p className="font-mono text-sm font-bold text-primary">{t.bonds?.bond_id ?? 'Bono'}</p>
                        <p className="flex items-center gap-1.5 text-sm">
                          {t.from_profile?.full_name ?? '?'}
                          
                          {t.to_profile?.full_name ?? '?'}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">{fmtDate(t.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {t.amount && <span className="font-mono font-semibold">{fmtCRC(Number(t.amount))}</span>}
                      <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
                        <Icon size={11} /> {lbl}
                      </span>
                    </div>
                  </div>

                  {t.escrow_contract_id ? (
                    <div className="mt-4 border-t border-outline-variant/20 pt-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">Contract ID (Soroban)</p>
                          <p className="break-all font-mono text-[11px] text-on-surface">{t.escrow_contract_id}</p>
                        </div>
                        <a
                          href={`https://stellar.expert/explorer/testnet/contract/${t.escrow_contract_id}`}
                          target="_blank" rel="noopener noreferrer"
                          className="btn-action btn-success"
                        >
                           Ver contrato on-chain
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                      ⚠️ Esta transferencia no tiene canasta Trustless Work (puede haberse creado antes de la integración o falló la API).
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TSEShell>
  );
}
