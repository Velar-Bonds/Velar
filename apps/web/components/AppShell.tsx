'use client';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Store, Wallet, Handshake, GitBranch, Radio, Settings, LogOut, Search, ChevronDown, Boxes,
} from 'lucide-react';
import { useSession, type Me } from '../lib/api';
import { NotificationBell } from './NotificationBell';
import { useRoleGuard } from '../lib/role-guard';
import { CountrySelector } from './CountrySelector';
import { useCountry } from '../lib/country';

const TABS = [
  { href: '/marketplace', label: 'Marketplace', Icon: Store },
  { href: '/mis-bonos', label: 'Mis bonos', Icon: Wallet },
  { href: '/negociaciones', label: 'Negociaciones', Icon: Handshake },
  { href: '/trazabilidad', label: 'Trazabilidad', Icon: GitBranch },
  { href: '/en-vivo', label: 'En vivo', Icon: Radio },
];

const initials = (n?: string) => (n ?? '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

export function AppShell({ children }: { children: (ctx: { token: string; me: Me }) => ReactNode }) {
  const { token, me, loading, error, logout } = useSession();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const ok = useRoleGuard(me, ['comprador', 'recomprador', 'validador']);
  const { seedFromProfile } = useCountry();
  useEffect(() => { seedFromProfile(me?.country); }, [me?.country, seedFromProfile]);

  return (
    <div className="min-h-screen bg-[#fafcff] text-on-surface" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Navbar global */}
      <header className="sticky top-0 z-50 border-b border-outline-variant/20 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8">
          <Link href="/marketplace" className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-container to-blue-400 text-white shadow-sm"><Boxes size={18} /></span>
            <span className="text-xl font-bold tracking-tight text-on-surface" style={{ fontFamily: 'Geist' }}>VELAR</span>
          </Link>

          <div className="relative mx-4 hidden max-w-xl flex-1 md:block">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input className="w-full rounded-full border border-outline-variant/40 bg-white/60 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-primary-container focus:bg-white focus:ring-1 focus:ring-primary-container" placeholder="Buscar bonos, emisores, hashes…" />
          </div>

          <div className="flex items-center gap-2">
            <CountrySelector />
            <NotificationBell role={me?.role} />
            <div className="relative">
              <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full border border-transparent p-1 pr-2 transition hover:border-outline-variant/30 hover:bg-surface-container-low">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-xs font-semibold text-white">{initials(me?.full_name)}</span>
                <span className="hidden text-sm font-medium md:block">{me?.full_name ?? '…'}</span>
                <ChevronDown size={16} className="text-outline" />
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-xl">
                  <div className="border-b border-outline-variant/20 px-4 py-3"><p className="text-sm font-semibold">{me?.full_name}</p><p className="text-xs capitalize text-on-surface-variant">{me?.role}</p></div>
                  <Link href="/configuracion" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-surface-container-low"><Settings size={16} /> Configuración</Link>
                  <button onClick={logout} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"><LogOut size={16} /> Cerrar sesión</button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Tabs */}
        <nav className="border-t border-outline-variant/20 bg-white/50">
          <div className="mx-auto flex h-12 max-w-[1440px] items-center gap-1 overflow-x-auto px-2 md:justify-center md:gap-6 md:px-8">
            {TABS.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link key={href} href={href} className={`flex h-full shrink-0 items-center gap-2 border-b-2 px-3 pb-[2px] text-sm transition-colors ${active ? 'border-primary-container font-bold text-primary-container' : 'border-transparent font-medium text-on-surface-variant hover:text-primary-container'}`}>
                  <Icon size={18} /> {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Contenido */}
      {loading || !token || !me || !ok ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          {error
            ? <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">{error}</div>
            : <div className="flex items-center gap-3 text-on-surface-variant"><span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-container border-t-transparent" /> Cargando…</div>}
        </div>
      ) : (
        <main className="velar-fade-in mx-auto max-w-[1440px] px-4 py-8 md:px-8">{children({ token, me })}</main>
      )}
    </div>
  );
}
