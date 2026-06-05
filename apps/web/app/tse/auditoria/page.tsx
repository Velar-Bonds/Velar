'use client';
import { useState } from 'react';
import { CheckCircle, ArrowRightLeft, Send, FileText, Shield } from 'lucide-react';
import { TSEShell } from '../../../components/TSEShell';
import { useSession } from '../../../lib/api';

const EVENTS = [
  { id: 'e1', type: 'bond_aprobado', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'Bono aprobado', detail: 'SOL-2026-001 aprobado por TSE Admin', party: 'Partido Aurora', ts: '2026-05-20T09:20:00Z', hash: '0xa3b1c…d49f' },
  { id: 'e2', type: 'hash_sync', icon: Shield, color: 'text-blue-500 bg-blue-50 border-blue-100', label: 'Hash sincronizado', detail: 'TX-8F3A…7021 sincronizado en la red', party: 'Sistema', ts: '2026-05-19T10:05:00Z', hash: '0xf21e9…8c3a' },
  { id: 'e3', type: 'bond_emitido', icon: Send, color: 'text-primary bg-primary/10 border-blue-100', label: 'Bono emitido', detail: 'SOL-2026-003 emitido a Movimiento Verde', party: 'Movimiento Verde', ts: '2026-03-10T16:32:00Z', hash: '0xb7d2a…1f5c' },
  { id: 'e4', type: 'transfer', icon: ArrowRightLeft, color: 'text-purple-600 bg-purple-50 border-purple-100', label: 'Transferencia liberada', detail: 'SOL-2026-002: Partido Aurora → María González', party: 'Partido Aurora', ts: '2026-02-15T10:05:00Z', hash: '0x9c4f8…e72b' },
  { id: 'e5', type: 'bond_aprobado', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'Bono aprobado', detail: 'SOL-2026-002 aprobado por TSE Admin', party: 'Partido Aurora', ts: '2026-01-31T15:20:00Z', hash: '0x3e8d1…7a90' },
  { id: 'e6', type: 'solicitud', icon: FileText, color: 'text-amber-600 bg-amber-50 border-amber-100', label: 'Solicitud recibida', detail: 'CERT-REQ-003 recibida de Frente Nacional', party: 'Frente Nacional', ts: '2026-01-20T11:02:00Z', hash: null },
];

const fmtDate = (s: string) => new Date(s).toLocaleString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AuditoriaPage() {
  const { token, me, loading, error } = useSession();
  const [filterType, setFilterType] = useState('');
  const [filterParty, setFilterParty] = useState('');

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const parties = Array.from(new Set(EVENTS.map((e) => e.party)));
  const types = [
    { value: 'bond_aprobado', label: 'Aprobaciones' },
    { value: 'bond_emitido', label: 'Emisiones' },
    { value: 'transfer', label: 'Transferencias' },
    { value: 'solicitud', label: 'Solicitudes' },
    { value: 'hash_sync', label: 'Hash sync' },
  ];

  const filtered = EVENTS.filter((e) => {
    if (filterType && e.type !== filterType) return false;
    if (filterParty && e.party !== filterParty) return false;
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
            <button onClick={() => { setFilterType(''); setFilterParty(''); }} className="rounded-xl border border-outline-variant/40 px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container-low">
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
              const Icon = ev.icon;
              return (
                <div key={ev.id} className="flex items-start gap-4 bg-white/50 px-6 py-4 transition-colors hover:bg-primary/[0.02]">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${ev.color}`}>
                    <Icon size={16} strokeWidth={2.1} />
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold">{ev.label}</p>
                      <span className="text-xs text-on-surface-variant">{fmtDate(ev.ts)}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant">{ev.detail}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">{ev.party}</span>
                      {ev.hash && <span className="font-mono text-[11px] text-on-surface-variant">{ev.hash}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="py-10 text-center text-sm text-on-surface-variant">Sin eventos con estos filtros.</p>}
          </div>
        </div>
      </div>
    </TSEShell>
  );
}
