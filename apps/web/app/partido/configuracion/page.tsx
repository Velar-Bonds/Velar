'use client';
import { Settings, User, Wallet, Bell } from 'lucide-react';
import { PartidoShell } from '../../../components/PartidoShell';
import { useSession } from '../../../lib/api';

export default function PartidoConfiguracionPage() {
  const { token, me, loading, error } = useSession();

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  return (
    <PartidoShell me={me}>
      <header className="sticky top-0 z-40 flex h-20 items-center border-b border-outline-variant/30 bg-surface/70 px-10 shadow-sm backdrop-blur-xl">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Geist' }}>Configuración</h1>
      </header>

      <div className="mx-auto w-full max-w-[700px] p-10 pb-20">
        <div className="flex flex-col gap-4">
          {[
            { Icon: User, title: 'Perfil del partido', desc: 'Nombre, representante legal, documentos registrales.' },
            { Icon: Wallet, title: 'Wallet Stellar', desc: me.stellar_wallet ? `Wallet: ${me.stellar_wallet.slice(0, 10)}…` : 'No configurada todavía.' },
            { Icon: Bell, title: 'Notificaciones', desc: 'Alertas de solicitudes aprobadas, ventas y pagos.' },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="glass-card flex items-center gap-4 rounded-2xl p-5 opacity-70">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon size={20} /></span>
              <div className="flex-1">
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-on-surface-variant">{desc}</p>
              </div>
              <span className="rounded-lg border border-outline-variant/40 px-3 py-1 text-xs text-on-surface-variant">Próximamente</span>
            </div>
          ))}
        </div>
      </div>
    </PartidoShell>
  );
}
