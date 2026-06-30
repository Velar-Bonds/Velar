'use client';
import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid, ClipboardCheck, Send, ScrollText, Waypoints, Search, Settings, LogOut,
  ShieldCheck, BarChart3, FileText, Shield,
} from 'lucide-react';
import { createClient } from '../lib/supabase/client';
import type { Me } from '../lib/api';
import { useRoleGuard } from '../lib/role-guard';
import { VelarBrand } from './VelarBrand';
import { NotificationBell } from './NotificationBell';
import { ConnectWalletButton } from './ConnectWalletButton';
import { StellarNetworkBadge } from './StellarNetworkBadge';
import { CountrySelector } from './CountrySelector';
import { useCountry, DEMO_MODE } from '../lib/country';

const NAV = [
  { href: '/tse', label: 'Dashboard', Icon: LayoutGrid, exact: true },
  { href: '/tse/revision', label: 'Revisión', Icon: ClipboardCheck },
  { href: '/tse/emision', label: 'Emisión', Icon: Send },
  { href: '/tse/registros', label: 'Registros', Icon: ScrollText },
  { href: '/tse/escrows', label: 'Escrows on-chain', Icon: Shield },
  { href: '/tse/retiros', label: 'Retiros de escrow', Icon: Shield },
  { href: '/tse/analytics', label: 'Análisis', Icon: BarChart3 },
  { href: '/tse/reportes', label: 'Reportes', Icon: FileText },
  { href: '/tse/trazabilidad', label: 'Trazabilidad', Icon: Waypoints },
  { href: '/tse/auditoria', label: 'Auditoría', Icon: Search },
  { href: '/tse/configuracion', label: 'Configuración', Icon: Settings },
];

export function TSEShell({ me, children }: { me: Me; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const ok = useRoleGuard(me, ['tse', 'admin']);
  const { profile, seedFromProfile } = useCountry();
  useEffect(() => { seedFromProfile(me?.country); }, [me?.country, seedFromProfile]);
  const logout = async () => { await supabase.auth.signOut(); router.replace('/login'); };

  if (!ok) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFCFF] text-on-surface" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside className="sticky top-0 z-40 flex h-full w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-surface-variant/40 bg-white/80 backdrop-blur-md">
        <div className="px-5 py-7">
          <div className="mb-10 flex items-center justify-between">
            <Link href="/tse" className="flex items-center" aria-label="VELAR">
              <VelarBrand size="sm" />
            </Link>
            {DEMO_MODE && <CountrySelector compact />}
          </div>
          <div className="mb-4 flex flex-col gap-2">
            <ConnectWalletButton variant="full" />
            <StellarNetworkBadge className="self-start" />
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map(({ href, label, Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link key={href} href={href}
                  className={`relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors ${active ? 'bg-primary/10 font-semibold text-primary' : 'font-medium text-on-surface-variant hover:bg-primary/5 hover:text-primary'}`}>
                  {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />}
                  <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={active ? 2.3 : 2.1} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-5 py-5">
          <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" strokeWidth={2.2} />
              <span className="text-xs font-semibold text-emerald-700">Sistema verificado</span>
            </div>
            <p className="mb-2.5 text-[11px] text-emerald-600/80">Todos los componentes operan correctamente.</p>
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-emerald-600">
              <span>Integridad</span><span>100%</span>
            </div>
            <div className="h-1.5 rounded-full bg-emerald-100">
              <div className="h-1.5 w-full rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-30 border-b border-surface-variant/40 bg-white/88 px-6 py-4 backdrop-blur-md">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-2xl">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="search"
                placeholder="Buscar bonos, partidos, wallets o hashes..."
                className="w-full rounded-2xl border border-outline-variant/40 bg-[#FAFCFF] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary-container focus:bg-white focus:ring-2 focus:ring-primary-container/10"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <NotificationBell role={me.role} panelAlign="right" />
              <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-white px-3 py-2 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  {(me.full_name ?? profile.authority.code).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-on-surface">{me.full_name ?? `${profile.authority.code} Admin`}</p>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-on-surface-variant" title={profile.authority.name}>
                    {profile.flag} {profile.authority.code}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="rounded-xl p-2 text-on-surface-variant transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Cerrar sesion"
                >
                  <LogOut className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
