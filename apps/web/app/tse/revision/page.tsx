'use client';
import { useEffect, useState, Fragment } from 'react';
import { Filter, CheckCircle, XCircle, Search } from 'lucide-react';
import { TSEShell } from '../../../components/TSEShell';
import { useSession, apiFetch } from '../../../lib/api';

type Request = {
  id: string; status: string; face_value: number; currency: string;
  series?: string; certificate_number?: string; interest_rate?: number | null;
  issue_date?: string; maturity_date?: string; created_at?: string;
  notes?: string; rejection_reason?: string;
  parties?: { name?: string; code?: string };
};

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha';
const fmtMoney = (n: number | null, cur = 'CRC') =>
  n == null ? 'Sin dato' : new Intl.NumberFormat('es-CR', { style: 'currency', currency: cur || 'CRC', maximumFractionDigits: 0 }).format(n);

const STATUS_CHIP: Record<string, [string, string]> = {
  pendiente: ['bg-amber-50 text-amber-700 border-amber-200', 'Pendiente'],
  aprobado: ['bg-emerald-50 text-emerald-700 border-emerald-200', 'Aprobado'],
  rechazado: ['bg-red-50 text-red-600 border-red-200', 'Rechazado'],
};

export default function RevisionPage() {
  const { token, me, loading, error } = useSession();
  const [requests, setRequests] = useState<Request[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [loadError, setLoadError] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterParty, setFilterParty] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterMontoMin, setFilterMontoMin] = useState('');
  const [filterMontoMax, setFilterMontoMax] = useState('');
  const [search, setSearch] = useState('');

  const load = (tok: string) =>
    apiFetch(tok, 'GET', '/bonds/requests')
      .then((data) => {
        setLoadError('');
        setRequests(Array.isArray(data) ? data : []);
      })
      .catch((e: any) => {
        setRequests([]);
        setLoadError(e.message ?? 'No se pudieron cargar las solicitudes.');
      });

  useEffect(() => {
    if (token) load(token);
  }, [token]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  async function approve(id: string) {
    setBusy(id);
    setMsg('');
    try {
      await apiFetch(token, 'PATCH', `/bonds/requests/${id}/approve`);
      setMsg('Bono aprobado y emitido al partido.');
      load(token);
    } catch (e: any) {
      setMsg(e.message ?? 'No se pudo aprobar la solicitud.');
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string) {
    if (!rejectReason.trim()) {
      setMsg('Ingresa el motivo del rechazo.');
      return;
    }
    setBusy(id);
    setMsg('');
    try {
      await apiFetch(token, 'PATCH', `/bonds/requests/${id}/reject`, { reason: rejectReason });
      setMsg('Solicitud rechazada.');
      setRejectTarget(null);
      setRejectReason('');
      load(token);
    } catch (e: any) {
      setMsg(e.message ?? 'No se pudo rechazar la solicitud.');
    } finally {
      setBusy(null);
    }
  }

  const parties = Array.from(new Set(requests.map((r) => r.parties?.name).filter(Boolean)));
  const filtered = requests.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterParty && r.parties?.name !== filterParty) return false;
    if (filterDateFrom && r.created_at && r.created_at < filterDateFrom) return false;
    if (filterDateTo && r.created_at && r.created_at > `${filterDateTo}T23:59:59`) return false;
    if (filterMontoMin && Number(r.face_value) < Number(filterMontoMin)) return false;
    if (filterMontoMax && Number(r.face_value) > Number(filterMontoMax)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${r.certificate_number ?? ''} ${r.parties?.name ?? ''} ${r.series ?? ''}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Revision de solicitudes</h1>
          <p className="text-sm text-on-surface-variant">{filtered.filter((r) => r.status === 'pendiente').length} pendientes de revision</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1200px] p-8 pb-20">
        {loadError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}
        {msg && <div className="mb-4 rounded-xl border border-[#d8e2f5] bg-white px-4 py-2.5 text-sm">{msg}</div>}

        <div className="mb-6 rounded-2xl border border-outline-variant/30 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
            <Filter size={15} /> Filtros
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="relative lg:col-span-2">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="field-input pl-8 text-xs" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="field-input bg-white text-xs">
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </select>
            <select value={filterParty} onChange={(e) => setFilterParty(e.target.value)} className="field-input bg-white text-xs">
              <option value="">Todos los partidos</option>
              {parties.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="number" value={filterMontoMin} onChange={(e) => setFilterMontoMin(e.target.value)} placeholder="Monto min." className="field-input text-xs" />
            <input type="number" value={filterMontoMax} onChange={(e) => setFilterMontoMax(e.target.value)} placeholder="Monto max." className="field-input text-xs" />
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="field-input text-xs" />
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="field-input text-xs" />
          </div>
        </div>

        <div className="glass-card overflow-hidden rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-variant/30 bg-surface-container-low/50 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-5 py-3">Solicitud</th>
                <th className="px-5 py-3">Partido</th>
                <th className="px-5 py-3">Monto</th>
                <th className="px-5 py-3">Serie</th>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/20">
              {filtered.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-on-surface-variant">No hay solicitudes disponibles.</td></tr>}
              {filtered.map((r) => {
                const [chipCls, chipLbl] = STATUS_CHIP[r.status] ?? ['bg-gray-100 text-gray-600 border-gray-200', r.status];
                const isExpanded = expanded === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr className={`bg-white/60 transition-colors hover:bg-primary/[0.02] ${isExpanded ? 'border-b-0' : ''}`}>
                      <td className="px-5 py-3.5">
                        <button onClick={() => setExpanded(isExpanded ? null : r.id)} className="flex items-center gap-2 font-semibold text-primary">
                          <span style={{ fontFamily: 'JetBrains Mono' }}>{r.certificate_number ?? r.id.slice(0, 8)}</span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 font-medium">{r.parties?.name ?? 'Sin dato'}</td>
                      <td className="px-5 py-3.5 font-semibold">{fmtMoney(r.face_value, r.currency)}</td>
                      <td className="px-5 py-3.5 text-on-surface-variant">{r.series ?? 'Sin dato'}</td>
                      <td className="px-5 py-3.5 text-on-surface-variant">{fmtDate(r.created_at)}</td>
                      <td className="px-5 py-3.5"><span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${chipCls}`}>{chipLbl}</span></td>
                      <td className="px-5 py-3.5 text-right">
                        {r.status === 'pendiente' && (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => approve(r.id)} disabled={busy === r.id} className={`btn-action btn-success ${busy === r.id ? 'btn-loading' : ''}`}>
                              {busy === r.id ? <><span className="btn-spinner" /> Aprobando...</> : <><CheckCircle size={13} /> Aprobar</>}
                            </button>
                            <button onClick={() => setRejectTarget(r.id)} className="btn-action btn-danger">
                              <XCircle size={13} /> Rechazar
                            </button>
                          </div>
                        )}
                        {r.status === 'rechazado' && r.rejection_reason && (
                          <span className="text-xs text-on-surface-variant">{r.rejection_reason}</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-surface-container-low/30">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                            {[
                              ['Certificado', r.certificate_number ?? 'Sin dato'],
                              ['Serie', r.series ?? 'Sin dato'],
                              ['Moneda', r.currency],
                              ['Tasa de interes', r.interest_rate != null ? `${r.interest_rate}%` : 'Sin dato'],
                              ['Fecha de emision', fmtDate(r.issue_date)],
                              ['Vencimiento', fmtDate(r.maturity_date)],
                              ['Partido', r.parties?.name ?? 'Sin dato'],
                              ['Monto', fmtMoney(r.face_value, r.currency)],
                            ].map(([lbl, val]) => (
                              <div key={lbl}>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">{lbl}</p>
                                <p className="mt-0.5 font-medium">{val}</p>
                              </div>
                            ))}
                            {r.notes && (
                              <div className="col-span-full">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Notas</p>
                                <p className="mt-0.5 text-on-surface-variant">{r.notes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-3 text-lg font-semibold">Rechazar solicitud</h3>
            <p className="mb-4 text-sm text-on-surface-variant">Ingresa el motivo del rechazo. Sera visible para el partido solicitante.</p>
            <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Motivo del rechazo..." className="field-input mb-4 resize-none" />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="btn-ghost">Cancelar</button>
              <button onClick={() => reject(rejectTarget)} disabled={busy === rejectTarget} className={`btn-action btn-danger ${busy === rejectTarget ? 'btn-loading' : ''}`}>
                {busy === rejectTarget ? <><span className="btn-spinner" /> Rechazando...</> : <><XCircle size={14} /> Rechazar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </TSEShell>
  );
}
