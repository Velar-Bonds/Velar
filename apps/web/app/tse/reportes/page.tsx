'use client';
import { useEffect, useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Eye, X } from 'lucide-react';
import { TSEShell } from '../../../components/TSEShell';
import { useSession, apiFetch } from '../../../lib/api';

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
  const [sel, setSel] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => apiFetch(token, 'GET', '/reports').then(setReports).catch(() => {});
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
    setBusy(true); setMsg('');
    try {
      await apiFetch(token, 'PATCH', `/reports/${sel.id}/review`, { status, notes });
      setMsg(`Reporte marcado como ${status}.`);
      setSel(null); setNotes('');
      load();
    } catch (e: any) { setMsg('⚠️ ' + e.message); } finally { setBusy(false); }
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
        {msg && <div className="mb-4 rounded-xl border border-[#d8e2f5] bg-white px-4 py-2.5 text-sm">{msg}</div>}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
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

            {sel.bond_token_ids?.length > 0 && (
              <div className="mb-4">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Bonos asociados</p>
                <p className="font-mono text-xs">{sel.bond_token_ids.length} bono{sel.bond_token_ids.length !== 1 ? 's' : ''}</p>
              </div>
            )}

            <div className="mb-5">
              <label className="field-label">Comentarios del TSE</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones, recomendaciones o requerimientos…"
                className="field-input resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setSel(null)} className="btn-ghost">Cerrar</button>
              <button onClick={() => review('observado')} disabled={busy} className={`btn-action btn-warn ${busy ? 'btn-loading' : ''}`}>
                <AlertCircle size={13} /> Observar
              </button>
              <button onClick={() => review('aprobado')} disabled={busy} className={`btn-action btn-success ${busy ? 'btn-loading' : ''}`}>
                <CheckCircle size={13} /> Aprobar
              </button>
            </div>
          </div>
        </div>
      )}
    </TSEShell>
  );
}
