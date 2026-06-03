'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const fmt = (n: number | null | undefined) => (n == null ? '—' : '$' + Number(n).toLocaleString('es-CR'));

const nav = [
  { icon: 'dashboard', label: 'Dashboard', active: true },
  { icon: 'inventory_2', label: 'Mis bonos' },
  { icon: 'payments', label: 'Ventas' },
  { icon: 'account_tree', label: 'Trazabilidad' },
  { icon: 'history', label: 'Historial' },
  { icon: 'settings', label: 'Configuración' },
];

export default function PartidoPage() {
  const router = useRouter();
  const supabase = createClient();
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);
  const [bonds, setBonds] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  async function api(method: string, path: string, tok: string, body?: any) {
    const r = await fetch(API_URL + path, { method, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.message ?? 'Error');
    return j;
  }
  async function load(tok: string) {
    try {
      const [meRes, bs, trs] = await Promise.all([api('GET', '/users/me', tok), api('GET', '/bonds', tok).catch(() => []), api('GET', '/transfers', tok).catch(() => [])]);
      setMe(meRes); setBonds(bs); setTransfers(trs);
    } catch (e: any) { setMsg(e.message); }
  }
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const t = data.session?.access_token;
      if (!t) { router.push('/login'); return; }
      setToken(t); load(t);
    });
  }, []);
  async function act(id: string, action: string) {
    if (!token) return;
    try { await api('PATCH', `/transfers/${id}/${action}`, token); setMsg(`✅ ${action}`); load(token); }
    catch (e: any) { setMsg('⚠️ ' + e.message); }
  }

  const isParty = me && me.id;
  const requests = transfers.filter((t) => t.from_owner === me?.id);
  const ventas = requests.filter((t) => t.status === 'liberada');
  const ingresos = ventas.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const enVenta = bonds.filter((b) => b.status === 'activo');

  const reqChip: any = {
    solicitada: ['bg-blue-50 text-primary border-blue-100', 'bg-primary', 'Solicitada'],
    en_escrow: ['bg-amber-50 text-amber-700 border-amber-100', 'bg-amber-500', 'En canasta'],
    pago_registrado: ['bg-purple-50 text-purple-600 border-purple-100', 'bg-purple-600', 'Pago registrado'],
    liberada: ['bg-emerald-50 text-emerald-600 border-emerald-100', 'bg-emerald-600', 'Vendido'],
  };
  const actionFor = (t: any) => {
    if (t.status === 'solicitada') return ['Aceptar venta', 'accept'];
    if (t.status === 'pago_registrado') return ['Confirmar pago', 'release'];
    return null;
  };

  return (
    <div className="flex min-h-screen bg-background text-on-background" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 z-50 flex h-screen w-[240px] flex-col items-center border-r border-outline-variant bg-white py-6 shadow-sm">
        <div className="mb-6 flex w-full justify-center px-6">
          <div className="flex items-center gap-2"><svg width="30" height="30" viewBox="0 0 44 44" fill="none"><path d="M9 10 L22 33 L35 10" stroke="#155EEF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /></svg><span className="text-xl font-bold tracking-tight text-primary" style={{ fontFamily: 'Geist' }}>VELAR</span></div>
        </div>
        <div className="flex w-full flex-col gap-2 px-2">
          {nav.map((n) => (
            <a key={n.label} href="#" className={`relative flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${n.active ? 'bg-primary-container/10 text-primary' : 'text-on-surface-variant hover:bg-primary-container/10 hover:text-primary'}`}>
              {n.active && <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />}
              <span className="material-symbols-outlined" style={n.active ? { fontVariationSettings: "'FILL' 1" } : {}}>{n.icon}</span><span className="font-medium">{n.label}</span>
            </a>
          ))}
        </div>
        <div className="mt-auto flex w-full px-2 pt-6">
          <div className="mx-2 flex w-full items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{(me?.full_name ?? 'PA').slice(0, 2).toUpperCase()}</div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[12px] font-bold uppercase tracking-wider text-on-surface">{me?.full_name ?? 'Partido'}</span>
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Verified Node</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative ml-[240px] flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-outline-variant/30 bg-surface/70 px-10 shadow-sm backdrop-blur-xl">
          <h1 className="text-3xl font-bold tracking-tight text-on-background" style={{ fontFamily: 'Geist' }}>Panel del Partido</h1>
          <div className="flex items-center gap-4 text-on-surface-variant">
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="flex items-center gap-2 text-sm hover:text-primary"><span className="material-symbols-outlined">logout</span> Salir</button>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 p-10 pb-20">
          {msg && <div className="rounded-xl border border-[#D5E3FF] bg-white px-4 py-2 text-sm">{msg}</div>}

          {/* Metrics */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['Solicitudes de compra', requests.filter((t) => t.status === 'solicitada').length, 'description', 'text-primary'],
              ['Bonos a mi nombre', bonds.length, 'account_balance', 'text-emerald-600'],
              ['Ventas completadas', ventas.length, 'local_offer', 'text-purple-600'],
              ['Ingresos generados', fmt(ingresos), 'attach_money', 'text-emerald-600'],
            ].map(([label, val, icon, color], i) => (
              <div key={label as string} className={`rounded-2xl p-6 ${i === 3 ? 'glass-card border-t-[1.5px] border-t-primary-container' : 'glass-card'}`} style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}>
                <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">{label}</p>
                <div className="mt-1 flex items-center gap-2"><span className={`material-symbols-outlined text-[24px] ${color}`}>{icon}</span><h2 className="text-[22px] font-bold leading-tight text-on-background">{val}</h2></div>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              <div className="glass-card flex flex-col gap-6 rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.7)' }}>
                <h3 className="text-2xl font-semibold" style={{ fontFamily: 'Geist' }}>Solicitudes de compra</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead><tr className="border-b border-outline-variant/20 text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
                      <th className="pb-3">Bono</th><th className="pb-3">Comprador</th><th className="pb-3">Estado</th><th className="pb-3 text-right">Acción</th>
                    </tr></thead>
                    <tbody className="text-sm">
                      {requests.filter((t) => t.status !== 'liberada' && t.status !== 'cancelada').length === 0 && (
                        <tr><td colSpan={4} className="py-6 text-center text-on-surface-variant">No hay solicitudes pendientes.</td></tr>
                      )}
                      {requests.filter((t) => t.status !== 'liberada' && t.status !== 'cancelada').map((t) => {
                        const chip = reqChip[t.status] ?? ['bg-gray-100 text-gray-600 border-gray-200', 'bg-gray-400', t.status];
                        const a = actionFor(t);
                        return (
                          <tr key={t.id} className="border-b border-outline-variant/10 transition-colors hover:bg-surface-container-low/50">
                            <td className="py-4 font-medium text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{t.bonds?.bond_id ?? '—'}</td>
                            <td className="py-4 text-on-surface-variant">{t.to_profile?.full_name ?? '—'}</td>
                            <td className="py-4"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium ${chip[0]}`}><span className={`h-1.5 w-1.5 rounded-full ${chip[1]}`} />{chip[2]}</span></td>
                            <td className="py-4 text-right">{a ? <button onClick={() => act(t.id, a[1])} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90">{a[0]}</button> : <span className="text-xs text-on-surface-variant">—</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass-card flex flex-col gap-6 rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.7)' }}>
                <h3 className="text-2xl font-semibold" style={{ fontFamily: 'Geist' }}>Mis bonos en venta</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead><tr className="border-b border-outline-variant/20 text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
                      <th className="pb-3">ID del bono</th><th className="pb-3">Valor</th><th className="pb-3">Estado</th>
                    </tr></thead>
                    <tbody className="text-sm">
                      {bonds.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-on-surface-variant">El TSE aún no te emitió bonos.</td></tr>}
                      {bonds.map((b) => (
                        <tr key={b.token_id} className="border-b border-outline-variant/10 transition-colors hover:bg-surface-container-low/50">
                          <td className="py-4 font-medium text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{b.bond_id}</td>
                          <td className="py-4 font-semibold">{fmt(b.face_value)}</td>
                          <td className="py-4"><span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">{b.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-col gap-6">
              <div className="glass-card flex flex-1 flex-col gap-4 rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.7)' }}>
                <h3 className="text-2xl font-semibold" style={{ fontFamily: 'Geist' }}>Actividad reciente</h3>
                <div className="relative mt-2 flex flex-col">
                  <div className="absolute bottom-4 left-[19px] top-4 -z-10 w-0.5 bg-outline-variant/30" />
                  {transfers.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex gap-4 py-3">
                      <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-primary"><span className="material-symbols-outlined text-[20px]">swap_horiz</span></div>
                      <div className="flex flex-1 items-start justify-between pt-1">
                        <div><p className="text-sm font-medium text-on-surface">{t.bonds?.bond_id ?? 'Bono'} · {t.status}</p><p className="mt-0.5 text-xs text-on-surface-variant">{t.from_profile?.full_name ?? '?'} → {t.to_profile?.full_name ?? '?'}</p></div>
                      </div>
                    </div>
                  ))}
                  {transfers.length === 0 && <div className="text-sm text-on-surface-variant">Sin actividad todavía.</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
