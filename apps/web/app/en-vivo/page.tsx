'use client';
import { useEffect, useState } from 'react';
import { Radio, Activity, ExternalLink } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { StatusBadge, EmptyState, fmtDate } from '../../components/ui';
import { apiFetch } from '../../lib/api';
import { unwrapPaginated } from '../../lib/pagination';
import { stellarExpert } from '../../lib/stellar';

type Transfer = { id: string; status: string; created_at?: string; bonds?: { bond_id?: string }; from_profile?: { full_name?: string }; to_profile?: { full_name?: string } };

export default function EnVivoPage() {
  return <AppShell>{({ token }) => <Content token={token} />}</AppShell>;
}

function Content({ token }: { token: string }) {
  const [items, setItems] = useState<Transfer[]>([]);

  const load = () => apiFetch(token, 'GET', '/transfers?page=1&limit=30').then((res) => setItems(unwrapPaginated(res))).catch(() => {});
  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); /* eslint-disable-next-line */ }, []);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight md:text-4xl" style={{ fontFamily: 'Geist' }}>
            En vivo <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></span>
          </h1>
          <p className="mt-1 text-on-surface-variant">Actividad reciente y últimas transacciones de la red.</p>
        </div>
        <a href={stellarExpert.network()} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-lg border border-primary-container/30 px-3 py-1.5 text-sm font-medium text-primary-container transition hover:bg-primary-container/5 sm:flex"> Red en Stellar Expert</a>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<Radio size={26} />} title="Sin actividad por ahora" desc="Las transacciones y movimientos aparecerán acá en tiempo real." />
      ) : (
        <div className="velar-stagger flex flex-col gap-3">
          {items.map((t) => (
            <div key={t.id} className="velar-hover-card glass-card flex items-center justify-between gap-4 rounded-2xl p-4">
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/10 text-primary-container"><Activity size={18} /></span>
                <div>
                  <div className="text-sm font-semibold">{t.bonds?.bond_id ?? 'Bono'} · {t.from_profile?.full_name ?? '?'}  a  {t.to_profile?.full_name ?? '?'}</div>
                  <div className="text-xs text-on-surface-variant">{fmtDate(t.created_at)}</div>
                </div>
              </div>
              <StatusBadge status={t.status} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
