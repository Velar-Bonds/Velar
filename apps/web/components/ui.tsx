'use client';
import { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';

/** Botón "Ver en Stellar Expert" (abre en nueva pestaña). */
export function StellarExpertButton({ href, label = 'Ver en Stellar Expert', small = false }: { href: string; label?: string; small?: boolean }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-primary-container/30 font-medium text-primary-container transition hover:bg-primary-container/5 ${small ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`}>
      <ExternalLink size={small ? 13 : 15} /> {label}
    </a>
  );
}

const STATUS: Record<string, { cls: string; label: string }> = {
  activo: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Disponible' },
  en_escrow: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'En canasta' },
  congelado: { cls: 'bg-red-50 text-red-600 border-red-200', label: 'Congelado' },
  emitido: { cls: 'bg-blue-50 text-primary border-blue-200', label: 'Emitido' },
  transferido: { cls: 'bg-violet-50 text-violet-600 border-violet-200', label: 'Transferido' },
  cancelado: { cls: 'bg-gray-100 text-gray-500 border-gray-200', label: 'Cancelado' },
  // transfer states
  solicitada: { cls: 'bg-blue-50 text-primary border-blue-200', label: 'Solicitada' },
  pago_registrado: { cls: 'bg-purple-50 text-purple-600 border-purple-200', label: 'Pago registrado' },
  pago_validado: { cls: 'bg-teal-50 text-teal-600 border-teal-200', label: 'Pago validado' },
  liberada: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Completada' },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { cls: 'bg-gray-100 text-gray-600 border-gray-200', label: status };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.cls}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{s.label}</span>;
}

export function EmptyState({ icon, title, desc, action }: { icon: ReactNode; title: string; desc: string; action?: ReactNode }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container/10 text-primary-container">{icon}</div>
      <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-on-surface-variant">{desc}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const fmtMoney = (n: number | null | undefined) => (n == null ? '—' : '$' + Number(n).toLocaleString('es-CR'));
export const fmtDate = (s?: string) => (s ? new Date(s).toLocaleString('es-CR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
