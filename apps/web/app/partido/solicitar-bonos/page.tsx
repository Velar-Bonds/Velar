'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, CheckCircle, ArrowLeft, Info, Clock } from 'lucide-react';
import { PartidoShell } from '../../../components/PartidoShell';
import { useSession, apiFetch } from '../../../lib/api';

type BondRequest = {
  id: string;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  face_value: number;
  currency: string;
  series?: string;
  certificate_number?: string;
  interest_rate?: number;
  issue_date?: string;
  maturity_date?: string;
  created_at?: string;
  rejection_reason?: string;
  bond_token_id?: string;
};

const STATUS_MAP: Record<string, [string, string]> = {
  pendiente: ['bg-amber-50 text-amber-700 border-amber-200', 'Pendiente TSE'],
  aprobado: ['bg-emerald-50 text-emerald-700 border-emerald-200', 'Aprobado'],
  rechazado: ['bg-red-50 text-red-600 border-red-200', 'Rechazado'],
};

const CURRENCIES = ['CRC', 'USD', 'EUR'];

const fmtMoney = (n: number, cur = 'CRC') =>
  new Intl.NumberFormat('es-CR', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) : ':';

export default function SolicitarBonosPage() {
  const { token, me, loading, error } = useSession();
  const [requests, setRequests] = useState<BondRequest[]>([]);
  const [form, setForm] = useState({
    certificate_number: '',
    face_value: '',
    currency: 'CRC',
    interest_rate: '',
    series: '',
    issue_date: '',
    maturity_date: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = (tok: string) =>
    apiFetch(tok, 'GET', '/bonds/requests').then(setRequests).catch(() => {});

  useEffect(() => { if (token) load(token); /* eslint-disable-next-line */ }, [token]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.face_value || isNaN(Number(form.face_value))) {
      setMsg({ type: 'err', text: 'Ingresá un monto válido.' });
      return;
    }
    setBusy(true); setMsg(null);
    try {
      await apiFetch(token, 'POST', '/bonds/requests', {
        certificateNumber: form.certificate_number || undefined,
        faceValue: Number(form.face_value),
        currency: form.currency,
        interestRate: form.interest_rate ? Number(form.interest_rate) : undefined,
        series: form.series || undefined,
        issueDate: form.issue_date || undefined,
        maturityDate: form.maturity_date || undefined,
        notes: form.notes || undefined,
      });
      setMsg({ type: 'ok', text: 'Solicitud enviada al TSE. Te notificaremos cuando sea procesada.' });
      setForm({ certificate_number: '', face_value: '', currency: 'CRC', interest_rate: '', series: '', issue_date: '', maturity_date: '', notes: '' });
      load(token);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const pending = requests.filter((r) => r.status === 'pendiente');
  const approved = requests.filter((r) => r.status === 'aprobado');
  const rejected = requests.filter((r) => r.status === 'rechazado');

  return (
    <PartidoShell me={me}>
      <header className="sticky top-0 z-40 flex h-20 items-center border-b border-outline-variant/30 bg-surface/70 px-10 shadow-sm backdrop-blur-xl">
        <Link href="/partido" className="mr-4 flex items-center gap-2 text-sm text-on-surface-variant transition hover:text-primary">
           Volver
        </Link>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Geist' }}>Solicitar bonos al TSE</h1>
      </header>

      <div className="mx-auto w-full max-w-[1100px] p-10 pb-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">

          {/* Formulario */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.85)' }}>
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileText size={20} />
                </span>
                <div>
                  <h2 className="font-semibold" style={{ fontFamily: 'Geist' }}>Nueva solicitud de bono</h2>
                  <p className="text-xs text-on-surface-variant">El TSE revisará y aprobará o rechazará la solicitud.</p>
                </div>
              </div>

              {msg && (
                <div className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${msg.type === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
                  {msg.type === 'ok' ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <Info size={16} className="mt-0.5 shrink-0" />}
                  {msg.text}
                </div>
              )}

              <form onSubmit={submit} className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Número de certificado</label>
                    <input value={form.certificate_number} onChange={set('certificate_number')} placeholder="Ej. CERT-2026-001"
                      className="field-input" />
                  </div>
                  <div>
                    <label className="field-label">Serie o lote</label>
                    <input value={form.series} onChange={set('series')} placeholder="Ej. A, B, Serie I"
                      className="field-input" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Monto total <span className="text-red-500">*</span></label>
                    <input type="number" min="0" step="1000" required value={form.face_value} onChange={set('face_value')}
                      placeholder="5000000" className="field-input" />
                  </div>
                  <div>
                    <label className="field-label">Moneda</label>
                    <select value={form.currency} onChange={set('currency')} className="field-input bg-white">
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="field-label">Tasa de interés (%) <span className="text-on-surface-variant font-normal normal-case">(opcional)</span></label>
                  <input type="number" min="0" max="100" step="0.01" value={form.interest_rate} onChange={set('interest_rate')}
                    placeholder="Ej. 6.5" className="field-input" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Fecha de emisión</label>
                    <input type="date" value={form.issue_date} onChange={set('issue_date')} className="field-input" />
                  </div>
                  <div>
                    <label className="field-label">Fecha de vencimiento</label>
                    <input type="date" value={form.maturity_date} onChange={set('maturity_date')} className="field-input" />
                  </div>
                </div>

                <div>
                  <label className="field-label">Notas / justificación <span className="text-on-surface-variant font-normal normal-case">(opcional)</span></label>
                  <textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Propósito de la solicitud…"
                    className="field-input resize-none" />
                </div>

                <button type="submit" disabled={busy}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60">
                  {busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Enviando…</> : 'Enviar solicitud al TSE'}
                </button>
              </form>
            </div>
          </div>

          {/* Panel lateral */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            {/* Flujo */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-primary">¿Cómo funciona?</h3>
              <ol className="flex flex-col gap-2">
                {['Completás el formulario y enviás.', 'El TSE revisa y aprueba o rechaza.', 'Si es aprobado, el bono aparece en "Mis bonos".', 'Podés publicarlo en el marketplace.'].map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-primary/80">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>

            {/* Solicitudes pendientes */}
            {pending.length > 0 && (
              <div className="glass-card rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.85)' }}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Clock size={14} className="text-amber-600" /> En revisión ({pending.length})</h3>
                <div className="flex flex-col gap-2">
                  {pending.map((r) => <RequestRow key={r.id} r={r} />)}
                </div>
              </div>
            )}

            {/* Aprobados */}
            {approved.length > 0 && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle size={14} /> Aprobados ({approved.length})</h3>
                <div className="flex flex-col gap-2">
                  {approved.slice(0, 4).map((r) => <RequestRow key={r.id} r={r} />)}
                </div>
                {approved.length > 4 && (
                  <Link href="/partido/mis-bonos" className="mt-2 block text-xs font-medium text-emerald-700 hover:underline">Ver todos  a </Link>
                )}
              </div>
            )}

            {/* Rechazados */}
            {rejected.length > 0 && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                <h3 className="mb-3 text-sm font-semibold text-red-600">Rechazados ({rejected.length})</h3>
                <div className="flex flex-col gap-2">
                  {rejected.map((r) => (
                    <div key={r.id}>
                      <RequestRow r={r} />
                      {r.rejection_reason && <p className="mt-1 text-[11px] text-red-500 pl-1">{r.rejection_reason}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PartidoShell>
  );
}

function RequestRow({ r }: { r: BondRequest }) {
  const [cls, lbl] = STATUS_MAP[r.status] ?? ['bg-gray-100 text-gray-600 border-gray-200', r.status];
  const fmt = (n: number, cur = 'CRC') =>
    new Intl.NumberFormat('es-CR', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
  return (
    <div className="flex items-center justify-between rounded-lg border border-outline-variant/20 bg-white px-3 py-2">
      <div>
        <p className="text-xs font-semibold text-on-surface">{fmt(r.face_value, r.currency)}</p>
        {r.series && <p className="text-[11px] text-on-surface-variant">Serie {r.series}</p>}
      </div>
      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{lbl}</span>
    </div>
  );
}
