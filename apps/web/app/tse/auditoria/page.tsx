'use client';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Send, FileText, Shield } from 'lucide-react';
import { TSEShell } from '../../../components/TSEShell';
import { useSession, apiFetch } from '../../../lib/api';

const iconByType: Record<string, any> = {
  bond_emitido: Send,
  bond_asignado: CheckCircle,
  transfer_solicitada: FileText,
  escrow_bloqueado: Shield,
  pago_registrado: FileText,
  pago_validado: CheckCircle,
  token_liberado: CheckCircle,
  transfer_rechazada: Shield,
  transfer_cancelada: Shield,
  bond_congelado: Shield,
  bond_descongelado: CheckCircle,
};

const colorByType: Record<string, string> = {
  bond_emitido: 'text-primary bg-primary/10 border-blue-100',
  bond_asignado: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  transfer_solicitada: 'text-amber-600 bg-amber-50 border-amber-100',
  escrow_bloqueado: 'text-blue-500 bg-blue-50 border-blue-100',
  pago_registrado: 'text-blue-500 bg-blue-50 border-blue-100',
  pago_validado: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  token_liberado: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  transfer_rechazada: 'text-red-600 bg-red-50 border-red-100',
  transfer_cancelada: 'text-red-600 bg-red-50 border-red-100',
  bond_congelado: 'text-red-600 bg-red-50 border-red-100',
  bond_descongelado: 'text-emerald-600 bg-emerald-50 border-emerald-100',
};

const labelByType: Record<string, string> = {
  bond_emitido: 'Bono emitido',
  bond_asignado: 'Bono asignado',
  transfer_solicitada: 'Transferencia solicitada',
  escrow_bloqueado: 'Escrow bloqueado',
  pago_registrado: 'Pago registrado',
  pago_validado: 'Pago validado',
  token_liberado: 'Token liberado',
  transfer_rechazada: 'Transferencia rechazada',
  transfer_cancelada: 'Transferencia cancelada',
  bond_congelado: 'Bono congelado',
  bond_descongelado: 'Bono descongelado',
};

const fmtDate = (s: string) => new Date(s).toLocaleString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AuditoriaPage() {
  const { token, me, loading, error } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [loadError, setLoadError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBond, setFilterBond] = useState('');

  useEffect(() => {
    if (!token) return;
    apiFetch(token, 'GET', '/audit/events?limit=200')
      .then((data) => {
        setLoadError('');
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch((e: any) => {
        setEvents([]);
        setLoadError(e.message ?? 'No se pudieron cargar los eventos de auditoria.');
      });
  }, [token]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const types = useMemo(() => Array.from(new Set(events.map((e) => e.type))).sort(), [events]);
  const filtered = events.filter((e) => {
    if (filterType && e.type !== filterType) return false;
    if (filterBond && !(e.bonds?.bond_id ?? '').toLowerCase().includes(filterBond.toLowerCase())) return false;
    return true;
  });

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Auditoria</h1>
          <p className="text-sm text-on-surface-variant">Eventos reales del sistema registrados en auditoria.</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1000px] p-8 pb-20">
        {loadError && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}

        <div className="mb-6 flex flex-wrap gap-3">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="field-input w-auto bg-white text-xs">
            <option value="">Todos los tipos</option>
            {types.map((t) => <option key={t} value={t}>{labelByType[t] ?? t}</option>)}
          </select>
          <input value={filterBond} onChange={(e) => setFilterBond(e.target.value)} placeholder="Buscar bono..." className="field-input w-auto bg-white text-xs" />
          {(filterType || filterBond) && (
            <button onClick={() => { setFilterType(''); setFilterBond(''); }} className="rounded-xl border border-outline-variant/40 px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container-low">
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="border-b border-surface-variant/30 bg-surface-container-low/40 px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
            {filtered.length} evento{filtered.length !== 1 ? 's' : ''}
          </div>
          <div className="divide-y divide-surface-variant/20">
            {filtered.map((ev) => {
              const Icon = iconByType[ev.type] ?? Shield;
              return (
                <div key={ev.id} className="flex items-start gap-4 bg-white/50 px-6 py-4 transition-colors hover:bg-primary/[0.02]">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${colorByType[ev.type] ?? 'text-slate-600 bg-slate-50 border-slate-100'}`}>
                    <Icon size={16} strokeWidth={2.1} />
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold">{labelByType[ev.type] ?? ev.type}</p>
                      <span className="text-xs text-on-surface-variant">{fmtDate(ev.created_at)}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant">{ev.bonds?.bond_id ?? 'Evento del sistema'}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      {ev.profiles?.full_name && <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">{ev.profiles.full_name}</span>}
                      {ev.tx_hash && <span className="font-mono text-[11px] text-on-surface-variant">{ev.tx_hash}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="py-10 text-center text-sm text-on-surface-variant">No se encontraron eventos de auditoria.</p>}
          </div>
        </div>
      </div>
    </TSEShell>
  );
}
