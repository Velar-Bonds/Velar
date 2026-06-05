'use client';
import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, Boxes, ShoppingCart } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { StellarExpertButton, StatusBadge, EmptyState, fmtMoney } from '../../components/ui';
import { apiFetch } from '../../lib/api';
import { bondAssetUrl } from '../../lib/stellar';

type Bond = { token_id: string; bond_id: string; status: string; face_value: number | null; parties?: { name?: string }; created_at?: string };

export default function MisBonosPage() {
  return <AppShell>{({ token }) => <Content token={token} />}</AppShell>;
}

function Content({ token }: { token: string }) {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const load = () => apiFetch(token, 'GET', '/bonds').then(setBonds).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function publicar(tokenId: string) {
    setBusy(tokenId); setMsg('');
    try { await apiFetch(token, 'PATCH', `/bonds/${tokenId}/publish`); setMsg('✅ Bono publicado en el marketplace.'); load(); }
    catch (e: any) { setMsg('⚠️ ' + e.message); } finally { setBusy(null); }
  }

  const total = bonds.reduce((s, b) => s + (Number(b.face_value) || 0), 0);
  const activos = bonds.filter((b) => b.status === 'activo').length;

  const stats = [
    ['Bonos en cartera', bonds.length, <Boxes size={20} key="a" />],
    ['Valor total', fmtMoney(total), <Wallet size={20} key="b" />],
    ['Disponibles', activos, <TrendingUp size={20} key="c" />],
  ] as const;

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold tracking-tight md:text-4xl" style={{ fontFamily: 'Geist' }}>Mis bonos</h1>
      <p className="mb-6 text-on-surface-variant">Los bonos que poseés, con su estado y verificación on-chain.</p>
      {msg && <div className="mb-4 rounded-xl border border-[#d8e2f5] bg-white px-4 py-2.5 text-sm">{msg}</div>}

      <div className="velar-stagger mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(([label, val, icon]) => (
          <div key={label} className="glass-card flex items-center gap-4 rounded-2xl p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container/10 text-primary-container">{icon}</span>
            <div><p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">{label}</p><p className="text-2xl font-bold">{val}</p></div>
          </div>
        ))}
      </div>

      {bonds.length === 0 ? (
        <EmptyState icon={<Wallet size={26} />} title="Todavía no tenés bonos" desc="Cuando compres un bono en el marketplace o el TSE te asigne uno, aparecerá acá." />
      ) : (
        <div className="glass-card overflow-hidden rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-outline-variant/30 bg-surface-container-low/60 text-[11px] uppercase tracking-wide text-on-surface-variant">
              <tr><th className="px-5 py-3">Bono</th><th className="px-5 py-3">Emisor</th><th className="px-5 py-3">Valor</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {bonds.map((b) => {
                const canPublish = ['activo', 'aprobado', 'emitido'].includes(b.status);
                return (
                  <tr key={b.token_id} className="transition-colors hover:bg-primary-container/[0.03]">
                    <td className="px-5 py-3 mono-data font-semibold text-primary-container">{b.bond_id}</td>
                    <td className="px-5 py-3">{b.parties?.name ?? '—'}</td>
                    <td className="px-5 py-3 mono-data font-semibold">{fmtMoney(b.face_value)}</td>
                    <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canPublish && (
                          <button onClick={() => publicar(b.token_id)} disabled={busy === b.token_id}
                            className={`btn-action ${busy === b.token_id ? 'btn-loading' : ''}`}>
                            {busy === b.token_id ? <><span className="btn-spinner" /> Publicando…</> : <><ShoppingCart size={12} /> Publicar</>}
                          </button>
                        )}
                        <StellarExpertButton href={bondAssetUrl(b.bond_id)} label="Stellar" small />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
