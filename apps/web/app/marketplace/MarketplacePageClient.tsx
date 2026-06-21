'use client';
import { notify } from '../../components/Toast';

import { useCallback, useEffect, useState } from 'react';
import { Handshake, ShieldCheck, SlidersHorizontal, Store } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { EmptyState, fmtMoney, StatusBadge, StellarExpertButton } from '../../components/ui';
import { apiFetch } from '../../lib/api';
import { unwrapPaginated } from '../../lib/pagination';
import { bondExplorerUrl } from '../../lib/stellar';

type Bond = {
  token_id: string;
  bond_id: string;
  soroban_contract_id?: string | null;
  status: string;
  face_value: number | null;
  stellar_status?: string | null;
  stellar_issuer_public_key?: string | null;
  parties?: { code?: string; name?: string };
  profiles?: { full_name?: string };
};

type Transfer = {
  id: string;
  bond_token_id: string;
  status: string;
  amount?: number | null;
  counter_offer_amount?: number | null;
};

export default function MarketplacePageClient() {
  return <AppShell>{({ token }) => <Content token={token} />}</AppShell>;
}

function Content({ token }: { token: string }) {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [offerAmounts, setOfferAmounts] = useState<Record<string, string>>({});
  const [offerMessages, setOfferMessages] = useState<Record<string, string>>({});
  
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch(token, 'GET', '/bonds/available').then(setBonds).catch((e) => notify.err(e.message));
    apiFetch(token, 'GET', '/transfers?page=1&limit=100').then((res) => setTransfers(unwrapPaginated(res))).catch(() => undefined);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function requestPurchase(id: string, amount: number | null, message?: string) {
    setBusy(id);
    
    try {
      await apiFetch(token, 'POST', '/transfers', { bondTokenId: id, amount, message });
      notify.ok('Oferta enviada. El vendedor puede aceptar, rechazar o contraofertar.');
      load();
    } catch (e: any) {
      notify.err(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface md:text-4xl" style={{ fontFamily: 'Geist' }}>Marketplace de bonos</h1>
          <p className="mt-1 text-on-surface-variant">Explora instrumentos publicados por partidos y negocia el monto de compra.</p>
        </div>
        <button type="button" className="flex w-max items-center gap-2 rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-medium text-on-surface transition hover:border-primary-container/50"><SlidersHorizontal size={16} /> Filtros</button>
      </div>


      {bonds.length === 0 ? (
        <EmptyState icon={<Store size={26} />} title="No hay bonos en venta" desc="Cuando un partido publique bonos aprobados, apareceran aca." />
      ) : (
        <div className="velar-stagger grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {bonds.map((bond) => {
            const currentTransfer = transfers.find((transfer) =>
              transfer.bond_token_id === bond.token_id &&
              !['rechazada', 'cancelada', 'liberada'].includes(transfer.status)
            );
            const offerValue = offerAmounts[bond.token_id] ?? '';
            const offerAmount = Number(offerValue);
            const issuer = bond.stellar_issuer_public_key;

            return (
              <div key={bond.token_id} className="velar-hover-card glass-card group relative overflow-hidden rounded-2xl p-6">
                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary-container to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-primary-container"><ShieldCheck size={20} /></span>
                    <div>
                      <div className="mono-data text-sm font-semibold text-primary-container">{bond.bond_id}</div>
                      <h3 className="mt-0.5 font-bold text-on-surface">{bond.parties?.name ?? 'Bono politico'}</h3>
                    </div>
                  </div>
                  <StatusBadge status={bond.status} />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Precio solicitado</div>
                    <div className="mono-data text-xl font-bold text-on-surface">{fmtMoney(bond.face_value)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Vendedor</div>
                    <div className="truncate text-sm font-medium text-on-surface">{bond.profiles?.full_name ?? '-'}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3 py-2 text-xs text-on-surface-variant">
                  Stellar: <span className="font-semibold text-on-surface">{bond.stellar_status ?? 'pending'}</span>
                </div>

                {currentTransfer && (
                  <div className="mt-3 rounded-xl border border-primary-container/20 bg-primary-container/5 px-3 py-2 text-xs text-on-surface-variant">
                    Tu oferta: <span className="font-semibold text-on-surface">{currentTransfer.status}</span>
                    {currentTransfer.amount ? ` · ${fmtMoney(currentTransfer.amount)}` : ''}
                    {currentTransfer.counter_offer_amount ? ` · contraoferta ${fmtMoney(currentTransfer.counter_offer_amount)}` : ''}
                  </div>
                )}

                <div className="mt-5 space-y-3 border-t border-outline-variant/20 pt-4">
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      type="number"
                      min="1"
                      value={offerValue}
                      onChange={(event) => setOfferAmounts((prev) => ({ ...prev, [bond.token_id]: event.target.value }))}
                      placeholder="Monto de oferta"
                      aria-label={`Monto de oferta para ${bond.bond_id}`}
                      className="velar-input rounded-xl border px-3 py-2 text-sm outline-none"
                      disabled={!!currentTransfer}
                    />
                    <button
                      type="button"
                      onClick={() => requestPurchase(bond.token_id, offerAmount, offerMessages[bond.token_id])}
                      disabled={busy === bond.token_id || !!currentTransfer || !Number.isFinite(offerAmount) || offerAmount <= 0}
                      className={`btn-ghost ${busy === bond.token_id ? 'btn-loading' : ''}`}
                    >
                      {busy === bond.token_id ? <span className="btn-spinner" /> : <><Handshake size={14} /> Negociar</>}
                    </button>
                  </div>
                  <input
                    value={offerMessages[bond.token_id] ?? ''}
                    onChange={(event) => setOfferMessages((prev) => ({ ...prev, [bond.token_id]: event.target.value }))}
                    placeholder="Mensaje opcional"
                    aria-label={`Mensaje opcional para ${bond.bond_id}`}
                    className="velar-input w-full rounded-xl border px-3 py-2 text-sm outline-none"
                    disabled={!!currentTransfer}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => requestPurchase(bond.token_id, bond.face_value ?? null)}
                      disabled={busy === bond.token_id || !!currentTransfer}
                      className={`btn-action btn-lg btn-block ${busy === bond.token_id ? 'btn-loading' : ''}`}
                    >
                      {busy === bond.token_id ? <span className="btn-spinner" /> : 'Comprar al precio'}
                    </button>
                    <StellarExpertButton href={bondExplorerUrl(bond.soroban_contract_id, bond.bond_id)} label="Stellar" small />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
