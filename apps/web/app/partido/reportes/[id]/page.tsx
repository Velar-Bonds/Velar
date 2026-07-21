'use client';
import { useEffect, useState, use as usePromise } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, History, CheckCircle, AlertTriangle, Send, Plus, FileText, Paperclip,
} from 'lucide-react';
import { PartidoShell } from '../../../../components/PartidoShell';
import { useSession, apiFetch } from '../../../../lib/api';
import {
  STATUS_LABEL, STATUS_STYLE, CATEGORY_LABEL, COMPLIANCE_LABEL, COMPLIANCE_STYLE,
  fmtCRC, fmtDate, periodLabel, clientCompliance,
} from '../../../../lib/reports';
import type {
  MonthlyReportDetail, ReportLineCategory,
} from '@velar/types';

const CATEGORIES: ReportLineCategory[] = ['ingreso', 'egreso', 'donacion', 'bono', 'otro'];

export default function ReporteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const { token, me, loading, error } = useSession();

  const [detail, setDetail] = useState<MonthlyReportDetail | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [draft, setDraft] = useState({ concept: '', amount: '', category: 'otro' as ReportLineCategory });

  const load = () =>
    apiFetch(token!, 'GET', `/reports/lifecycle/${id}`)
      .then(setDetail)
      .catch((e) => setLoadErr(e.message));

  useEffect(() => { if (token) load(); /* eslint-disable-next-line */ }, [token, id]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const canCorrect = detail?.status === 'observado';

  async function addLine() {
    if (!draft.concept.trim() || draft.amount === '') { setMsg({ type: 'err', text: 'Concepto y monto son obligatorios' }); return; }
    setBusy(true); setMsg(null);
    try {
      await apiFetch(token!, 'POST', `/reports/lifecycle/${id}/line-items`, {
        concept: draft.concept.trim(), amount: Number(draft.amount), category: draft.category, bondTokenId: null,
      });
      setDraft({ concept: '', amount: '', category: 'otro' });
      await load();
    } catch (e: any) { setMsg({ type: 'err', text: e.message }); } finally { setBusy(false); }
  }

  async function resubmit() {
    setBusy(true); setMsg(null);
    try {
      await apiFetch(token!, 'POST', `/reports/lifecycle/${id}/submit`);
      setMsg({ type: 'ok', text: 'Reporte reenviado al TSE.' });
      await load();
    } catch (e: any) { setMsg({ type: 'err', text: e.message }); } finally { setBusy(false); }
  }

  const comp = detail ? clientCompliance(detail.periodYear, detail.periodMonth, detail.submittedAt) : null;

  return (
    <PartidoShell me={me}>
      <header className="sticky top-0 z-40 flex h-20 items-center gap-3 border-b border-outline-variant/30 bg-surface/70 px-10 shadow-sm backdrop-blur-xl">
        <button onClick={() => router.push('/partido/reportes')} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-container-low" aria-label="Volver">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Geist' }}>Detalle del reporte</h1>
      </header>

      <div className="mx-auto w-full max-w-[1000px] p-10 pb-24">
        {loadErr && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{loadErr}</div>}
        {msg && <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${msg.type === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}`}>{msg.text}</div>}

        {!detail ? (
          <p className="text-center text-sm text-on-surface-variant">Cargando…</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Columna principal */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="glass-card rounded-3xl p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-on-surface-variant">{periodLabel(detail.periodYear, detail.periodMonth)}</p>
                    <h2 className="text-lg font-bold" style={{ fontFamily: 'Geist' }}>{detail.title}</h2>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLE[detail.status] ?? ''}`}>{STATUS_LABEL[detail.status] ?? detail.status}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-surface-container-low px-3 py-1">Versión {detail.currentVersion}</span>
                  <span className="rounded-full bg-surface-container-low px-3 py-1">Enviado: {fmtDate(detail.submittedAt)}</span>
                  {comp && <span className={`rounded-full border px-3 py-1 font-medium ${COMPLIANCE_STYLE[comp.status]}`}>{COMPLIANCE_LABEL[comp.status]} · vence {fmtDate(comp.dueDate)}</span>}
                </div>
              </div>

              {/* Conciliación */}
              <div className="glass-card rounded-3xl p-6">
                <h3 className="mb-3 flex items-center gap-2 font-semibold"><FileText size={16} /> Conciliación on-chain</h3>
                {detail.reconciliation.status === 'clean' ? (
                  <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle size={16} /> Sin discrepancias · {fmtCRC(detail.reconciliation.declaredTotal)}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="flex items-center gap-2 text-sm text-amber-700"><AlertTriangle size={16} /> {detail.reconciliation.discrepancies.length} discrepancia(s)</p>
                    {detail.reconciliation.discrepancies.map((d, i) => (
                      <p key={i} className="rounded-lg bg-surface-container-low p-2 text-xs text-on-surface-variant">{d.message}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Líneas */}
              <div className="glass-card rounded-3xl p-6">
                <h3 className="mb-3 font-semibold">Líneas ({detail.lineItems.length})</h3>
                {detail.lineItems.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">Sin líneas.</p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-outline-variant/30">
                    <table className="w-full text-sm">
                      <tbody>
                        {detail.lineItems.map((it) => (
                          <tr key={it.id} className="border-b border-outline-variant/20 last:border-0">
                            <td className="p-3">{it.concept}</td>
                            <td className="p-3 text-on-surface-variant">{CATEGORY_LABEL[it.category]}</td>
                            <td className="p-3 text-right font-mono">{fmtCRC(it.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {detail.files.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-1 text-sm">
                    {detail.files.map((f) => (
                      <li key={f.id} className="flex items-center gap-2 text-on-surface-variant"><Paperclip size={13} /> {f.fileName}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Corrección / reenvío */}
              {canCorrect && (
                <div className="glass-card rounded-3xl border border-red-200 p-6">
                  <h3 className="mb-1 flex items-center gap-2 font-semibold text-red-600"><AlertTriangle size={16} /> El TSE observó este reporte</h3>
                  {detail.tseNotes && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700"><strong>Observación:</strong> {detail.tseNotes}</p>}
                  <p className="mb-3 text-xs text-on-surface-variant">Corregí las líneas necesarias y reenviá. Se creará una nueva versión conservando el historial.</p>
                  <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <input value={draft.concept} onChange={(e) => setDraft({ ...draft, concept: e.target.value })} placeholder="Concepto" className="field-input sm:col-span-2" />
                    <input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="Monto" className="field-input" />
                    <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as ReportLineCategory })} className="field-input">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={addLine} disabled={busy} className="flex items-center gap-1 rounded-full border border-outline-variant/40 px-4 py-2 text-sm hover:bg-surface-container-low"><Plus size={14} /> Agregar línea</button>
                    <button onClick={resubmit} disabled={busy} className="btn-action px-5 py-2">{busy ? <><span className="btn-spinner" /> Reenviando…</> : <><Send size={14} /> Reenviar al TSE</>}</button>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline de versiones */}
            <div className="lg:col-span-1">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface-variant"><History size={15} /> Historial de versiones</h3>
              {detail.versions.length === 0 ? (
                <p className="rounded-2xl border-2 border-dashed border-outline-variant/30 p-6 text-center text-xs text-on-surface-variant">Sin envíos todavía.</p>
              ) : (
                <ol className="relative ml-3 flex flex-col gap-5 border-l-2 border-outline-variant/30 pl-5">
                  {[...detail.versions].reverse().map((v) => (
                    <li key={v.id} className="relative">
                      <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{v.version}</span>
                      <div className="rounded-xl border border-outline-variant/30 bg-white p-3">
                        <div className="flex items-center justify-between">
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[v.status] ?? ''}`}>{STATUS_LABEL[v.status] ?? v.status}</span>
                          <span className="text-[11px] text-on-surface-variant">{fmtDate(v.createdAt)}</span>
                        </div>
                        <p className="mt-2 text-xs text-on-surface-variant">Total: <span className="font-mono">{fmtCRC(v.snapshot?.declaredTotal)}</span></p>
                        <p className="text-xs text-on-surface-variant">Conciliación: {v.snapshot?.reconciliation?.status === 'clean' ? 'limpia' : `${v.snapshot?.reconciliation?.discrepancies?.length ?? 0} disc.`}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </div>
    </PartidoShell>
  );
}
