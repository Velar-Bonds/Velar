'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, ChevronDown, ExternalLink, LogOut, AlertTriangle, Link2 } from 'lucide-react';
import { useWallet } from '../lib/wallet';
import { accountUrl, STELLAR_WALLETS_KIT_URL, shortKey } from '../lib/stellar';
import { notify } from './Toast';

type Props = {
  variant?: 'compact' | 'full';
  onUseInAccount?: (publicKey: string) => void;
  linkedPublicKey?: string | null;
};

export function ConnectWalletButton({ onUseInAccount, linkedPublicKey }: Props) {
  const { publicKey, isConnected, connecting, available, network, wrongNetwork, connect, disconnect } =
    useWallet();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const desktop = viewportWidth >= 1024;
      const width = desktop ? 288 : Math.min(320, viewportWidth - 24);
      const gutter = 12;

      let left = desktop ? rect.right + gutter : rect.left;
      if (!desktop && left + width > viewportWidth - 12) left = viewportWidth - width - 12;
      if (desktop && left + width > viewportWidth - 12) left = Math.max(12, rect.left - width - gutter);

      let top = desktop ? rect.top : rect.bottom + 10;
      if (desktop && top + 260 > viewportHeight - 12) top = Math.max(12, viewportHeight - 272);
      if (!desktop && top + 260 > viewportHeight - 12) top = Math.max(12, rect.top - 270);

      setMenuStyle({ top, left, width });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  async function handleConnect() {
    try {
      await connect();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo conectar la wallet';
      notify.err(message);
    }
  }

  if (available === false && !isConnected) {
    return (
      <a
        href={STELLAR_WALLETS_KIT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
      >
        <Wallet size={16} /> Wallets Stellar
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
        {connecting ? 'Conectando...' : 'Conectar wallet'}
      </button>
    );
  }

  const alreadyLinked = Boolean(linkedPublicKey && publicKey && linkedPublicKey === publicKey);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        ref={buttonRef}
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

      {open && menuStyle && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[120] overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-2xl ring-1 ring-slate-950/5"
          style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }}
        >
          <div className="border-b border-outline-variant/20 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">Wallet conectada</p>
            <p className="mono-data mt-0.5 truncate text-sm" title={publicKey ?? ''}>{publicKey}</p>
            {wrongNetwork ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-amber-700">
                <AlertTriangle size={12} /> Red {network ?? '-'} - cambia tu wallet a TESTNET
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
        </div>,
        document.body,
      )}
    </div>
  );
}
