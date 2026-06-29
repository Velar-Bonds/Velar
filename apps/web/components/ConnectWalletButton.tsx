'use client';

import { useEffect, useRef, useState } from 'react';
import { Wallet, ChevronDown, ExternalLink, LogOut, AlertTriangle, Link2 } from 'lucide-react';
import { useWallet } from '../lib/wallet';
import { accountUrl, FREIGHTER_INSTALL_URL, shortKey } from '../lib/stellar';
import { notify } from './Toast';

type Props = {
  /** Variante visual: 'compact' para navbars/sidebars, 'full' para páginas. */
  variant?: 'compact' | 'full';
  /** Si se provee, muestra "Usar esta wallet en mi cuenta" en el menú. */
  onUseInAccount?: (publicKey: string) => void;
  /** Llave ya vinculada al perfil, para marcar el estado. */
  linkedPublicKey?: string | null;
};

export function ConnectWalletButton({ variant = 'compact', onUseInAccount, linkedPublicKey }: Props) {
  const { publicKey, isConnected, connecting, available, network, wrongNetwork, connect, disconnect } =
    useWallet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function handleConnect() {
    try {
      await connect();
    } catch (e: any) {
      if (e?.message === 'FREIGHTER_NOT_INSTALLED') {
        notify.err('Freighter no está instalado. Abrí freighter.app para instalarlo.');
        window.open(FREIGHTER_INSTALL_URL, '_blank', 'noopener,noreferrer');
      } else {
        notify.err(e?.message ?? 'No se pudo conectar la wallet');
      }
    }
  }

  // Freighter no instalado → estado claro con link de instalación (sin romper la página).
  if (available === false && !isConnected) {
    return (
      <a
        href={FREIGHTER_INSTALL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
      >
        <Wallet size={16} /> Instalar Freighter
      </a>
    );
  }

  if (!isConnected) {
    return (
      <button
        type="button"
        onClick={handleConnect}
        disabled={connecting}
        className="flex shrink-0 items-center gap-2 rounded-full border border-primary-container/30 bg-primary-container/10 px-3.5 py-2 text-sm font-semibold text-primary-container transition hover:bg-primary-container/20 disabled:opacity-60"
      >
        <Wallet size={16} />
        {connecting ? 'Conectando…' : 'Conectar wallet'}
      </button>
    );
  }

  const alreadyLinked = Boolean(linkedPublicKey && publicKey && linkedPublicKey === publicKey);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
          wrongNetwork
            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
        }`}
      >
        {wrongNetwork ? <AlertTriangle size={15} /> : <Wallet size={15} />}
        <span className="mono-data">{shortKey(publicKey, 4)}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute right-0 z-[60] mt-2 w-64 overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-xl">
          <div className="border-b border-outline-variant/20 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">Wallet conectada</p>
            <p className="mono-data mt-0.5 truncate text-sm" title={publicKey ?? ''}>{publicKey}</p>
            {wrongNetwork ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-amber-700">
                <AlertTriangle size={12} /> Red {network ?? '—'} — cambiá Freighter a TESTNET
              </p>
            ) : (
              <p className="mt-1.5 text-xs font-medium text-emerald-600">Stellar Testnet</p>
            )}
          </div>

          {onUseInAccount && publicKey && (
            <button
              type="button"
              onClick={() => { onUseInAccount(publicKey); setOpen(false); }}
              disabled={alreadyLinked}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-surface-container-low disabled:opacity-50"
            >
              <Link2 size={15} /> {alreadyLinked ? 'Vinculada a tu cuenta' : 'Usar esta wallet en mi cuenta'}
            </button>
          )}

          <a
            href={publicKey ? accountUrl(publicKey) : '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-surface-container-low"
          >
            <ExternalLink size={15} /> Ver en Stellar Expert
          </a>

          <button
            type="button"
            onClick={() => { disconnect(); setOpen(false); }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={15} /> Desconectar
          </button>
        </div>
      )}
    </div>
  );
}
