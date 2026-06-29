'use client';

import { useCallback, useEffect, useState } from 'react';
import { Coins, RefreshCw, Droplet } from 'lucide-react';
import { useWallet } from '../lib/wallet';
import { HORIZON_URL, FRIENDBOT_URL, PLATFORM_ISSUER } from '../lib/stellar';
import { notify } from './Toast';

type HorizonBalance = {
  balance: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
};

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; balances: HorizonBalance[] }
  | { status: 'not_funded' }
  | { status: 'error'; message: string };

function label(b: HorizonBalance): string {
  if (b.asset_type === 'native') return 'XLM';
  return b.asset_code ?? 'Asset';
}

function fmt(n: string): string {
  const v = Number(n);
  return Number.isFinite(v) ? v.toLocaleString('es-CR', { maximumFractionDigits: 7 }) : n;
}

export function WalletBalances() {
  const { publicKey, isConnected } = useWallet();
  const [state, setState] = useState<LoadState>({ status: 'idle' });
  const [funding, setFunding] = useState(false);

  const load = useCallback(async (pk: string) => {
    setState({ status: 'loading' });
    try {
      const res = await fetch(`${HORIZON_URL}/accounts/${pk}`);
      if (res.status === 404) {
        setState({ status: 'not_funded' });
        return;
      }
      if (!res.ok) {
        setState({ status: 'error', message: `Horizon respondió ${res.status}` });
        return;
      }
      const json = (await res.json()) as { balances?: HorizonBalance[] };
      setState({ status: 'ok', balances: json.balances ?? [] });
    } catch {
      setState({ status: 'error', message: 'No se pudo conectar con Horizon (testnet)' });
    }
  }, []);

  useEffect(() => {
    if (isConnected && publicKey) load(publicKey);
    else setState({ status: 'idle' });
  }, [isConnected, publicKey, load]);

  async function fundWithFriendbot() {
    if (!publicKey) return;
    setFunding(true);
    try {
      const res = await fetch(`${FRIENDBOT_URL}/?addr=${encodeURIComponent(publicKey)}`);
      if (!res.ok) throw new Error(`Friendbot respondió ${res.status}`);
      notify.ok('Cuenta fondeada en testnet con XLM de prueba.');
      await load(publicKey);
    } catch (e: any) {
      notify.err(e?.message ?? 'No se pudo fondear la cuenta');
    } finally {
      setFunding(false);
    }
  }

  if (!isConnected || !publicKey) return null;

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-on-surface">
          <Coins size={16} className="text-primary-container" /> Balances on-chain
        </p>
        <button
          type="button"
          onClick={() => load(publicKey)}
          className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant transition hover:text-primary-container"
        >
          <RefreshCw size={13} className={state.status === 'loading' ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {state.status === 'loading' && (
        <p className="text-sm text-on-surface-variant">Leyendo de Horizon testnet…</p>
      )}

      {state.status === 'error' && <p className="text-sm text-red-600">{state.message}</p>}

      {state.status === 'not_funded' && (
        <div className="space-y-3">
          <p className="text-sm text-on-surface-variant">
            Esta cuenta todavía no está fondeada en testnet. Fondeala con Friendbot para activarla.
          </p>
          <button
            type="button"
            onClick={fundWithFriendbot}
            disabled={funding}
            className="flex items-center gap-2 rounded-xl border border-primary-container/30 bg-primary-container/10 px-4 py-2 text-sm font-semibold text-primary-container transition hover:bg-primary-container/20 disabled:opacity-60"
          >
            <Droplet size={15} /> {funding ? 'Fondeando…' : 'Fondear en testnet (Friendbot)'}
          </button>
        </div>
      )}

      {state.status === 'ok' && (
        <ul className="divide-y divide-outline-variant/20">
          {state.balances.map((b, i) => {
            const isVcrc = b.asset_code === 'VCRC' && b.asset_issuer === PLATFORM_ISSUER;
            return (
              <li key={`${label(b)}-${i}`} className="flex items-center justify-between py-2 text-sm">
                <span className="flex items-center gap-2 font-medium">
                  {label(b)}
                  {isVcrc && (
                    <span className="rounded-full bg-primary-container/10 px-2 py-0.5 text-[10px] font-semibold text-primary-container">
                      emisor VELAR
                    </span>
                  )}
                </span>
                <span className="mono-data">{fmt(b.balance)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
