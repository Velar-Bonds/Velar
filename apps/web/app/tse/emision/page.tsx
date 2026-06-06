'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, Info, Send } from 'lucide-react';
import { TSEShell } from '../../../components/TSEShell';
import { useSession, apiFetch } from '../../../lib/api';

export default function EmisionPage() {
  const { token, me, loading, error } = useSession();
  const [form, setForm] = useState({
    party_id: '', bond_id: '', certificate_number: '', face_value: '', currency: 'CRC',
    interest_rate: '', series: '', issue_date: '', maturity_date: '',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [parties, setParties] = useState<any[]>([]);

  useEffect(() => {
    if (token) apiFetch(token, 'GET', '/parties').then((ps) => { if (Array.isArray(ps)) setParties(ps); }).catch(() => {});
  }, [token]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.party_id || !form.face_value) { setMsg({ type: 'err', text: 'Completá el partido y el monto.' }); return; }
    setBusy(true); setMsg(null);
    try {
      const bondId = form.bond_id || `SOL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
      await apiFetch(token, 'POST', '/bonds', {
        bondId,
        issuerPartyId: form.party_id,
        documentHash: 'manual-' + Date.now(),
        faceValue: Number(form.face_value),
        certificateNumber: form.certificate_number || undefined,
        currency: form.currency,
        interestRate: form.interest_rate ? Number(form.interest_rate) : undefined,
        series: form.series || undefined,
        issueDate: form.issue_date || undefined,
        maturityDate: form.maturity_date || undefined,
      });
      setMsg({ type: 'ok', text: `Bono ${bondId} emitido correctamente y asignado al partido.` });
      setForm({ party_id: '', bond_id: '', certificate_number: '', face_value: '', currency: 'CRC', interest_rate: '', series: '', issue_date: '', maturity_date: '' });
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 flex h-20 items-center border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 backdrop-blur-md">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Emisión directa de bono</h1>
      </header>

      <div className="mx-auto w-full max-w-[700px] p-8 pb-20">
        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-primary">
          <p className="font-semibold">Emisión por el TSE</p>
          <p className="mt-1 text-xs text-primary/80">El bono se emite directamente a nombre del partido seleccionado. Aparecerá en "Mis bonos" del partido con estado <strong>activo</strong>.</p>
        </div>

        {msg && (
          <div className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${msg.type === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
            {msg.type === 'ok' ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <Info size={16} className="mt-0.5 shrink-0" />}
            {msg.text}
          </div>
        )}

        <form onSubmit={submit} className="glass-card flex flex-col gap-5 rounded-2xl p-7" style={{ background: 'rgba(255,255,255,0.85)' }}>
          <div>
            <label className="field-label">Partido emisor <span className="text-red-500">*</span></label>
            <select value={form.party_id} onChange={set('party_id')} required className="field-input bg-white">
              <option value="">Seleccioná un partido</option>
              {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">ID del bono <span className="text-on-surface-variant font-normal normal-case">opcional</span></label>
              <input value={form.bond_id} onChange={set('bond_id')} placeholder="Auto-generado si vacío" className="field-input" />
            </div>
            <div>
              <label className="field-label">Número de certificado</label>
              <input value={form.certificate_number} onChange={set('certificate_number')} placeholder="CERT-2026-XXX" className="field-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Monto total <span className="text-red-500">*</span></label>
              <input type="number" min="0" step="1000" required value={form.face_value} onChange={set('face_value')} placeholder="5000000" className="field-input" />
            </div>
            <div>
              <label className="field-label">Moneda</label>
              <select value={form.currency} onChange={set('currency')} className="field-input bg-white">
                {['CRC', 'USD', 'EUR'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Serie o lote</label>
              <input value={form.series} onChange={set('series')} placeholder="Serie A" className="field-input" />
            </div>
            <div>
              <label className="field-label">Tasa de interés (%)</label>
              <input type="number" min="0" max="100" step="0.01" value={form.interest_rate} onChange={set('interest_rate')} placeholder="6.5" className="field-input" />
            </div>
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

          <button type="submit" disabled={busy} className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60">
            {busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Emitiendo…</> : <><Send size={16} /> Emitir bono al partido</>}
          </button>
        </form>
      </div>
    </TSEShell>
  );
}
