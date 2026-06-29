'use client';

import { STELLAR_DASHBOARD_URL } from '../lib/stellar';

/**
 * Badge discreto que indica que la plataforma opera sobre Stellar Testnet.
 * Enlaza al dashboard de estado de la red de Stellar.
 */
export function StellarNetworkBadge({ className = '' }: { className?: string }) {
  return (
    <a
      href={STELLAR_DASHBOARD_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Estado de la red Stellar"
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-container-low/60 px-2.5 py-1 text-[11px] font-medium text-on-surface-variant transition hover:border-primary-container/40 hover:text-primary-container ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      Stellar Testnet
    </a>
  );
}
