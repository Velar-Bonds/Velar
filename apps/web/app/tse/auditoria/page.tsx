'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, ArrowRightLeft, Send, FileText, Shield } from 'lucide-react';
import { TSEShell } from '../../../components/TSEShell';
import { PaginationControls } from '../../../components/PaginationControls';
import { useSession, apiFetch } from '../../../lib/api';
import { paginatedQuery, paginationMeta, unwrapPaginated } from '../../../lib/pagination';

const ICON_MAP: Record<string, any> = {
  bond_aprobado: CheckCircle, bond_emitido: Send, transfer: ArrowRightLeft,
  solicitud: FileText, hash_sync: Shield,
};
const COLOR_MAP: Record<string, string> = {
  bond_aprobado: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  bond_emitido: 'text-primary bg-primary/10 border-blue-100',
  transfer: 'text-purple-600 bg-purple-50 border-purple-100',
  solicitud: 'text-amber-600 bg-amber-50 border-amber-100',
  hash_sync: 'text-blue-500 bg-blue-50 border-blue-100',
};

const fmtDate = (s: string) => new Date(s).toLocaleString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AuditoriaPage() {
  const { token, me, loading, error } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [filterParty, setFilterParty] = useState('');

  useEffect(() => {
    if (!token) return;
    apiFetch(token, 'GET', `/audit/events?${paginatedQuery(page, limit)}`)
      .then((res) => {
        setEvents(unwrapPaginated(res));
        setTotal(paginationMeta(res).total);
      })
      .catch(() => {});
  }, [token, page, limit]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const parties = Array.from(new Set(events.map((e) => e.party ?? e.actor_id).filter(Boolean)));
  const types = [
    { value: 'bond_aprobado', label: 'Aprobaciones' },
    { value: 'bond_emitido', label: 'Emisiones' },
    { value: 'transfer', label: 'Transferencias' },
    { value: 'solicitud', label: 'Solicitudes' },
  ];

  const filtered = events.filter((e) => {
    if (filterType && e.type !== filterType) return false;
    if (filterParty && (e.party ?? e.actor_id) !== filterParty) return false;
    return true;
  });

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Auditoría</h1>
          <p className="text-sm text-on-surface-variant">Registro de todos los eventos del sistema</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1000px] p-8 pb-20">
        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-3">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="field-input w-auto bg-white text-xs">
            <option value="">Todos los tipos</option>
            {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={filterParty} onChange={(e) => setFilterParty(e.target.value)} className="field-input w-auto bg-white text-xs">
            <option value="">Todos los partidos</option>
            {parties.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {(filterType || filterParty) && (
            <button onClick={() => { setFilterType(''); setFilterParty(''); setPage(1); }} className="rounded-xl border border-outline-variant/40 px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container-low">
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="border-b border-surface-variant/30 bg-surface-container-low/40 px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
            {filtered.length} evento{filtered.length !== 1 ? 's' : ''} en esta página · {total} en total
          </div>
          <div className="divide-y divide-surface-variant/20">
            {filtered.map((ev) => {
              const Icon = ICON_MAP[ev.type] ?? FileText;
              const color = COLOR_MAP[ev.type] ?? 'text-gray-600 bg-gray-50 border-gray-100';
              const label = ev.label ?? ev.type;
              const detail = ev.detail ?? (ev.payload ? JSON.stringify(ev.payload).slice(0, 80) : '');
              const party = ev.party ?? ev.actor_id ?? '';
              const hash = ev.tx_hash ?? ev.hash ?? null;
              const ts = ev.ts ?? ev.created_at ?? '';
              return (
                <div key={ev.id} className="flex items-start gap-4 bg-white/50 px-6 py-4 transition-colors hover:bg-primary/[0.02]">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${color}`}>
                    <Icon size={16} strokeWidth={2.1} />
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold">{label}</p>
                      <span className="text-xs text-on-surface-variant">{ts ? fmtDate(ts) : ''}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant">{detail}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      {party && <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">{party}</span>}
                      {hash && <span className="font-mono text-[11px] text-on-surface-variant">{String(hash).slice(0, 16)}…</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="py-10 text-center text-sm text-on-surface-variant">Sin eventos registrados.</p>}
          </div>
          <PaginationControls page={page} limit={limit} total={total} onPageChange={setPage} />
        </div>
      </div>
    </TSEShell>
  );
}
