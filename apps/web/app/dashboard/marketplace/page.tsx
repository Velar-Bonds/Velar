'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const fmt = (n: number | null | undefined) => (n == null ? '—' : '$' + Number(n).toLocaleString('es-CR'));
const initials = (name?: string) => (name ?? '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

type Bond = {
  token_id: string; bond_id: string; status: string; face_value: number | null;
  parties?: { code?: string; name?: string }; profiles?: { full_name?: string };
};

const tabs = [
  { icon: 'shopping_bag', label: 'Marketplace', active: true },
  { icon: 'account_balance_wallet', label: 'Mis bonos' },
  { icon: 'handshake', label: 'Negociaciones' },
  { icon: 'history', label: 'Trazabilidad' },
  { icon: 'sensors', label: 'Eventos en vivo' },
];

export default function MarketplacePage() {
  const router = useRouter();
  const supabase = createClient();
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);
  const [available, setAvailable] = useState<Bond[]>([]);
  const [myBonds, setMyBonds] = useState<Bond[]>([]);
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
      const [meRes, avail, mine, trs] = await Promise.all([
        api('GET', '/users/me', tok), api('GET', '/bonds/available', tok).catch(() => []),
        api('GET', '/bonds', tok).catch(() => []), api('GET', '/transfers', tok).catch(() => []),
      ]);
      setMe(meRes); setAvailable(avail); setMyBonds(mine); setTransfers(trs);
    } catch (e: any) { setMsg(e.message); }
  }
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const t = data.session?.access_token;
      if (!t) { router.push('/login'); return; }
      setToken(t); load(t);
    });
  }, []);
  async function comprar(id: string) {
    if (!token) return;
    try { await api('POST', '/transfers', token, { bondTokenId: id, amount: 0 }); setMsg('✅ Solicitud de compra enviada.'); load(token); }
    catch (e: any) { setMsg('⚠️ ' + e.message); }
  }

  const valorCartera = myBonds.reduce((s, b) => s + (Number(b.face_value) || 0), 0);
  const enNeg = transfers.filter((t) => ['solicitada', 'aceptada', 'en_escrow', 'pago_registrado', 'pago_validado'].includes(t.status));
  const evIcon: any = { solicitada: 'send', aceptada: 'handshake', en_escrow: 'lock', pago_registrado: 'payments', liberada: 'check_circle' };

  return (
    <div className="min-h-screen bg-[#FAFCFF] text-on-surface" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top nav */}
      <header className="glass-nav fixed top-0 z-50 w-full border-b border-outline-variant/20" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 md:px-10">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-primary-container to-blue-400 shadow-sm"><span className="material-symbols-outlined text-xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>view_in_ar</span></div>
            <span className="text-[24px] font-bold leading-none tracking-tighter text-on-surface" style={{ fontFamily: 'Geist' }}>VELAR</span>
          </div>
          <div className="mx-8 hidden max-w-2xl flex-1 md:block">
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input className="block w-full rounded-full border border-outline-variant/40 bg-white/50 py-2 pl-10 pr-3 text-sm placeholder-outline focus:border-primary-container focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-container" placeholder="Buscar bonos, emisores, IDs, transacciones…" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-primary-container/5 hover:text-primary-container"><span className="material-symbols-outlined">notifications</span><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-error" /></button>
            <div className="mx-1 hidden h-6 w-px bg-outline-variant/30 sm:block" />
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="flex items-center gap-3 rounded-full border border-transparent p-1.5 transition-colors hover:border-outline-variant/20 hover:bg-surface-container-low">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-xs text-white">{initials(me?.full_name)}</div>
              <span className="hidden text-sm font-medium text-on-surface md:block">{me?.full_name ?? '…'}</span>
              <span className="material-symbols-outlined hidden text-sm text-on-surface-variant md:block">logout</span>
            </button>
          </div>
        </div>
        <div className="hidden border-t border-outline-variant/20 bg-white/50 md:block">
          <div className="mx-auto flex h-12 max-w-[1440px] items-center justify-center gap-8 px-10">
            {tabs.map((t) => (
              <a key={t.label} href="#" className={`flex h-full items-center gap-2 border-b-2 pb-[2px] transition-colors ${t.active ? 'border-primary-container font-bold text-primary-container' : 'border-transparent text-on-surface-variant hover:border-outline-variant/30 hover:text-primary-container'}`}>
                <span className="material-symbols-outlined text-xl">{t.icon}</span><span className="text-sm font-medium">{t.label}</span>
              </a>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-6 px-4 pb-24 pt-[140px] md:px-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-on-surface" style={{ fontFamily: 'Geist' }}>Marketplace de bonos</h1>
          <p className="mt-1 text-on-surface-variant">Explore y negocie instrumentos de deuda institucional con transparencia radical.</p>
        </div>
        {msg && <div className="rounded-xl border border-[#D5E3FF] bg-white px-4 py-2 text-sm">{msg}</div>}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left: filters + cards */}
          <div className="space-y-6 lg:col-span-8">
            <div className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-xl p-3">
              <div className="flex flex-wrap items-center gap-2">
                {['Estado', 'Valor', 'Tipo', 'Riesgo', 'Emisor'].map((f) => (
                  <button key={f} className="flex items-center gap-2 rounded-lg border border-outline-variant/40 bg-white px-3 py-1.5 text-sm font-medium text-on-surface transition-colors hover:border-primary-container/50 hover:bg-surface-container-low">
                    <span className="text-on-surface-variant">{f}</span> Todos<span className="material-symbols-outlined text-sm text-outline">expand_more</span>
                  </button>
                ))}
                <button className="flex items-center gap-2 rounded-lg border border-outline-variant/40 bg-white px-3 py-1.5 text-sm font-medium text-primary-container">Más filtros <span className="material-symbols-outlined text-sm">filter_list</span></button>
              </div>
              <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low">Ordenar: <span className="font-semibold text-on-surface">Más recientes</span><span className="material-symbols-outlined text-sm">expand_more</span></button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {available.length === 0 && <div className="glass-card col-span-2 rounded-2xl p-8 text-center text-sm text-on-surface-variant">No hay bonos en venta ahora mismo.</div>}
              {available.map((b) => (
                <div key={b.token_id} className="group glass-card relative space-y-5 overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_24px_48px_rgba(21,94,239,0.08)]">
                  <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary-container to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-primary-container"><span className="material-symbols-outlined">description</span></div>
                      <div><div className="text-sm font-semibold text-primary-container" style={{ fontFamily: 'JetBrains Mono' }}>{b.bond_id}</div><h3 className="mt-0.5 font-bold text-on-surface">{b.parties?.name ?? 'Bono político'}</h3></div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-md border border-green-100 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700"><div className="h-1.5 w-1.5 rounded-full bg-green-500" /> Disponible</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Precio</div><div className="text-xl font-bold text-on-surface">{fmt(b.face_value)}</div></div>
                    <div><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Vendedor</div><div className="truncate text-sm font-medium text-on-surface">{b.profiles?.full_name ?? '—'}</div></div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-outline-variant/20 pt-2 text-xs text-on-surface-variant">
                    <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">verified_user</span> NODO VELAR</div>
                    <div className="ml-auto flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-green-500">check_circle</span> Verificado</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button className="rounded-lg border border-primary-container px-3 py-2 text-sm font-medium text-primary-container transition-colors hover:bg-primary-container/5">Ver detalle</button>
                    <button className="rounded-lg border border-primary-container px-3 py-2 text-sm font-medium text-primary-container transition-colors hover:bg-primary-container/5">Negociar</button>
                    <button onClick={() => comprar(b.token_id)} className="rounded-lg bg-primary-container px-3 py-2 text-sm font-medium text-white transition-all hover:bg-[#0B5CFF] hover:shadow-[0_0_15px_rgba(21,94,239,0.3)]">Comprar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6 lg:col-span-4">
            <div className="glass-card space-y-4 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg text-on-surface" style={{ fontFamily: 'Geist' }}>Eventos en vivo<span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" /></span></h3>
              </div>
              <div className="space-y-2">
                {transfers.slice(0, 5).map((t) => (
                  <div key={t.id} className="group flex cursor-pointer items-start gap-3 rounded-xl p-2 transition-colors hover:bg-surface-container-low">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-container text-primary-container"><span className="material-symbols-outlined text-[18px]">{evIcon[t.status] ?? 'bolt'}</span></div>
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold text-on-surface">{t.bonds?.bond_id ?? 'Bono'}</div><div className="truncate text-xs text-on-surface-variant">{t.from_profile?.full_name ?? '?'} → {t.to_profile?.full_name ?? '?'} · {t.status}</div></div>
                  </div>
                ))}
                {transfers.length === 0 && <div className="px-2 text-xs text-on-surface-variant">Sin actividad todavía.</div>}
              </div>
            </div>

            <div className="glass-card space-y-4 rounded-2xl p-5">
              <h3 className="text-lg text-on-surface" style={{ fontFamily: 'Geist' }}>Resumen del comprador</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center justify-center rounded-xl border border-[#D5E3FF]/60 bg-white p-3 text-center">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-container/10 text-primary-container"><span className="material-symbols-outlined text-lg">account_balance_wallet</span></div>
                  <div className="mb-1 text-2xl font-bold leading-none text-on-surface">{myBonds.length}</div><div className="mb-1 text-xs text-on-surface-variant">Bonos en cartera</div><div className="mt-auto text-sm font-bold text-on-surface">{fmt(valorCartera)}</div>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-[#D5E3FF]/60 bg-white p-3 text-center">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600"><span className="material-symbols-outlined text-lg">handshake</span></div>
                  <div className="mb-1 text-2xl font-bold leading-none text-on-surface">{enNeg.length}</div><div className="mb-1 text-xs text-on-surface-variant">En negociación</div>
                </div>
              </div>
            </div>

            <div className="glass-card space-y-4 rounded-2xl p-5">
              <h3 className="text-lg text-on-surface" style={{ fontFamily: 'Geist' }}>Mis acciones rápidas</h3>
              <div className="flex flex-col gap-2">
                {[['account_balance_wallet', 'Ver mis bonos'], ['sell', 'Publicar para venta']].map(([ic, lb]) => (
                  <button key={lb} className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition-all hover:border-primary-container/20 hover:bg-surface-container-low">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D5E3FF] bg-white text-primary-container shadow-sm transition-transform group-hover:scale-105"><span className="material-symbols-outlined">{ic}</span></div>
                    <span className="text-sm font-medium text-on-surface">{lb}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto w-full border-t border-outline-variant/30 bg-surface-container-low py-8">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-2 px-10 md:flex-row">
          <div className="text-2xl font-bold text-on-surface" style={{ fontFamily: 'Geist' }}>VELAR</div>
          <div className="text-xs uppercase tracking-wide text-on-surface-variant">© 2026 VELAR · Protocolo de transparencia radical</div>
        </div>
      </footer>
    </div>
  );
}
