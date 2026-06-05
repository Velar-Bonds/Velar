'use client';
import { useEffect, useState } from 'react';
import { Store, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { StellarExpertButton, StatusBadge, EmptyState, fmtMoney } from '../../components/ui';
import { apiFetch } from '../../lib/api';
import { stellarExpert } from '../../lib/stellar';

const ISSUER = 'GDJMYOQUSNS4LWVENGQYFFUULNEYAGJBOIGAVENSRY3GI3S2P2HW2VK5';
const assetCode = (bondId: string) => bondId.replace(/[^A-Za-z0-9]/g, '').slice(0, 12) || 'BOND';

type Bond = { token_id: string; bond_id: string; status: string; face_value: number | null; parties?: { code?: string; name?: string }; profiles?: { full_name?: string } };

export default function MarketplacePageClient() {
  return <AppShell>{({ token }) => <Content token={token} />}</AppShell>;
}

function Content({ token }: { token: string }) {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => apiFetch(token, 'GET', '/bonds/available').then(setBonds).catch((e) => setMsg(e.message));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function comprar(id: string) {
    setBusy(id); setMsg('');
    try { await apiFetch(token, 'POST', '/transfers', { bondTokenId: id, amount: 0 }); setMsg('✅ Solicitud enviada. El dueño debe aceptar.'); load(); }
    catch (e: any) { setMsg('⚠️ ' + e.message); } finally { setBusy(null); }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface md:text-4xl" style={{ fontFamily: 'Geist' }}>Marketplace de bonos</h1>
          <p className="mt-1 text-on-surface-variant">Explorá y comprá instrumentos de deuda institucional con trazabilidad verificable.</p>
        </div>
        <button className="flex w-max items-center gap-2 rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-medium text-on-surface transition hover:border-primary-container/50"><SlidersHorizontal size={16} /> Filtros</button>
      </div>

      {msg && <div className="mb-4 rounded-xl border border-[#d8e2f5] bg-white px-4 py-2.5 text-sm">{msg}</div>}

      {bonds.length === 0 ? (
        <EmptyState icon={<Store size={26} />} title="No hay bonos en venta" desc="Cuando un partido ponga bonos a la venta, aparecerán acá para que los compres." />
      ) : (
        <div className="velar-stagger grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {bonds.map((b) => (
            <div key={b.token_id} className="velar-hover-card glass-card group relative overflow-hidden rounded-2xl p-6">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary-container to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-primary-container"><ShieldCheck size={20} /></span>
                  <div><div className="mono-data text-sm font-semibold text-primary-container">{b.bond_id}</div><h3 className="mt-0.5 font-bold text-on-surface">{b.parties?.name ?? 'Bono político'}</h3></div>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div><div className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Valor</div><div className="mono-data text-xl font-bold text-on-surface">{fmtMoney(b.face_value)}</div></div>
                <div><div className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Vendedor</div><div className="truncate text-sm font-medium text-on-surface">{b.profiles?.full_name ?? '—'}</div></div>
              </div>
              <div className="mt-5 flex items-center gap-2 border-t border-outline-variant/20 pt-4">
                <button onClick={() => comprar(b.token_id)} disabled={busy === b.token_id} className="velar-primary-button flex flex-1 items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-60">{busy === b.token_id ? 'Enviando…' : 'Comprar'}</button>
                <StellarExpertButton href={stellarExpert.asset(assetCode(b.bond_id), ISSUER)} label="Stellar" small />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
