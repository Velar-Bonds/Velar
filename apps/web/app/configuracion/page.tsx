'use client';
import { useEffect, useState } from 'react';
import { User, Wallet, ShieldCheck, LogOut, ExternalLink } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { apiFetch, type Me } from '../../lib/api';
import { stellarExpert, shortKey } from '../../lib/stellar';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ConfiguracionPage() {
  return <AppShell>{({ token, me }) => <Content token={token} me={me} />}</AppShell>;
}

function Content({ token, me }: { token: string; me: Me }) {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState(me.full_name ?? '');
  const [wallet, setWallet] = useState(me.stellar_wallet ?? '');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true); setMsg('');
    try { await apiFetch(token, 'PATCH', '/users/me', { full_name: fullName, stellar_wallet: wallet }); setMsg('✅ Cambios guardados'); }
    catch (e: any) { setMsg('⚠️ ' + e.message); } finally { setSaving(false); }
  }

  const Card = ({ icon, title, children }: any) => (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/10 text-primary-container">{icon}</span><h2 className="text-lg font-semibold">{title}</h2></div>
      {children}
    </div>
  );
  const input = 'velar-input mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none';

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold tracking-tight md:text-4xl" style={{ fontFamily: 'Geist' }}>Configuración</h1>
      <p className="mb-6 text-on-surface-variant">Tu perfil, wallet y seguridad.</p>
      {msg && <div className="mb-4 rounded-xl border border-[#d8e2f5] bg-white px-4 py-2.5 text-sm">{msg}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card icon={<User size={20} />} title="Perfil">
          <div className="space-y-4">
            <label className="block text-sm"><span className="font-medium text-on-surface-variant">Nombre</span><input className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} /></label>
            <label className="block text-sm"><span className="font-medium text-on-surface-variant">Email</span><input className={`${input} opacity-60`} value={me.email} disabled /></label>
            <div className="flex items-center gap-2 text-sm"><span className="font-medium text-on-surface-variant">Rol:</span><span className="rounded-full bg-primary-container/10 px-2.5 py-1 text-xs font-semibold capitalize text-primary-container">{me.role}</span></div>
            <button onClick={save} disabled={saving} className="velar-primary-button rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60">{saving ? 'Guardando…' : 'Guardar cambios'}</button>
          </div>
        </Card>

        <Card icon={<Wallet size={20} />} title="Wallet conectada">
          <div className="space-y-4">
            <label className="block text-sm"><span className="font-medium text-on-surface-variant">Dirección Stellar (custodia)</span><input className={`${input} mono-data`} value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="G…" /></label>
            {me.stellar_wallet
              ? <div className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-4 py-3"><span className="mono-data text-sm">{shortKey(me.stellar_wallet, 6)}</span><a href={stellarExpert.account(me.stellar_wallet)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-container hover:underline"><ExternalLink size={15} /> Ver en Stellar Expert</a></div>
              : <p className="text-sm text-on-surface-variant">Aún no tenés wallet asignada.</p>}
          </div>
        </Card>

        <Card icon={<ShieldCheck size={20} />} title="Seguridad">
          <p className="text-sm text-on-surface-variant">Tu sesión está protegida con autenticación de Supabase. Las llaves de la wallet se manejan en custodia segura del backend.</p>
        </Card>

        <Card icon={<LogOut size={20} />} title="Sesión">
          <button onClick={async () => { await supabase.auth.signOut(); router.replace('/login'); }} className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"><LogOut size={16} /> Cerrar sesión</button>
        </Card>
      </div>
    </>
  );
}
