'use client';
import { notify } from '../../../components/Toast';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Eye, X, ExternalLink, User, Waypoints, Coins } from 'lucide-react';
import { TSEShell } from '../../../components/TSEShell';
import { useSession, apiFetch } from '../../../lib/api';
import { unwrapPaginated } from '../../../lib/pagination';
import { bondExplorerUrl, txUrl } from '../../../lib/stellar';
import { reviewReportRequestSchema, type FieldErrors } from '@velar/types';
import { validateSchemaForm } from '../../../lib/forms/schema-form';
import { SchemaFieldError, schemaFieldProps } from '../../../components/SchemaFieldError';
import { typedApi } from '../../../lib/typed-api';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtCRC = (n?: number | null) => n == null ? '—' : new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n);

const STATUS: Record<string, [string, string]> = {
  enviado: ['bg-blue-50 text-primary border-blue-200', 'Enviado'],
  revisado: ['bg-amber-50 text-amber-700 border-amber-200', 'Revisado'],
  observado: ['bg-red-50 text-red-600 border-red-200', 'Observado'],
  aprobado: ['bg-emerald-50 text-emerald-700 border-emerald-200', 'Aprobado'],
};

export default function TSEReportesPage() {
  const { token, me, loading, error } = useSession();
  const [reports, setReports] = useState<any[]>([]);
  const [allBonds, setAllBonds] = useState<any[]>([]);
  const [allTransfers, setAllTransfers] = useState<any[]>([]);
  const [sel, setSel] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  

  const load = () =>
    Promise.all([
      apiFetch(token, 'GET', '/reports').then(setReports).catch(() => {}),
      apiFetch(token, 'GET', '/bonds?page=1&limit=100').then((res) => setAllBonds(unwrapPaginated(res))).catch(() => {}),
      apiFetch(token, 'GET', '/transfers?page=1&limit=100').then((res) => setAllTransfers(unwrapPaginated(res))).catch(() => {}),
    ]);

  useEffect(() => { if (token) load(); /* eslint-disable-next-line */ }, [token]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  async function review(status: 'aprobado' | 'observado' | 'revisado') {
    if (!sel) return;
    const validation = validateSchemaForm(reviewReportRequestSchema, { status, notes: notes || undefined });
    if (!validation.success) { setFieldErrors(validation.errors); return; }
    setBusy(true);
    try {
      await typedApi.call('reports.review', { params: { id: sel.id }, body: validation.data }, token);
      setFieldErrors({});
      notify.ok(`Reporte marcado como ${status}.`);
      setSel(null); setNotes('');
      load();
    } catch (e: any) { notify.err(e.message); } finally { setBusy(false); }
  }

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Reportes de partidos</h1>
          <p className="text-sm text-on-surface-variant">{reports.length} reporte{reports.length !== 1 ? 's' : ''}</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1200px] p-8 pb-20">

        <div className="glass-card overflow-hidden rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-variant/30 bg-surface-container-low/50 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-5 py-3">Partido</th>
                <th className="px-5 py-3">Título</th>
                <th className="px-5 py-3">Monto reportado</th>
                <th className="px-5 py-3">Enviado</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/20">
              {reports.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-on-surface-variant">Sin reportes todavía.</td></tr>}
              {reports.map((r) => {
                const [cls, lbl] = STATUS[r.status] ?? ['bg-gray-100 text-gray-600 border-gray-200', r.status];
                return (
                  <tr key={r.id} className="bg-white/60 transition-colors hover:bg-primary/[0.02]">
                    <td className="px-5 py-3.5 font-medium">{r.parties?.name ?? '—'}</td>
                    <td className="px-5 py-3.5">{r.title}</td>
                    <td className="px-5 py-3.5 font-semibold">{fmtCRC(r.total_amount)}</td>
                    <td className="px-5 py-3.5 text-on-surface-variant">{fmtDate(r.created_at)}</td>
                    <td className="px-5 py-3.5"><span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>{lbl}</span></td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => { setSel(r); setNotes(r.tse_notes ?? ''); }} className="btn-ghost">
                        <Eye size={13} /> Revisar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de revisión */}
      {sel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setSel(null)}>
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Geist' }}>{sel.title}</h3>
                <p className="text-sm text-on-surface-variant">{sel.parties?.name} · enviado el {fmtDate(sel.created_at)}</p>
              </div>
              <button onClick={() => setSel(null)} className="text-on-surface-variant hover:text-on-surface"><X size={20} /></button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
              {sel.period_start && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Periodo</p>
                  <p>{fmtDate(sel.period_start)} → {fmtDate(sel.period_end)}</p>
                </div>
              )}
              {sel.total_amount != null && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Monto reportado</p>
                  <p className="font-semibold">{fmtCRC(sel.total_amount)}</p>
                </div>
              )}
            </div>

            <div className="mb-4">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Descripción</p>
              <p className="whitespace-pre-wrap rounded-xl border border-outline-variant/20 bg-surface-container-low/30 p-3 text-sm">{sel.description}</p>
            </div>

            {sel.bond_token_ids?.length > 0 && (() => {
              const selBonds = sel.bond_token_ids.map((tid: string) => allBonds.find((x: any) => x.token_id === tid)).filter(Boolean);
              const valorFacial = selBonds.reduce((s: number, b: any) => s + (Number(b.face_value) || 0), 0);
              const liberadas = allTransfers.filter((t: any) => sel.bond_token_ids.includes(t.bond_token_id) && t.status === 'liberada');
              const valorReventas = liberadas.reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
              const diff = valorReventas - valorFacial;
              const diffPct = valorFacial > 0 ? (diff / valorFacial) * 100 : 0;
              return <>
              <div className="mb-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/70">Valor facial total</p>
                  <p className="mt-1 text-lg font-bold text-primary">{fmtCRC(valorFacial)}</p>
                  <p className="text-[10px] text-primary/60">{selBonds.length} bono{selBonds.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/70">Valor de reventas</p>
                  <p className="mt-1 text-lg font-bold text-emerald-700">{fmtCRC(valorReventas)}</p>
                  <p className="text-[10px] text-emerald-700/60">{liberadas.length} venta{liberadas.length !== 1 ? 's' : ''}</p>
                </div>
                <div className={`rounded-xl border px-4 py-3 ${diff >= 0 ? 'border-emerald-100 bg-emerald-50/50' : 'border-red-100 bg-red-50/50'}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">Diferencia</p>
                  <p className={`mt-1 text-lg font-bold ${diff >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {diff >= 0 ? '+' : ''}{fmtCRC(diff)}
                  </p>
                  <p className={`text-[10px] ${diff >= 0 ? 'text-emerald-700/60' : 'text-red-600/60'}`}>
                    {diff >= 0 ? '+' : ''}{diffPct.toFixed(1)}% vs facial
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                  <Coins size={12} /> Bonos asociados ({sel.bond_token_ids.length})
                </p>
                <div className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-xl border border-outline-variant/20 bg-surface-container-low/30 p-2">
                  {sel.bond_token_ids.map((tid: string) => {
                    const b = allBonds.find((x: any) => x.token_id === tid);
                    if (!b) return (
                      <div key={tid} className="rounded-lg border border-outline-variant/20 bg-white p-3 text-xs text-on-surface-variant">
                        Bono no encontrado: <span className="font-mono">{tid.slice(0, 8)}…</span>
                      </div>
                    );
                    const transfers = allTransfers.filter((t: any) => t.bond_token_id === tid);
                    const liberadas = transfers.filter((t: any) => t.status === 'liberada');
                    return (
                      <div key={tid} className="rounded-lg border border-outline-variant/20 bg-white p-3">
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <p className="font-mono text-sm font-bold text-primary">{b.bond_id}</p>
                            <p className="text-[11px] text-on-surface-variant">{b.parties?.name ?? '—'} · {b.certificate_number ?? 'sin certificado'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm font-semibold">{fmtCRC(b.face_value)}</p>
                            <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] uppercase text-on-surface-variant">{b.status}</span>
                          </div>
                        </div>

                        <div className="mb-2 grid grid-cols-2 gap-2 border-t border-outline-variant/10 pt-2 text-[11px]">
                          <div>
                            <span className="text-on-surface-variant">Dueño actual:</span>
                            <p className="flex items-center gap-1 font-medium"><User size={10} /> {b.profiles?.full_name ?? '—'}</p>
                          </div>
                          <div>
                            <span className="text-on-surface-variant">Movimientos:</span>
                            <p className="font-medium">{liberadas.length} venta{liberadas.length !== 1 ? 's' : ''}</p>
                          </div>
                          {b.series && (
                            <div>
                              <span className="text-on-surface-variant">Serie:</span>
                              <p className="font-medium">{b.series}</p>
                            </div>
                          )}
                          {b.interest_rate != null && (
                            <div>
                              <span className="text-on-surface-variant">Tasa:</span>
                              <p className="font-medium">{b.interest_rate}%</p>
                            </div>
                          )}
                        </div>

                        {/* Mini trazabilidad de propietarios */}
                        {liberadas.length > 0 && (
                          <div className="mb-2 border-t border-outline-variant/10 pt-2">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">Cadena de propietarios</p>
                            <div className="flex flex-wrap items-center gap-1 text-[11px]">
                              {liberadas
                                .sort((a: any, c: any) => (a.created_at ?? '').localeCompare(c.created_at ?? ''))
                                .map((t: any, i: number) => (
                                  <span key={t.id} className="flex items-center gap-1">
                                    {i === 0 && <span className="font-medium">{t.from_profile?.full_name ?? '?'}</span>}
                                    <span className="text-on-surface-variant mx-1">a</span>
                                    <span className="font-medium">{t.to_profile?.full_name ?? '?'}</span>
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Stellar info */}
                        <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/10 pt-2">
                          {b.stellar_status === 'confirmed' && (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              <CheckCircle size={9} /> On-chain
                            </span>
                          )}
                          {b.stellar_transaction_hash && (
                            <a
                              href={txUrl(b.stellar_transaction_hash)}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-primary transition hover:bg-blue-100"
                            >
                              <ExternalLink size={9} /> Tx hash
                            </a>
                          )}
                          <a
                            href={bondExplorerUrl(b.soroban_contract_id, b.bond_id)}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-full border border-outline-variant/30 bg-white px-2 py-0.5 text-[10px] font-medium text-on-surface-variant transition hover:border-primary hover:text-primary"
                          >
                            <ExternalLink size={9} /> Stellar asset
                          </a>
                          <Link
                            href={`/tse/trazabilidad?bono=${b.bond_id}`}
                            className="flex items-center gap-1 rounded-full border border-outline-variant/30 bg-white px-2 py-0.5 text-[10px] font-medium text-on-surface-variant transition hover:border-primary hover:text-primary"
                          >
                            <Waypoints size={9} /> Trazabilidad
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              </>;
            })()}

            <div className="mb-5">
              <label className="field-label">Comentarios del TSE</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones, recomendaciones o requerimientos…"
                className="field-input resize-none"
                {...schemaFieldProps(fieldErrors, 'notes')}
              />
              <SchemaFieldError errors={fieldErrors} field="notes" />
            </div>

            <div className="-mx-6 -mb-6 mt-6 flex flex-col items-center justify-end gap-2 rounded-b-2xl border-t border-outline-variant/20 bg-surface-container-low/50 px-6 py-4 sm:flex-row">
              <button onClick={() => setSel(null)} className="btn-ghost w-full sm:w-auto">
                <X size={14} /> Cerrar
              </button>
              <button onClick={() => review('observado')} disabled={busy}
                className={`btn-action btn-warn w-full sm:w-auto ${busy ? 'btn-loading' : ''}`}>
                {busy ? <><span className="btn-spinner" /> Procesando…</> : <><AlertCircle size={14} /> Observar reporte</>}
              </button>
              <button onClick={() => review('aprobado')} disabled={busy}
                className={`btn-action btn-success w-full sm:w-auto ${busy ? 'btn-loading' : ''}`}>
                {busy ? <><span className="btn-spinner" /> Procesando…</> : <><CheckCircle size={14} /> Aprobar reporte</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </TSEShell>
  );
}
