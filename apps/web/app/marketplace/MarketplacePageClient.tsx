'use client';
import { notify } from '../../components/Toast';

import { useCallback, useEffect, useState } from 'react';
import { Handshake, ShieldCheck, SlidersHorizontal, Store, Smartphone, Landmark, Wallet } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { EmptyState, StatusBadge, StellarExpertButton } from '../../components/ui';
import { apiFetch } from '../../lib/api';
import { unwrapPaginated } from '../../lib/pagination';
import { bondExplorerUrl } from '../../lib/stellar';
import { useCountry } from '../../lib/country';
import { useWallet } from '../../lib/wallet';

type Bond = {
  token_id: string;
  bond_id: string;
  soroban_contract_id?: string | null;
  status: string;
  face_value: number | null;
  stellar_status?: string | null;
  stellar_issuer_public_key?: string | null;
  payment_methods?: string[] | null;
  parties?: { code?: string; name?: string };
  profiles?: { full_name?: string };
};

const METHOD_BADGE: Record<string, { label: string; Icon: any }> = {
  sinpe: { label: 'SINPE', Icon: Smartphone },
  transferencia: { label: 'Transferencia', Icon: Landmark },
  wallet: { label: 'Wallet · USDC', Icon: Wallet },
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
  const { country, profile, money } = useCountry();
  const wallet = useWallet();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [offerAmounts, setOfferAmounts] = useState<Record<string, string>>({});
  const [offerMessages, setOfferMessages] = useState<Record<string, string>>({});

  const [busy, setBusy] = useState<string | null>(null);
  const [walletBusy, setWalletBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    // Mercado segmentado por jurisdicción: solo bonos del país activo.
    apiFetch(token, 'GET', `/bonds/available?country=${country}`).then(setBonds).catch((e) => notify.err(e.message));
    apiFetch(token, 'GET', '/transfers?page=1&limit=100').then((res) => setTransfers(unwrapPaginated(res))).catch(() => undefined);
  }, [token, country]);

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

  /**
   * COMPRA INSTANTÁNEA (pago con wallet/USDC): construye el XDR atómico en el
   * backend, lo firma con Freighter y lo somete. El bono se libera al comprador
   * en la misma transacción en que el vendedor recibe el USDC.
   */
  async function pagarConWallet(bondTokenId: string) {
    if (!wallet.isConnected) {
      try { await wallet.connect(); }
      catch { notify.err('Conectá tu wallet Freighter (testnet) para pagar con wallet.'); return; }
    }
    if (wallet.wrongNetwork) { notify.err('Cambiá tu Freighter a la red TESTNET.'); return; }
    setWalletBusy(bondTokenId);
    try {
      const built: any = await apiFetch(token, 'POST', `/transfers/instant-buy/${bondTokenId}/build-xdr`);
      const signed = await wallet.signXdr(built.xdr);
      const res: any = await apiFetch(token, 'POST', `/transfers/instant-buy/${bondTokenId}/submit-xdr`, { signedXdr: signed });
      notify.tx(res?.txHash, `Compra liquidada: pagaste ${built.usdcAmount} USDC y recibiste el bono.`);
      load();
    } catch (e: any) {
      notify.txError(e.message);
    } finally {
      setWalletBusy(null);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface md:text-4xl" style={{ fontFamily: 'Geist' }}>
            Marketplace · {profile.flag} {profile.name}
          </h1>
          <p className="mt-1 text-on-surface-variant">
            {profile.instrument.labelPlural} supervisados por {profile.authority.code}. Precios en {profile.currency.code}.
          </p>
        </div>
        <button type="button" className="flex w-max items-center gap-2 rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm font-medium text-on-surface transition hover:border-primary-container/50"><SlidersHorizontal size={16} /> Filtros</button>
      </div>

      {/* Contexto de la jurisdicción activa + regla de compliance */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/40 px-4 py-3 text-sm">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary-container" />
        <p className="text-on-surface-variant">
          <span className="font-semibold text-on-surface">{profile.authority.name}.</span>{' '}
          {profile.context}{' '}
          <span className="font-medium text-on-surface">Solo cuentas de {profile.name} pueden comprar — el financiamiento político extranjero está bloqueado por diseño.</span>
        </p>
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
            const methods = bond.payment_methods ?? [];
            const acceptsWallet = methods.includes('wallet');
            // Bonos legacy (sin métodos definidos) mantienen el flujo P2P.
            const acceptsP2P = methods.length === 0 || methods.some((m) => m === 'sinpe' || m === 'transferencia');

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
                    <div className="mono-data text-xl font-bold text-on-surface">{money(bond.face_value)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Vendedor</div>
                    <div className="truncate text-sm font-medium text-on-surface">{bond.profiles?.full_name ?? '-'}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-3 py-2 text-xs text-on-surface-variant">
                  Stellar: <span className="font-semibold text-on-surface">{bond.stellar_status ?? 'pending'}</span>
                </div>

                {methods.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">Acepta:</span>
                    {methods.map((m) => {
                      const meta = METHOD_BADGE[m];
                      if (!meta) return null;
                      const Icon = meta.Icon;
                      return (
                        <span key={m} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${m === 'wallet' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-outline-variant/40 bg-surface-container-low text-on-surface-variant'}`}>
                          <Icon size={11} /> {meta.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {currentTransfer && (
                  <div className="mt-3 rounded-xl border border-primary-container/20 bg-primary-container/5 px-3 py-2 text-xs text-on-surface-variant">
                    Tu oferta: <span className="font-semibold text-on-surface">{currentTransfer.status}</span>
                    {currentTransfer.amount ? ` · ${money(currentTransfer.amount)}` : ''}
                    {currentTransfer.counter_offer_amount ? ` · contraoferta ${money(currentTransfer.counter_offer_amount)}` : ''}
                  </div>
                )}

                <div className="mt-5 space-y-3 border-t border-outline-variant/20 pt-4">
                  {acceptsP2P && (
                    <>
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
                    </>
                  )}

                  {acceptsWallet && (
                    <button
                      type="button"
                      onClick={() => pagarConWallet(bond.token_id)}
                      disabled={walletBusy === bond.token_id || !!currentTransfer}
                      className={`btn-action btn-lg btn-block bg-violet-600 hover:bg-violet-700 ${walletBusy === bond.token_id ? 'btn-loading' : ''}`}
                      title="Pago atómico on-chain: el bono se libera al recibirse el USDC"
                    >
                      {walletBusy === bond.token_id ? <span className="btn-spinner" /> : <><Wallet size={14} /> Pagar con wallet (USDC)</>}
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    {acceptsP2P && (
                      <button
                        type="button"
                        onClick={() => requestPurchase(bond.token_id, bond.face_value ?? null)}
                        disabled={busy === bond.token_id || !!currentTransfer}
                        className={`btn-action btn-lg btn-block ${busy === bond.token_id ? 'btn-loading' : ''}`}
                      >
                        {busy === bond.token_id ? <span className="btn-spinner" /> : 'Comprar al precio'}
                      </button>
                    )}
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
