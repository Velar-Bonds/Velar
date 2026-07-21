'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays, ListChecks, Paperclip, ScanSearch, Send,
  Plus, Trash2, CheckCircle, AlertTriangle, ArrowLeft, ArrowRight,
} from 'lucide-react';
import { PartidoShell } from '../../../../components/PartidoShell';
import { useSession, apiFetch } from '../../../../lib/api';
import { unwrapPaginated } from '../../../../lib/pagination';
import {
  CATEGORY_LABEL, fmtCRC, periodLabel, uploadReportFile,
} from '../../../../lib/reports';
import type {
  ReportLineCategory, ReportLineItem, ReportFile, ReconciliationResult,
} from '@velar/types';

const STEPS = [
  { key: 'periodo', label: 'Período', icon: CalendarDays },
  { key: 'lineas', label: 'Líneas', icon: ListChecks },
  { key: 'archivos', label: 'Archivos', icon: Paperclip },
  { key: 'conciliacion', label: 'Conciliación', icon: ScanSearch },
  { key: 'revisar', label: 'Revisar', icon: Send },
];

const CATEGORIES: ReportLineCategory[] = ['ingreso', 'egreso', 'donacion', 'bono', 'otro'];
const now = new Date();

export default function NuevoReportePage() {
  const router = useRouter();
  const { token, me, loading, error } = useSession();

  const [step, setStep] = useState(0);
  const [reportId, setReportId] = useState<string | null>(null);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // mes actual
  const [title, setTitle] = useState('');

  const [bonds, setBonds] = useState<any[]>([]);
  const [items, setItems] = useState<ReportLineItem[]>([]);
  const [files, setFiles] = useState<ReportFile[]>([]);
  const [recon, setRecon] = useState<ReconciliationResult | null>(null);

  const [draft, setDraft] = useState({
    concept: '', amount: '', category: 'bono' as ReportLineCategory, bondTokenId: '',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (token) apiFetch(token, 'GET', '/bonds?page=1&limit=100').then((r) => setBonds(unwrapPaginated(r))).catch(() => {});
  }, [token]);

  const total = useMemo(() => items.reduce((s, i) => s + i.amount, 0), [items]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const fail = (e: any) => setMsg({ type: 'err', text: e?.message ?? 'Ocurrió un error' });

  async function ensureDraft() {
    if (reportId) return reportId;
    const body = { periodYear: year, periodMonth: month, title: title || undefined };
    const rep = await apiFetch(token!, 'POST', '/reports/lifecycle', body);
    setReportId(rep.id);
    return rep.id as string;
  }

  async function goToLineItems() {
    setBusy(true); setMsg(null);
    try { await ensureDraft(); setStep(1); } catch (e) { fail(e); } finally { setBusy(false); }
  }

  async function addLine() {
    if (!draft.concept.trim() || draft.amount === '') { setMsg({ type: 'err', text: 'Concepto y monto son obligatorios' }); return; }
    setBusy(true); setMsg(null);
    try {
      const id = await ensureDraft();
      const item = await apiFetch(token!, 'POST', `/reports/lifecycle/${id}/line-items`, {
        concept: draft.concept.trim(),
        amount: Number(draft.amount),
        category: draft.category,
        bondTokenId: draft.bondTokenId || null,
      });
      setItems((xs) => [...xs, item]);
      setDraft({ concept: '', amount: '', category: 'bono', bondTokenId: '' });
    } catch (e) { fail(e); } finally { setBusy(false); }
  }

  async function removeLine(lineItemId: string) {
    if (!reportId) return;
    setBusy(true);
    try {
      await apiFetch(token!, 'DELETE', `/reports/lifecycle/${reportId}/line-items/${lineItemId}`);
      setItems((xs) => xs.filter((x) => x.id !== lineItemId));
    } catch (e) { fail(e); } finally { setBusy(false); }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !reportId) return;
    setBusy(true); setMsg(null);
    try {
      const uploaded = await uploadReportFile(token!, reportId, file);
      setFiles((xs) => [...xs, uploaded]);
      setMsg({ type: 'ok', text: `Archivo "${file.name}" adjuntado.` });
    } catch (err) { fail(err); } finally { setBusy(false); e.target.value = ''; }
  }

  async function loadReconciliation() {
    if (!reportId) return;
    setBusy(true); setMsg(null);
    try {
      const r = await apiFetch(token!, 'GET', `/reports/lifecycle/${reportId}/reconciliation`);
      setRecon(r); setStep(3);
    } catch (e) { fail(e); } finally { setBusy(false); }
  }

  async function submit() {
    if (!reportId) return;
    setBusy(true); setMsg(null);
    try {
      await apiFetch(token!, 'POST', `/reports/lifecycle/${reportId}/submit`);
      router.push(`/partido/reportes/${reportId}`);
    } catch (e) { fail(e); } finally { setBusy(false); }
  }

  const StepIcon = STEPS[step].icon;

  return (
    <PartidoShell me={me}>
      <header className="sticky top-0 z-40 flex h-20 items-center gap-3 border-b border-outline-variant/30 bg-surface/70 px-10 shadow-sm backdrop-blur-xl">
        <button onClick={() => router.push('/partido/reportes')} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-container-low" aria-label="Volver">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Geist' }}>Nuevo reporte mensual</h1>
      </header>

      <div className="mx-auto w-full max-w-[900px] p-10 pb-24">
        {/* Stepper */}
        <ol className="mb-8 flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step, done = i < step;
            return (
              <li key={s.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${active ? 'border-primary bg-primary/10 text-primary' : done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-outline-variant/40 text-on-surface-variant'}`}>
                    {done ? <CheckCircle size={18} /> : <Icon size={18} />}
                  </span>
                  <span className={`text-[11px] ${active ? 'font-semibold text-primary' : 'text-on-surface-variant'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <span className={`mx-2 h-0.5 flex-1 ${done ? 'bg-emerald-500' : 'bg-outline-variant/30'}`} />}
              </li>
            );
          })}
        </ol>

        {msg && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${msg.type === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
            {msg.text}
          </div>
        )}

        <div className="glass-card rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.85)' }}>
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><StepIcon size={20} /></span>
            <h2 className="font-semibold" style={{ fontFamily: 'Geist' }}>{STEPS[step].label}</h2>
          </div>

          {/* Paso 1: Período */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Mes</label>
                  <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="field-input" disabled={!!reportId}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{periodLabel(year, m).split(' ')[0]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">Año</label>
                  <input type="number" value={year} min={2020} max={2100} onChange={(e) => setYear(Number(e.target.value))} className="field-input" disabled={!!reportId} />
                </div>
              </div>
              <div>
                <label className="field-label">Título (opcional)</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Reporte ${periodLabel(year, month)}`} className="field-input" disabled={!!reportId} />
              </div>
              <p className="text-xs text-on-surface-variant">Al continuar se crea un borrador que podés editar hasta enviarlo.</p>
            </div>
          )}

          {/* Paso 2: Líneas */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-outline-variant/30 p-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="field-label">Concepto</label>
                  <input value={draft.concept} onChange={(e) => setDraft({ ...draft, concept: e.target.value })} placeholder="Ej. Venta de bono SOL-2026-114" className="field-input" />
                </div>
                <div>
                  <label className="field-label">Monto (CRC)</label>
                  <input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} className="field-input" />
                </div>
                <div>
                  <label className="field-label">Categoría</label>
                  <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as ReportLineCategory })} className="field-input">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="field-label">Bono declarado (opcional)</label>
                  <select value={draft.bondTokenId} onChange={(e) => setDraft({ ...draft, bondTokenId: e.target.value })} className="field-input">
                    <option value="">— Sin bono —</option>
                    {bonds.map((b: any) => <option key={b.token_id} value={b.token_id}>{b.bond_id} · {fmtCRC(b.face_value)}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button onClick={addLine} disabled={busy} className="btn-action justify-center py-2.5"><Plus size={14} /> Agregar línea</button>
                </div>
              </div>

              {items.length === 0 ? (
                <p className="rounded-2xl border-2 border-dashed border-outline-variant/30 p-6 text-center text-sm text-on-surface-variant">Sin líneas todavía. Agregá al menos una para poder enviar.</p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-outline-variant/30">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-container-low text-left text-xs text-on-surface-variant">
                      <tr><th className="p-3">Concepto</th><th className="p-3">Categoría</th><th className="p-3 text-right">Monto</th><th className="p-3" /></tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.id} className="border-t border-outline-variant/20">
                          <td className="p-3">{it.concept}</td>
                          <td className="p-3">{CATEGORY_LABEL[it.category]}</td>
                          <td className="p-3 text-right font-mono">{fmtCRC(it.amount)}</td>
                          <td className="p-3 text-right"><button onClick={() => removeLine(it.id)} className="text-red-500 hover:text-red-700" aria-label="Eliminar"><Trash2 size={15} /></button></td>
                        </tr>
                      ))}
                      <tr className="border-t border-outline-variant/30 bg-surface-container-low font-semibold">
                        <td className="p-3" colSpan={2}>Total declarado</td>
                        <td className="p-3 text-right font-mono">{fmtCRC(total)}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Paso 3: Archivos */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant/40 p-8 text-center hover:bg-surface-container-low">
                <Paperclip size={22} className="text-primary" />
                <span className="text-sm font-medium">Adjuntar archivo (PDF, CSV, XLSX, imagen)</span>
                <span className="text-xs text-on-surface-variant">Máx. 10 MB. Se valida con antivirus antes de guardar.</span>
                <input type="file" className="hidden" onChange={onUpload} accept=".pdf,.csv,.xlsx,image/png,image/jpeg" disabled={busy} />
              </label>
              {files.length === 0 ? (
                <p className="text-center text-sm text-on-surface-variant">No hay archivos adjuntos (opcional).</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {files.map((f) => (
                    <li key={f.id} className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-white px-4 py-2.5 text-sm">
                      <span className="flex items-center gap-2"><Paperclip size={14} className="text-primary" /> {f.fileName}</span>
                      <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle size={12} /> limpio</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Paso 4: Conciliación */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              {!recon ? (
                <p className="text-center text-sm text-on-surface-variant">Cargando conciliación…</p>
              ) : recon.status === 'clean' ? (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
                  <CheckCircle size={22} />
                  <div>
                    <p className="font-semibold">Sin discrepancias</p>
                    <p className="text-xs">Lo declarado coincide con los bonos que tenés en cadena ({fmtCRC(recon.actualTotal)}).</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
                    <AlertTriangle size={22} />
                    <div>
                      <p className="font-semibold">{recon.discrepancies.length} discrepancia(s) detectada(s)</p>
                      <p className="text-xs">Declarado {fmtCRC(recon.declaredTotal)} · En cadena {fmtCRC(recon.actualTotal)}. Podés enviar igual; el TSE las verá.</p>
                    </div>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {recon.discrepancies.map((d, i) => (
                      <li key={i} className="rounded-xl border border-outline-variant/30 bg-white p-3 text-xs">
                        <span className="font-mono font-semibold text-primary">{d.bondTokenId.slice(0, 8)}…</span>
                        <span className="ml-2 text-on-surface-variant">{d.message}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* Paso 5: Revisar y enviar */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-on-surface-variant">Período</dt><dd className="font-semibold">{periodLabel(year, month)}</dd></div>
                <div><dt className="text-xs text-on-surface-variant">Líneas</dt><dd className="font-semibold">{items.length}</dd></div>
                <div><dt className="text-xs text-on-surface-variant">Total declarado</dt><dd className="font-mono font-semibold">{fmtCRC(total)}</dd></div>
                <div><dt className="text-xs text-on-surface-variant">Archivos</dt><dd className="font-semibold">{files.length}</dd></div>
                <div className="col-span-2">
                  <dt className="text-xs text-on-surface-variant">Conciliación</dt>
                  <dd className="font-semibold">{recon ? (recon.status === 'clean' ? 'Sin discrepancias' : `${recon.discrepancies.length} discrepancia(s)`) : 'No revisada'}</dd>
                </div>
              </dl>
              {items.length === 0 && <p className="text-sm text-red-600">Agregá al menos una línea antes de enviar.</p>}
              <button onClick={submit} disabled={busy || items.length === 0} className="btn-action justify-center py-3">
                {busy ? <><span className="btn-spinner" /> Enviando…</> : <><Send size={14} /> Enviar al TSE</>}
              </button>
            </div>
          )}

          {/* Navegación */}
          <div className="mt-8 flex items-center justify-between border-t border-outline-variant/20 pt-5">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || busy}
              className="flex items-center gap-1 rounded-full px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40"
            >
              <ArrowLeft size={15} /> Atrás
            </button>
            {step < STEPS.length - 1 && (
              <button
                onClick={() => {
                  if (step === 0) return goToLineItems();
                  if (step === 2) return loadReconciliation();
                  setStep((s) => s + 1);
                }}
                disabled={busy}
                className="btn-action px-5 py-2"
              >
                Continuar <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </PartidoShell>
  );
}
