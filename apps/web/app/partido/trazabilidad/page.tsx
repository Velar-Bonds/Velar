'use client';
import { useEffect, useState } from 'react';
import { Waypoints, ArrowRight, ExternalLink, User, ShieldCheck } from 'lucide-react';
import { PartidoShell } from '../../../components/PartidoShell';
import { ProvenanceDialog } from '../../../components/provenance/ProvenanceDialog';
import { useSession, apiFetch } from '../../../lib/api';
import { unwrapPaginated } from '../../../lib/pagination';
import { bondExplorerUrl } from '../../../lib/stellar';

type Bond = { token_id: string; bond_id: string; status: string; face_value: number | null; soroban_contract_id?: string | null };

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmt = (n: number | null | undefined) => n == null ? '—' : '₡' + Number(n).toLocaleString('es-CR');

export default function PartidoTrazabilidadPage() {
  const { token, me, loading, error } = useSession();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [trace, setTrace] = useState<any>(null);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [loadingTrace, setLoadingTrace] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [provOpen, setProvOpen] = useState(false);

  // Sidebar bond list: separate /bonds call (unchanged)
  useEffect(() => {
    if (!token) return;
    apiFetch(token, 'GET', '/bonds?page=1&limit=100').then((bs) => {
      const b = unwrapPaginated<Bond>(bs);
      setBonds(b);
      if (b[0] && !sel) setSel(b[0].token_id);
    }).catch(() => []);
    /* eslint-disable-next-line */
  }, [token]);

  // Traceability fetch: single endpoint replaces old /transfers fetch + client-side derivation
  useEffect(() => {
    if (!sel || !token) return;
    setLoadingTrace(true);
    setTraceError(null);
    apiFetch(token, 'GET', `/audit/bonds/${sel}/traceability`)
      .then((data) => setTrace(data))
      .catch(() => {
        setTrace(null);
        setTraceError('No se pudo cargar la trazabilidad.');
      })
      .finally(() => setLoadingTrace(false));
  }, [sel, token]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const bond = bonds.find((b) => b.token_id === sel);
  const owners = trace?.owners ?? [];
  const currentOwner = owners.find((o: any) => o.current)?.name ?? '—';

  return (
    <PartidoShell me={me}>
      <header className="sticky top-0 z-40 flex h-20 items-center border-b border-outline-variant/30 bg-surface/70 px-10 shadow-sm backdrop-blur-xl">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Geist' }}>Trazabilidad</h1>
      </header>

      <div className="mx-auto w-full max-w-[1200px] p-10 pb-20">
        {bonds.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-outline-variant/40 py-20 text-center">
            <Waypoints size={36} className="text-outline" />
            <p className="font-semibold">Sin bonos para rastrear</p>
            <p className="text-sm text-on-surface-variant">Cuando tengas bonos aprobados, vas a poder ver su historial completo acá.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Lista de bonos */}
            <div className="lg:col-span-4">
              <div className="glass-card flex flex-col gap-1 rounded-2xl p-2">
                {bonds.map((b) => (
                  <button key={b.token_id} onClick={() => setSel(b.token_id)}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition ${sel === b.token_id ? 'bg-primary/10' : 'hover:bg-surface-container-low'}`}>
                    <div>
                      <p className="text-sm font-semibold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{b.bond_id}</p>
                      <p className="text-xs text-on-surface-variant">{fmt(b.face_value)}</p>
                    </div>
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] text-on-surface-variant">{b.status}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="lg:col-span-8">
              <div className="glass-card rounded-2xl p-6">
                {bond && (
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-on-surface-variant">Bono seleccionado</p>
                      <p className="text-xl font-bold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{bond.bond_id}</p>
                      <p className="text-sm text-on-surface-variant">Valor: {fmt(bond.face_value)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-on-surface-variant">Dueño actual</p>
                      <p className="flex items-center justify-end gap-1.5 text-sm font-semibold"><User size={14} /> {currentOwner}</p>
                    </div>
                  </div>
                )}

                {bond && (
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setProvOpen(true)}
                      className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
                      <ShieldCheck size={13} /> Procedencia verificada
                    </button>
                    <a href={bondExplorerUrl(bond.soroban_contract_id, bond.bond_id)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs font-medium text-primary transition hover:bg-blue-100">
                      <ExternalLink size={13} /> Ver transacciones en Stellar Expert
                    </a>
                  </div>
                )}

                {loadingTrace ? (
                  <div className="flex h-48 items-center justify-center">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : traceError ? (
                  <div className="flex h-48 items-center justify-center rounded-2xl border-2 border-dashed border-red-200 bg-red-50 px-6 text-center text-sm text-red-700">
                    {traceError}
                  </div>
                ) : owners.length === 0 ? (
                  <p className="py-8 text-center text-sm text-on-surface-variant">Este bono todavía no tiene transferencias registradas.</p>
                ) : (
                  <div className="relative space-y-5 before:absolute before:bottom-2 before:left-[18px] before:top-2 before:w-0.5 before:bg-outline-variant/40">
                    {owners.map((o: any, i: number) => {
                      const isCurrent = o.current;
                      const prevOwner = i > 0 ? owners[i - 1] : null;
                      return (
                        <div key={i} className="relative flex gap-4">
                          <span className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${isCurrent ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-primary'}`}>
                            <ArrowRight size={15} />
                          </span>
                          <div className="flex-1 rounded-xl border border-outline-variant/20 bg-white p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold">
                                {prevOwner?.name ?? o.name}
                                <span className="text-on-surface-variant mx-1">→</span>
                                <span className={isCurrent ? 'text-emerald-700' : ''}>{o.name}</span>
                                {isCurrent && <span className="ml-1.5 text-xs font-normal text-emerald-600">(actual)</span>}
                              </p>
                              <span className="text-xs text-on-surface-variant">{fmtDate(o.since)}</span>
                            </div>
                            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${o.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-primary'}`}>
                              {o.paid ? 'liberada' : 'pendiente'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {provOpen && sel && (
        <ProvenanceDialog subjectId={sel} mode="auth" token={token} onClose={() => setProvOpen(false)} />
      )}
    </PartidoShell>
  );
}
