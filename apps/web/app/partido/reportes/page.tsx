'use client';
import { useEffect, useState } from 'react';
import { FileText, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { PartidoShell } from '../../../components/PartidoShell';
import { useSession, apiFetch } from '../../../lib/api';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) : ':';
const fmtCRC = (n?: number | null) => n == null ? 'Sin dato' : new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n);

const STATUS: Record<string, [string, string, any]> = {
  enviado: ['bg-blue-50 text-primary border-blue-200', 'Enviado', Clock],
  revisado: ['bg-amber-50 text-amber-700 border-amber-200', 'Revisado', AlertCircle],
  observado: ['bg-red-50 text-red-600 border-red-200', 'Observado', AlertCircle],
  aprobado: ['bg-emerald-50 text-emerald-700 border-emerald-200', 'Aprobado', CheckCircle],
};

export default function PartidoReportesPage() {
  const { token, me, loading, error } = useSession();
  const [reports, setReports] = useState<any[]>([]);
  const [bonds, setBonds] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '', description: '', period_start: '', period_end: '',
    total_amount: '', bond_token_ids: [] as string[],
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = () =>
    Promise.all([
      apiFetch(token, 'GET', '/reports').then(setReports).catch(() => {}),
      apiFetch(token, 'GET', '/bonds').then(setBonds).catch(() => {}),
    ]);

  useEffect(() => { if (token) load(); /* eslint-disable-next-line */ }, [token]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setMsg({ type: 'err', text: 'Título y descripción son obligatorios.' });
      return;
    }
    setBusy(true); setMsg(null);
    try {
      await apiFetch(token, 'POST', '/reports', {
        title: form.title,
        description: form.description,
        period_start: form.period_start || undefined,
        period_end: form.period_end || undefined,
        total_amount: form.total_amount ? Number(form.total_amount) : undefined,
        bond_token_ids: form.bond_token_ids.length ? form.bond_token_ids : undefined,
      });
      setMsg({ type: 'ok', text: 'Reporte enviado al TSE.' });
      setForm({ title: '', description: '', period_start: '', period_end: '', total_amount: '', bond_token_ids: [] });
      load();
    } catch (e: any) { setMsg({ type: 'err', text: e.message }); } finally { setBusy(false); }
  }

  const toggleBond = (id: string) =>
    setForm((f) => ({ ...f, bond_token_ids: f.bond_token_ids.includes(id) ? f.bond_token_ids.filter((x) => x !== id) : [...f.bond_token_ids, id] }));

  return (
    <PartidoShell me={me}>
      <header className="sticky top-0 z-40 flex h-20 items-center border-b border-outline-variant/30 bg-surface/70 px-10 shadow-sm backdrop-blur-xl">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Geist' }}>Reportes al TSE</h1>
      </header>

      <div className="mx-auto w-full max-w-[1100px] p-10 pb-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Formulario */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.85)' }}>
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Send size={20} /></span>
                <div>
                  <h2 className="font-semibold" style={{ fontFamily: 'Geist' }}>Nuevo reporte</h2>
                  <p className="text-xs text-on-surface-variant">Enviá un informe sobre tus bonos al TSE.</p>
                </div>
              </div>

              {msg && (
                <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${msg.type === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
                  {msg.text}
                </div>
              )}

              <form onSubmit={submit} className="flex flex-col gap-4">
                <div>
                  <label className="field-label">Título <span className="text-red-500">*</span></label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej. Informe trimestral Q1 2026" className="field-input" />
                </div>

                <div>
                  <label className="field-label">Descripción <span className="text-red-500">*</span></label>
                  <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalle de bonos emitidos, ventas realizadas, uso de fondos…" className="field-input resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Desde</label>
                    <input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} className="field-input" />
                  </div>
                  <div>
                    <label className="field-label">Hasta</label>
                    <input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} className="field-input" />
                  </div>
                </div>

                <div>
                  <label className="field-label">Monto total reportado (CRC)</label>
                  <input type="number" min="0" step="1000" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} placeholder="5000000" className="field-input" />
                </div>

                {bonds.length > 0 && (
                  <div>
                    <label className="field-label">Bonos asociados ({form.bond_token_ids.length} seleccionado{form.bond_token_ids.length !== 1 ? 's' : ''})</label>
                    <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-xl border border-outline-variant/30 bg-white p-2">
                      {bonds.map((b: any) => (
                        <label key={b.token_id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-surface-container-low">
                          <input type="checkbox" checked={form.bond_token_ids.includes(b.token_id)} onChange={() => toggleBond(b.token_id)} />
                          <span className="font-mono font-semibold text-primary">{b.bond_id}</span>
                          <span className="text-on-surface-variant">{fmtCRC(b.face_value)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <button type="submit" disabled={busy} className={`btn-action justify-center py-3 ${busy ? 'btn-loading' : ''}`}>
                  {busy ? <><span className="btn-spinner" /> Enviando…</> : <><Send size={14} /> Enviar al TSE</>}
                </button>
              </form>
            </div>
          </div>

          {/* Reportes enviados */}
          <div className="lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-on-surface-variant">Reportes enviados</h3>
            {reports.length === 0 ? (
              <p className="rounded-2xl border-2 border-dashed border-outline-variant/30 p-8 text-center text-sm text-on-surface-variant">
                Aún no enviaste reportes.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {reports.map((r) => {
                  const [cls, lbl, Icon] = STATUS[r.status] ?? ['bg-gray-100 text-gray-600 border-gray-200', r.status, Clock];
                  return (
                    <div key={r.id} className="glass-card rounded-2xl p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="font-semibold">{r.title}</p>
                        <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
                          <Icon size={11} /> {lbl}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs text-on-surface-variant">{r.description}</p>
                      <div className="mt-2 flex justify-between text-[11px] text-on-surface-variant">
                        <span>{fmtDate(r.created_at)}</span>
                        {r.total_amount && <span className="font-mono font-semibold">{fmtCRC(r.total_amount)}</span>}
                      </div>
                      {r.tse_notes && (
                        <div className="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-700">
                          <strong>TSE:</strong> {r.tse_notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PartidoShell>
  );
}
