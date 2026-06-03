'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const fmt = (n: number | null | undefined) =>
  n == null ? '—' : '$' + Number(n).toLocaleString('es-CR');
const shortId = (id: string) => '0x' + id.replace(/-/g, '').slice(0, 3) + '…' + id.replace(/-/g, '').slice(-4);

type Bond = {
  token_id: string; bond_id: string; status: string; face_value: number | null;
  parties?: { code?: string; name?: string };
  profiles?: { full_name?: string };
};

const navItems = [
  { icon: 'storefront', label: 'Marketplace', active: true },
  { icon: 'account_balance_wallet', label: 'Mis bonos' },
  { icon: 'gavel', label: 'Negociaciones' },
  { icon: 'account_tree', label: 'Trazabilidad' },
  { icon: 'analytics', label: 'Eventos' },
];

export default function MarketplacePage() {
  const router = useRouter();
  const supabase = createClient();
  const [token, setToken] = useState<string | null>(null);
  const [available, setAvailable] = useState<Bond[]>([]);
  const [myBonds, setMyBonds] = useState<Bond[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [msg, setMsg] = useState('');

  async function api(method: string, path: string, tok: string, body?: any) {
    const r = await fetch(API_URL + path, {
      method, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.message ?? 'Error');
    return j;
  }

  async function load(tok: string) {
    try {
      const [meRes, avail, mine, trs] = await Promise.all([
        api('GET', '/users/me', tok),
        api('GET', '/bonds/available', tok).catch(() => []),
        api('GET', '/bonds', tok).catch(() => []),
        api('GET', '/transfers', tok).catch(() => []),
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

  async function comprar(bondTokenId: string) {
    if (!token) return;
    try {
      await api('POST', '/transfers', token, { bondTokenId, amount: 0 });
      setMsg('✅ Solicitud de compra enviada. El dueño debe aceptar.');
      load(token);
    } catch (e: any) { setMsg('⚠️ ' + e.message); }
  }

  const enNegociacion = transfers.filter((t) =>
    ['solicitada', 'aceptada', 'en_escrow', 'pago_registrado', 'pago_validado'].includes(t.status));
  const valorCartera = myBonds.reduce((s, b) => s + (Number(b.face_value) || 0), 0);

  const statusChip = (s: string) => {
    if (s === 'activo') return 'bg-[#16A34A]/10 text-[#16A34A]';
    if (s === 'en_escrow') return 'bg-[#155EEF]/10 text-[#155EEF]';
    if (s === 'congelado') return 'bg-red-500/10 text-red-600';
    return 'bg-gray-200 text-gray-600';
  };
  const statusLabel = (s: string) =>
    ({ activo: 'Disponible', en_escrow: 'Negociando', congelado: 'Congelado', emitido: 'Emitido' } as any)[s] ?? s;

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFCFF] text-[#0e193b] antialiased md:flex-row" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[#c3c6d8]/40 bg-white/70 px-6 py-4 backdrop-blur-xl md:flex">
        <div className="mb-8 flex items-center gap-2 pt-2">
          <svg width="32" height="32" viewBox="0 0 44 44" fill="none"><path d="M9 10 L22 33 L35 10" stroke="#155EEF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div>
            <div className="text-xl font-bold tracking-tight text-[#0047c1]" style={{ fontFamily: 'Geist' }}>VELAR</div>
            <div className="text-[11px] text-[#737687]">Transparencia radical</div>
          </div>
        </div>
        <div className="flex flex-grow flex-col gap-1">
          {navItems.map((it) => (
            <a key={it.label} href="#"
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${it.active ? 'border-r-4 border-[#155EEF] bg-[#155EEF]/5 font-bold text-[#155EEF]' : 'text-[#434655] hover:bg-[#155EEF]/5 hover:text-[#155EEF]'}`}>
              <span className="material-symbols-outlined" style={it.active ? { fontVariationSettings: "'FILL' 1" } : {}}>{it.icon}</span>
              <span className="text-[15px]">{it.label}</span>
            </a>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-1 pb-2">
          <div className="mb-3 rounded-lg bg-[#155EEF]/5 px-4 py-3 text-[13px]">
            <div className="font-semibold text-[#0e193b]">{me?.full_name ?? '…'}</div>
            <div className="text-[#737687]">{me?.role ?? ''}</div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            className="flex items-center gap-3 rounded-lg px-4 py-2 text-[#434655] transition hover:bg-[#155EEF]/5 hover:text-[#155EEF]">
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="text-[14px]">Cerrar sesión</span>
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="min-h-screen flex-1 bg-[#FAFCFF] p-5 md:ml-64 md:p-10">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#0e193b]" style={{ fontFamily: 'Geist' }}>Libro Mayor Institucional</h1>
            <p className="max-w-2xl text-[#737687]">Descubre, compra y da seguimiento a bonos políticos con trazabilidad verificada en la red de VELAR.</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#c3c6d8]/30 bg-[#f3f3ff] px-3 py-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-xs text-[#0e193b]" style={{ fontFamily: 'JetBrains Mono' }}>RED VELAR: OPERATIVA</span>
          </div>
        </div>

        {msg && <div className="mb-4 rounded-lg border border-[#D5E3FF] bg-white px-4 py-2 text-sm">{msg}</div>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Table */}
          <div className="flex flex-col gap-4 lg:col-span-8">
            <div className="overflow-hidden rounded-xl border border-[#c3c6d8]/30 bg-white shadow-sm">
              <table className="w-full border-collapse text-left">
                <thead className="border-b border-[#c3c6d8]/30 bg-[#f3f3ff]">
                  <tr className="text-[11px] uppercase tracking-wide text-[#737687]">
                    <th className="p-4">Identificador</th><th className="p-4">Activo</th><th className="p-4">Estado</th>
                    <th className="p-4 text-right">Valor</th><th className="p-4">Verificación</th><th className="p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c3c6d8]/30">
                  {available.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-sm text-[#737687]">No hay bonos en venta ahora mismo.</td></tr>
                  )}
                  {available.map((b) => (
                    <tr key={b.token_id} className="transition-colors hover:bg-[#155EEF]/5">
                      <td className="p-4"><div className="text-xs text-[#155EEF]" style={{ fontFamily: 'JetBrains Mono' }}>{b.bond_id}</div>
                        <div className="text-[10px] text-[#737687]" style={{ fontFamily: 'JetBrains Mono' }}>{shortId(b.token_id)}</div></td>
                      <td className="p-4"><div className="text-sm font-bold text-[#0e193b]">{b.parties?.name ?? 'Bono'}</div>
                        <div className="text-[11px] text-[#434655]">{b.profiles?.full_name ?? '—'}</div></td>
                      <td className="p-4"><span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${statusChip(b.status)}`}>{statusLabel(b.status)}</span></td>
                      <td className="p-4 text-right text-sm font-bold text-[#0e193b]" style={{ fontFamily: 'JetBrains Mono' }}>{fmt(b.face_value)}</td>
                      <td className="p-4"><div className="flex items-center gap-1 text-[#155EEF]"><span className="material-symbols-outlined text-sm">verified_user</span><span className="text-[10px] font-bold">NODO VELAR</span></div></td>
                      <td className="p-4"><button onClick={() => comprar(b.token_id)} className="rounded-lg bg-[#155EEF] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0B5CFF]">Solicitar comprar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-sm text-[#737687]">Mostrando {available.length} bono(s) en venta</div>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            <div className="glass-card rounded-xl p-5">
              <h3 className="mb-4 flex items-center gap-2 text-[18px] font-bold text-[#0e193b]" style={{ fontFamily: 'Geist' }}>
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />Actividad reciente
              </h3>
              <div className="flex flex-col gap-4">
                {transfers.slice(0, 4).map((t) => (
                  <div key={t.id} className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#155EEF]"><span className="material-symbols-outlined text-sm">swap_horiz</span></div>
                    <div className="flex-1"><div className="text-sm font-bold text-[#0e193b]">{statusLabel(t.status) ?? t.status}</div>
                      <div className="text-[13px] text-[#434655]">{t.bonds?.bond_id ?? 'Bono'} · {t.from_profile?.full_name ?? '?'} → {t.to_profile?.full_name ?? '?'}</div></div>
                  </div>
                ))}
                {transfers.length === 0 && <div className="text-[13px] text-[#737687]">Sin actividad todavía.</div>}
              </div>
            </div>

            <div className="glass-card rounded-xl p-5">
              <h3 className="mb-4 text-[18px] font-bold text-[#0e193b]" style={{ fontFamily: 'Geist' }}>Auditoría de Cartera</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#D5E3FF] bg-[#FAFCFF] p-3">
                  <span className="material-symbols-outlined mb-2 text-[#155EEF]">account_balance_wallet</span>
                  <div className="text-2xl font-bold text-[#0e193b]">{myBonds.length}</div>
                  <div className="mt-1 mb-2 text-[10px] uppercase tracking-wide text-[#737687]">Bonos en cartera</div>
                  <div className="text-[14px] font-bold text-[#155EEF]" style={{ fontFamily: 'JetBrains Mono' }}>{fmt(valorCartera)}</div>
                </div>
                <div className="rounded-lg border border-[#D5E3FF] bg-[#FAFCFF] p-3">
                  <span className="material-symbols-outlined mb-2 text-purple-600">handshake</span>
                  <div className="text-2xl font-bold text-[#0e193b]">{enNegociacion.length}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-[#737687]">En negociación</div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5">
              <h3 className="mb-4 text-[18px] font-bold text-[#0e193b]" style={{ fontFamily: 'Geist' }}>Acciones rápidas</h3>
              <div className="grid grid-cols-3 gap-3">
                {[['account_balance_wallet', 'Ver mis bonos'], ['sell', 'Publicar venta'], ['handshake', 'Negociaciones']].map(([ic, lb]) => (
                  <button key={lb} className="group flex flex-col items-center gap-2 rounded-lg border border-[#D5E3FF] bg-[#FAFCFF] p-3 transition-all hover:border-[#155EEF] hover:shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#155EEF]/10 text-[#155EEF] transition-colors group-hover:bg-[#155EEF] group-hover:text-white"><span className="material-symbols-outlined">{ic}</span></div>
                    <span className="text-center text-[10px] leading-tight text-[#0e193b]">{lb}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
