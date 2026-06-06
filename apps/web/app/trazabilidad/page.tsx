'use client';
import { useEffect, useState } from 'react';
import { GitBranch, ArrowRight, Boxes } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { StellarExpertButton, StatusBadge, EmptyState, fmtDate } from '../../components/ui';
import { apiFetch } from '../../lib/api';
import { bondExplorerUrl } from '../../lib/stellar';

type Bond = { token_id: string; bond_id: string; status: string };
type Transfer = { id: string; status: string; bond_token_id: string; created_at?: string; from_profile?: { full_name?: string }; to_profile?: { full_name?: string } };

export default function TrazabilidadPage() {
  return <AppShell>{({ token }) => <Content token={token} />}</AppShell>;
}

function Content({ token }: { token: string }) {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch(token, 'GET', '/bonds').catch(() => []),
      apiFetch(token, 'GET', '/transfers').catch(() => []),
    ]).then(([b, t]) => { setBonds(b); setTransfers(t); if (b[0]) setSel(b[0].token_id); });
    /* eslint-disable-next-line */
  }, []);

  const bond = bonds.find((b) => b.token_id === sel);
  const movs = transfers.filter((t) => t.bond_token_id === sel).sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold tracking-tight md:text-4xl" style={{ fontFamily: 'Geist' }}>Trazabilidad</h1>
      <p className="mb-6 text-on-surface-variant">Historial de cada bono en la blockchain: movimientos, dueños, fechas y verificación on-chain.</p>

      {bonds.length === 0 ? (
        <EmptyState icon={<GitBranch size={26} />} title="Sin bonos para rastrear" desc="Cuando tengas bonos, vas a poder ver su recorrido completo en la blockchain." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* lista de bonos */}
          <div className="lg:col-span-4">
            <div className="glass-card velar-stagger flex flex-col gap-1 rounded-2xl p-2">
              {bonds.map((b) => (
                <button key={b.token_id} onClick={() => setSel(b.token_id)} className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition ${sel === b.token_id ? 'bg-primary-container/10' : 'hover:bg-surface-container-low'}`}>
                  <span className="flex items-center gap-3"><Boxes size={18} className="text-primary-container" /><span className="mono-data text-sm font-semibold">{b.bond_id}</span></span>
                  <StatusBadge status={b.status} />
                </button>
              ))}
            </div>
          </div>

          {/* timeline */}
          <div className="lg:col-span-8">
            <div className="glass-card rounded-2xl p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div><div className="text-xs uppercase tracking-wide text-on-surface-variant">Bono</div><div className="mono-data text-lg font-bold text-primary-container">{bond?.bond_id}</div></div>
                {bond && <StellarExpertButton href={bondExplorerUrl(bond.soroban_contract_id, bond.bond_id)} label="Ver transacciones en Stellar Expert" />}
              </div>

              {movs.length === 0 ? (
                <p className="py-8 text-center text-sm text-on-surface-variant">Este bono todavía no tiene transferencias registradas.</p>
              ) : (
                <div className="relative space-y-5 before:absolute before:bottom-2 before:left-[18px] before:top-2 before:w-0.5 before:bg-outline-variant/40">
                  {movs.map((t) => (
                    <div key={t.id} className="relative flex gap-4">
                      <span className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary-container/20 bg-primary-container/10 text-primary-container"><ArrowRight size={16} /></span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-semibold">{t.from_profile?.full_name ?? '—'} <span className="text-on-surface-variant mx-1">a</span> {t.to_profile?.full_name ?? '—'}</div>
                          <span className="text-xs text-on-surface-variant">{fmtDate(t.created_at)}</span>
                        </div>
                        <div className="mt-1"><StatusBadge status={t.status} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
