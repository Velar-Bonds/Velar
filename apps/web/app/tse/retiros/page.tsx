'use client';
import { notify } from '../../../components/Toast';
import { useEffect, useState } from 'react';
import { ArrowRight, AlertTriangle, CheckCircle, XCircle, Shield } from 'lucide-react';
import { TSEShell } from '../../../components/TSEShell';
import { PaginationControls } from '../../../components/PaginationControls';
import { useSession, apiFetch } from '../../../lib/api';
import { paginatedQuery, paginationMeta, unwrapPaginated } from '../../../lib/pagination';

const fmtCRC = (n: number | null) => n == null ? 'Sin dato' : new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ':';

export default function RetirosPage() {
  const { token, me, loading, error } = useSession();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = (p = page) => apiFetch(token, 'GET', `/transfers?${paginatedQuery(p, limit)}`)
    .then((res) => {
      setTransfers(unwrapPaginated(res));
      setTotal(paginationMeta(res).total);
    })
    .catch(() => {});
  useEffect(() => { if (token) load(page); /* eslint-disable-next-line */ }, [token, page]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  async function decide(id: string, action: 'approve-return' | 'reject-return') {
    setBusy(id); 
    try {
      await apiFetch(token, 'PATCH', `/transfers/${id}/${action}`, { notes: notes[id] });
      notify.ok(action === 'approve-return' ? 'Bono devuelto al dueño on-chain' : 'Solicitud rechazada');
      load(page);
    } catch (e: any) { notify.err(e.message); }
    finally { setBusy(null); }
  }

  const pending = transfers.filter((t) => t.return_requested_at && !t.return_approved_at && !t.return_rejected_at);
  const resolved = transfers.filter((t) => t.return_approved_at || t.return_rejected_at);

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Solicitudes de retiro de escrow</h1>
          <p className="text-sm text-on-surface-variant">{pending.length} pendiente{pending.length !== 1 ? 's' : ''} · {resolved.length} resuelta{resolved.length !== 1 ? 's' : ''}</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1100px] p-8 pb-20">
        <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h2 className="font-semibold text-amber-900">¿Qué es esta página?</h2>
              <p className="mt-1 text-sm text-amber-800/80">
                Cuando un dueño y un comprador no llegan a un acuerdo después de bloquear el bono en escrow,
                el dueño puede pedir al TSE que retire el bono de la canasta. Acá aprobás o rechazás esa solicitud.
              </p>
              <p className="mt-2 text-xs text-amber-700">
                <strong>Aprobar</strong> mueve el token on-chain de la canasta al dueño original y cancela la negociación.
                <strong> Rechazar</strong> deja la negociación activa.
              </p>
            </div>
          </div>
        </div>


        <h2 className="mb-3 text-lg font-semibold">Pendientes</h2>
        {pending.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-outline-variant/30 p-12 text-center text-on-surface-variant">
            <Shield size={32} className="mx-auto mb-3 text-outline" />
            <p>No hay solicitudes pendientes.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map((t) => (
              <div key={t.id} className="glass-card rounded-2xl p-5">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold text-primary">{t.bonds?.bond_id ?? 'Bono'}</p>
                    <p className="flex items-center gap-1.5 text-sm">
                      {t.from_profile?.full_name ?? '?'}
                      
                      {t.to_profile?.full_name ?? '?'}
                    </p>
                    <p className="text-xs text-on-surface-variant">Monto en negociación: <span className="font-semibold">{fmtCRC(Number(t.amount))}</span></p>
                  </div>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">{t.status}</span>
                </div>

                <div className="mb-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Motivo del retiro</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{t.return_reason || '(sin motivo proporcionado)'}</p>
                  <p className="mt-2 text-[11px] text-on-surface-variant">Solicitado el {fmtDate(t.return_requested_at)}</p>
                </div>

                <div className="mb-3">
                  <label className="field-label">Notas del TSE (opcional)</label>
                  <textarea
                    rows={2}
                    value={notes[t.id] ?? ''}
                    onChange={(e) => setNotes((p) => ({ ...p, [t.id]: e.target.value }))}
                    placeholder="Comentarios visibles para el dueño…"
                    className="field-input resize-none"
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <button onClick={() => decide(t.id, 'reject-return')} disabled={busy === t.id}
                    className={`btn-ghost btn-ghost-danger ${busy === t.id ? 'btn-loading' : ''}`}>
                    {busy === t.id ? <span className="btn-spinner" /> : <><XCircle size={14} /> Rechazar</>}
                  </button>
                  <button onClick={() => decide(t.id, 'approve-return')} disabled={busy === t.id}
                    className={`btn-action btn-success ${busy === t.id ? 'btn-loading' : ''}`}>
                    {busy === t.id ? <span className="btn-spinner" /> : <><CheckCircle size={14} /> Aprobar retiro</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {resolved.length > 0 && (
          <>
            <h2 className="mb-3 mt-10 text-lg font-semibold">Resueltas</h2>
            <div className="flex flex-col gap-2 opacity-80">
              {resolved.map((t) => (
                <div key={t.id} className="glass-card flex items-center justify-between rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    {t.return_approved_at
                      ? <CheckCircle size={18} className="text-emerald-600" />
                      : <XCircle size={18} className="text-red-500" />}
                    <div>
                      <p className="font-mono text-sm font-semibold text-primary">{t.bonds?.bond_id ?? 'Bono'}</p>
                      <p className="text-xs text-on-surface-variant">
                        {t.return_approved_at ? `Aprobado el ${fmtDate(t.return_approved_at)}` : `Rechazado el ${fmtDate(t.return_rejected_at)}`}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-semibold">{fmtCRC(Number(t.amount))}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <PaginationControls page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>
    </TSEShell>
  );
}
