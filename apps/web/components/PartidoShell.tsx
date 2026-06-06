'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FileText, Wallet, Handshake, Waypoints, History, Settings, LogOut, ShieldCheck, Send,
} from 'lucide-react';
import { createClient } from '../lib/supabase/client';
import type { Me } from '../lib/api';
import { useRoleGuard } from '../lib/role-guard';
import { VelarBrand } from './VelarBrand';

const NAV = [
  { href: '/partido', label: 'Dashboard', Icon: LayoutDashboard, exact: true },
  { href: '/partido/solicitar-bonos', label: 'Solicitar bonos', Icon: FileText },
  { href: '/partido/mis-bonos', label: 'Mis bonos', Icon: Wallet },
  { href: '/partido/negociaciones', label: 'Negociaciones', Icon: Handshake },
  { href: '/partido/trazabilidad', label: 'Trazabilidad', Icon: Waypoints },
  { href: '/partido/reportes', label: 'Reportes al TSE', Icon: Send },
  { href: '/partido/historial', label: 'Historial', Icon: History },
  { href: '/partido/configuracion', label: 'Configuración', Icon: Settings },
];

export function PartidoShell({ me, children }: { me: Me; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const ok = useRoleGuard(me, ['emisor']);

  const logout = async () => { await supabase.auth.signOut(); router.replace('/login'); };

  if (!ok) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-on-background" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 z-50 flex h-screen w-[240px] flex-col border-r border-outline-variant bg-white py-6 shadow-sm">
        <Link href="/partido" className="mb-6 flex items-center px-6" aria-label="VELAR">
          <VelarBrand size="sm" />
        </Link>

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2">
          {NAV.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${active ? 'bg-primary-container/10 font-semibold text-primary' : 'font-medium text-on-surface-variant hover:bg-primary-container/10 hover:text-primary'}`}>
                {active && <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />}
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.3 : 2.1} />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="px-2 pt-4">
          <div className="mx-2 flex items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {(me.full_name ?? 'PA').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold uppercase tracking-wider text-on-surface">{me.full_name ?? 'Partido'}</p>
              <p className="flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                <ShieldCheck className="h-3 w-3" strokeWidth={2.2} /> Nodo verificado
              </p>
            </div>
            <button onClick={logout} className="text-on-surface-variant transition hover:text-red-600">
              <LogOut className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="ml-[240px] flex min-h-screen flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
