'use client';

import { Bell, ExternalLink, User, Wallet } from 'lucide-react';
import { PartidoShell } from '../../../components/PartidoShell';
import { useSession } from '../../../lib/api';
import { shortKey, stellarExpert } from '../../../lib/stellar';

export default function PartidoConfiguracionPage() {
  const { token, me, loading, error } = useSession();

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const partyWallet = me.parties?.stellar_wallet ?? me.stellar_wallet;
  const partyWalletStatus = me.parties?.stellar_wallet_status ?? me.stellar_wallet_status ?? 'pending';
  const partyNetwork = me.parties?.stellar_network ?? me.stellar_network ?? 'testnet';
  const partyCreatedAt = me.parties?.stellar_created_at ?? me.stellar_created_at;
  const partyError = me.parties?.stellar_wallet_error ?? me.stellar_wallet_error;

  return (
    <PartidoShell me={me}>
      <header className="sticky top-0 z-40 flex h-20 items-center border-b border-outline-variant/30 bg-surface/70 px-10 shadow-sm backdrop-blur-xl">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Geist' }}>Configuracion</h1>
      </header>

      <div className="mx-auto w-full max-w-[760px] p-10 pb-20">
        <div className="flex flex-col gap-4">
          <div className="glass-card flex items-center gap-4 rounded-2xl p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><User size={20} /></span>
            <div className="flex-1">
              <p className="font-semibold">Perfil del partido</p>
              <p className="text-sm text-on-surface-variant">Nombre, representante legal y documentos registrales.</p>
            </div>
          </div>

          <section className="glass-card rounded-2xl p-5">
            <div className="mb-4 flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Wallet size={20} /></span>
              <div>
                <p className="font-semibold">Wallet Stellar</p>
                <p className="text-sm text-on-surface-variant">Cuenta publica de custodia del partido.</p>
              </div>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Estado</p>
                <p className="mt-1 font-medium">{partyWalletStatus}</p>
              </div>
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Red</p>
                <p className="mt-1 font-medium">{partyNetwork}</p>
              </div>
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-4 py-3 sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Public key</p>
                <p className="mono-data mt-1 break-all text-sm">{partyWallet ?? 'Pendiente de asignacion'}</p>
              </div>
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Creada</p>
                <p className="mt-1 font-medium">{partyCreatedAt ? new Date(partyCreatedAt).toLocaleString('es-CR') : '-'}</p>
              </div>
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Explorador</p>
                {partyWallet ? (
                  <a href={stellarExpert.account(partyWallet)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 font-medium text-primary-container hover:underline">
                    {shortKey(partyWallet, 6)} <ExternalLink size={14} />
                  </a>
                ) : (
                  <p className="mt-1 text-on-surface-variant">No disponible</p>
                )}
              </div>
            </div>
            {partyError && <p className="mt-3 text-sm text-red-600">{partyError}</p>}
          </section>

          <div className="glass-card flex items-center gap-4 rounded-2xl p-5 opacity-70">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Bell size={20} /></span>
            <div className="flex-1">
              <p className="font-semibold">Notificaciones</p>
              <p className="text-sm text-on-surface-variant">Alertas de solicitudes aprobadas, ventas y pagos.</p>
            </div>
            <span className="rounded-lg border border-outline-variant/40 px-3 py-1 text-xs text-on-surface-variant">Proximamente</span>
          </div>
        </div>
      </div>
    </PartidoShell>
  );
}
