'use client';
import { useEffect, useState } from 'react';
import { History, ArrowRight } from 'lucide-react';
import { PartidoShell } from '../../../components/PartidoShell';
import { useSession, apiFetch } from '../../../lib/api';

type Transfer = {
  id: string; status: string; created_at?: string; amount: number | null;
  bonds?: { bond_id?: string };
  from_profile?: { full_name?: string }; to_profile?: { full_name?: string };
};

const fmt = (n: number | null | undefined) => n == null ? '' : '₡' + Number(n).toLocaleString('es-CR');
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) : ':';

export default function PartidoHistorialPage() {
  const { token, me, loading, error } = useSession();
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  useEffect(() => {
    if (token) apiFetch(token, 'GET', '/transfers').then(setTransfers).catch(() => {});
    /* eslint-disable-next-line */
  }, [token]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const all = transfers.filter((t) => (t as any).from_owner === me.id || (t as any).to_owner === me.id)
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));

  return (
    <PartidoShell me={me}>
      <header className="sticky top-0 z-40 flex h-20 items-center border-b border-outline-variant/30 bg-surface/70 px-10 shadow-sm backdrop-blur-xl">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Geist' }}>Historial</h1>
      </header>

      <div className="mx-auto w-full max-w-[1000px] p-10 pb-20">
        {all.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-outline-variant/40 py-20 text-center">
            <History size={36} className="text-outline" />
            <p className="font-semibold">Sin historial todavía</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-outline-variant/30 bg-surface-container-low/60 text-[11px] uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3">Bono</th>
                  <th className="px-5 py-3">Movimiento</th>
                  <th className="px-5 py-3">Monto</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {all.map((t) => (
                  <tr key={t.id} className="hover:bg-primary/[0.02]">
                    <td className="px-5 py-3.5 font-semibold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{t.bonds?.bond_id ?? 'Sin dato'}</td>
                    <td className="px-5 py-3.5 text-on-surface-variant">
                      <span className="flex items-center gap-1">{t.from_profile?.full_name ?? '?'}  {t.to_profile?.full_name ?? '?'}</span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold">{fmt(t.amount)}</td>
                    <td className="px-5 py-3.5"><span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] text-on-surface-variant">{t.status}</span></td>
                    <td className="px-5 py-3.5 text-on-surface-variant">{fmtDate(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PartidoShell>
  );
}
