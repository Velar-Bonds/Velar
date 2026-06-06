'use client';
import { notify } from '../../components/Toast';

import { ReactNode, useState } from 'react';
import { ExternalLink, LogOut, ShieldCheck, User, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/AppShell';
import { apiFetch, type Me } from '../../lib/api';
import { shortKey, stellarExpert } from '../../lib/stellar';
import { createClient } from '../../lib/supabase/client';

function SettingsCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/10 text-primary-container">{icon}</span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function ConfiguracionPage() {
  return <AppShell>{({ token, me }) => <Content token={token} me={me} />}</AppShell>;
}

function Content({ token, me }: { token: string; me: Me }) {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState(me.full_name ?? '');
  
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    
    try {
      await apiFetch(token, 'PATCH', '/users/me', { full_name: fullName });
      notify.ok('Cambios guardados');
    } catch (e: any) {
      notify.err(e.message);
    } finally {
      setSaving(false);
    }
  }

  const input = 'velar-input mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none';

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold tracking-tight md:text-4xl" style={{ fontFamily: 'Geist' }}>Configuracion</h1>
      <p className="mb-6 text-on-surface-variant">Tu perfil, wallet y seguridad.</p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SettingsCard icon={<User size={20} />} title="Perfil">
          <div className="space-y-4">
            <label className="block text-sm"><span className="font-medium text-on-surface-variant">Nombre</span><input className={input} value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
            <label className="block text-sm"><span className="font-medium text-on-surface-variant">Email</span><input className={`${input} opacity-60`} value={me.email} disabled readOnly /></label>
            <div className="flex items-center gap-2 text-sm"><span className="font-medium text-on-surface-variant">Rol:</span><span className="rounded-full bg-primary-container/10 px-2.5 py-1 text-xs font-semibold capitalize text-primary-container">{me.role}</span></div>
            <button type="button" onClick={save} disabled={saving} className="velar-primary-button rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
          </div>
        </SettingsCard>

        <SettingsCard icon={<Wallet size={20} />} title="Wallet Stellar">
          <div className="space-y-4">
            <div className="block text-sm">
              <span className="font-medium text-on-surface-variant">Direccion publica</span>
              <div className={`${input} mono-data bg-surface-container-low/60 text-on-surface-variant`}>{me.stellar_wallet ?? 'Pendiente de asignacion'}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-on-surface-variant">Estado</span><p className="mt-1">{me.stellar_wallet_status ?? 'pending'}</p></div>
              <div><span className="font-medium text-on-surface-variant">Red</span><p className="mt-1">{me.stellar_network ?? 'testnet'}</p></div>
            </div>
            {me.stellar_wallet ? (
              <div className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-4 py-3">
                <span className="mono-data text-sm">{shortKey(me.stellar_wallet, 6)}</span>
                <a href={stellarExpert.account(me.stellar_wallet)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-container hover:underline"> Ver en Stellar Expert</a>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">La wallet se crea automaticamente del lado servidor.</p>
            )}
            {me.stellar_wallet_error && <p className="text-sm text-red-600">{me.stellar_wallet_error}</p>}
          </div>
        </SettingsCard>

        <SettingsCard icon={<ShieldCheck size={20} />} title="Seguridad">
          <p className="text-sm text-on-surface-variant">Las llaves secretas de Stellar se manejan solo en el backend. El frontend nunca recibe ni guarda secret keys.</p>
        </SettingsCard>

        <SettingsCard icon={<LogOut size={20} />} title="Sesion">
          <button type="button" onClick={async () => { await supabase.auth.signOut(); router.replace('/login'); }} className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"><LogOut size={16} /> Cerrar sesion</button>
        </SettingsCard>
      </div>
    </>
  );
}
