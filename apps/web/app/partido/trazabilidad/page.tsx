'use client';
import { useEffect, useState } from 'react';
import { Waypoints, ArrowRight, ExternalLink, User } from 'lucide-react';
import { PartidoShell } from '../../../components/PartidoShell';
import { useSession, apiFetch } from '../../../lib/api';
import { unwrapPaginated } from '../../../lib/pagination';
import { bondExplorerUrl } from '../../../lib/stellar';

type Bond = { token_id: string; bond_id: string; status: string; face_value: number | null; soroban_contract_id?: string | null };
type Transfer = {
  id: string; status: string; bond_token_id: string; created_at?: string;
  from_profile?: { full_name?: string }; to_profile?: { full_name?: string };
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmt = (n: number | null | undefined) => n == null ? '—' : '₡' + Number(n).toLocaleString('es-CR');

const STATUS_COLOR: Record<string, string> = {
  solicitada: 'bg-blue-100 text-primary',
  liberada: 'bg-emerald-100 text-emerald-700',
  cancelada: 'bg-gray-100 text-gray-500',
  en_escrow: 'bg-amber-100 text-amber-700',
  pago_registrado: 'bg-purple-100 text-purple-700',
};

export default function PartidoTrazabilidadPage() {
  const { token, me, loading, error } = useSession();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch(token, 'GET', '/bonds?page=1&limit=100').catch(() => []),
      apiFetch(token, 'GET', '/transfers?page=1&limit=100').catch(() => []),
    ]).then(([bs, trs]) => {
      const bonds = unwrapPaginated<Bond>(bs);
      setBonds(bonds);
      setTransfers(unwrapPaginated<Transfer>(trs));
      if (bonds[0]) setSel(bonds[0].token_id);
    });
    /* eslint-disable-next-line */
  }, [token]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const bond = bonds.find((b) => b.token_id === sel);
  const movs = transfers
    .filter((t) => t.bond_token_id === sel)
    .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));

  // El dueño actual viene de la BD (bond.profiles.full_name), fallback al último mov liberado
  const currentOwner = (bond as any)?.profiles?.full_name
    ?? movs.filter((t) => t.status === 'liberada').at(-1)?.to_profile?.full_name
    ?? '—';

  return (
    <PartidoShell me={me}>
      <header className="sticky top-0 z-40 flex h-20 items-center border-b border-outline-variant/30 bg-surface/70 px-10 shadow-sm backdrop-blur-xl">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Geist' }}>Trazabilidad</h1>
      </header>

      <div className="mx-auto w-full max-w-[1200px] p-10 pb-20">
        {bonds.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-outline-variant/40 py-20 text-center">
            <Waypoints size={36} className="text-outline" />
            <p className="font-semibold">Sin bonos para rastrear</p>
            <p className="text-sm text-on-surface-variant">Cuando tengas bonos aprobados, vas a poder ver su historial completo acá.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Lista de bonos */}
            <div className="lg:col-span-4">
              <div className="glass-card flex flex-col gap-1 rounded-2xl p-2">
                {bonds.map((b) => (
                  <button key={b.token_id} onClick={() => setSel(b.token_id)}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition ${sel === b.token_id ? 'bg-primary/10' : 'hover:bg-surface-container-low'}`}>
                    <div>
                      <p className="text-sm font-semibold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{b.bond_id}</p>
                      <p className="text-xs text-on-surface-variant">{fmt(b.face_value)}</p>
                    </div>
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] text-on-surface-variant">{b.status}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="lg:col-span-8">
              <div className="glass-card rounded-2xl p-6">
                {bond && (
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-on-surface-variant">Bono seleccionado</p>
                      <p className="text-xl font-bold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{bond.bond_id}</p>
                      <p className="text-sm text-on-surface-variant">Valor: {fmt(bond.face_value)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-on-surface-variant">Dueño actual</p>
                      <p className="flex items-center justify-end gap-1.5 text-sm font-semibold"><User size={14} /> {currentOwner}</p>
                    </div>
                  </div>
                )}

                {bond && (
                  <a href={bondExplorerUrl(bond.soroban_contract_id, bond.bond_id)} target="_blank" rel="noopener noreferrer"
                    className="mb-5 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs font-medium text-primary transition hover:bg-blue-100">
                    <ExternalLink size={13} /> Ver transacciones en Stellar Expert
                  </a>
                )}

                {movs.length === 0 ? (
                  <p className="py-8 text-center text-sm text-on-surface-variant">Este bono todavía no tiene transferencias registradas.</p>
                ) : (
                  <div className="relative space-y-5 before:absolute before:bottom-2 before:left-[18px] before:top-2 before:w-0.5 before:bg-outline-variant/40">
                    {movs.map((t) => {
                      const colorCls = STATUS_COLOR[t.status] ?? 'bg-gray-100 text-gray-500';
                      return (
                        <div key={t.id} className="relative flex gap-4">
                          <span className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${colorCls}`}>
                            <ArrowRight size={15} />
                          </span>
                          <div className="flex-1 rounded-xl border border-outline-variant/20 bg-white p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold">
                                {t.from_profile?.full_name ?? '—'} <span className="text-on-surface-variant mx-1">a</span> {t.to_profile?.full_name ?? '—'}
                              </p>
                              <span className="text-xs text-on-surface-variant">{fmtDate(t.created_at)}</span>
                            </div>
                            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${colorCls}`}>{t.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PartidoShell>
  );
}
