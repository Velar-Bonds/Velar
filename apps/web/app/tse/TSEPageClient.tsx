'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  ArrowRight,
  ArrowRightLeft,
  BadgeCheck,
  ClipboardCheck,
  FilePlus,
  Globe,
  Landmark,
  LayoutGrid,
  LogOut,
  ScrollText,
  Search,
  Send,
  ShieldCheck,
  Waypoints,
} from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const fmtDate = (s?: string) => (s ? new Date(s).toLocaleString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

const supabase = createClient();

const nav: Array<{ Icon: LucideIcon; label: string; active?: boolean }> = [
  { Icon: LayoutGrid, label: 'Dashboard', active: true },
  { Icon: ClipboardCheck, label: 'Revisión' },
  { Icon: Send, label: 'Emisión' },
  { Icon: ScrollText, label: 'Registros' },
  { Icon: Waypoints, label: 'Trazabilidad' },
  { Icon: Search, label: 'Auditoría' },
  { Icon: Globe, label: 'Publicación' },
];

const quickActions = [
  {
    Icon: FilePlus,
    title: 'Emitir registro',
    description: 'Crear y emitir un nuevo bono',
  },
  {
    Icon: Search,
    title: 'Ver auditoría',
    description: 'Consultar eventos auditables',
  },
  {
    Icon: Globe,
    title: 'Publicar registro',
    description: 'Publicar en el portal público',
  },
] as const;

async function api(method: string, path: string, tok: string) {
  const r = await fetch(API_URL + path, { headers: { Authorization: `Bearer ${tok}` }, method });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message ?? 'Error');
  return j;
}

function statusChip(s: string) {
  return ({ activo: 'bg-emerald-50 text-emerald-700 border-emerald-200', en_escrow: 'bg-amber-50 text-amber-700 border-amber-200', congelado: 'bg-red-50 text-red-600 border-red-200', emitido: 'bg-blue-50 text-primary border-blue-200' } as any)[s] ?? 'bg-gray-100 text-gray-600 border-gray-200';
}

export default function TSEPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [bonds, setBonds] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const t = data.session?.access_token;
      if (!t) return;
      try {
        const [meRes, bs, trs] = await Promise.all([api('GET', '/users/me', t), api('GET', '/bonds', t).catch(() => []), api('GET', '/transfers', t).catch(() => [])]);
        setMe(meRes); setBonds(bs); setTransfers(trs);
      } catch {}
    });
  }, []);

  const pendientes = transfers.filter((t) => ['solicitada', 'en_escrow', 'pago_registrado'].includes(t.status)).length;
  const aprobados = transfers.filter((t) => t.status === 'liberada').length;

  const metrics: Array<{
    label: string;
    value: number;
    Icon: LucideIcon;
    colorClass: string;
    backgroundClass: string;
  }> = [
    {
      label: 'Pendientes de revisión',
      value: pendientes,
      Icon: ClipboardCheck,
      colorClass: 'text-primary',
      backgroundClass: 'bg-primary-container/10',
    },
    {
      label: 'Movimientos liberados',
      value: aprobados,
      Icon: BadgeCheck,
      colorClass: 'text-green-600',
      backgroundClass: 'bg-green-50',
    },
    {
      label: 'Bonos emitidos',
      value: bonds.length,
      Icon: Send,
      colorClass: 'text-blue-500',
      backgroundClass: 'bg-blue-50',
    },
    {
      label: 'Transferencias totales',
      value: transfers.length,
      Icon: Activity,
      colorClass: 'text-teal-500',
      backgroundClass: 'bg-teal-50',
    },
  ];

  return (
    <div className="flex h-screen overflow-x-hidden bg-[#FAFCFF] text-on-surface" style={{ fontFamily: 'Inter, sans-serif' }}>
      <aside className="glass-sidebar sticky top-0 z-40 hidden h-full w-64 shrink-0 flex-col justify-between md:flex">
        <div className="px-6 py-8">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
              <Landmark aria-hidden="true" className="h-4.5 w-4.5 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-2xl font-semibold tracking-tight text-primary">VELAR</span>
          </div>
          <nav className="space-y-2">
            {nav.map(({ Icon, label, active }) => (
              <button type="button" key={label} className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left font-medium transition-colors ${active ? 'bg-primary-container/10 text-primary' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}>
                <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={active ? 2.3 : 2.1} />
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="px-6 py-6">
          <div className="glass-card mb-6 rounded-xl p-4">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="h-4.5 w-4.5 text-green-600" strokeWidth={2.2} />
              <span className="text-sm font-semibold">Sistema verificado</span>
            </div>
            <p className="mb-3 text-xs text-on-surface-variant">Todos los componentes operan correctamente.</p>
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-green-600"><span>Integridad</span><span>100%</span></div>
            <div className="h-1.5 w-full rounded-full bg-surface-variant"><div className="h-1.5 w-full rounded-full bg-green-600" /></div>
          </div>
          <div className="text-xs text-on-surface-variant opacity-70"><p>© 2026 VELAR</p><p>Plataforma institucional</p></div>
        </div>
      </aside>

      <main className="flex h-full flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-surface-variant/50 bg-[#FAFCFF]/80 px-8 backdrop-blur-md">
          <h1 className="text-2xl font-semibold text-on-surface">Panel TSE</h1>
          <div className="flex items-center gap-4">
            <div className="flex cursor-pointer items-center gap-3 border-l border-surface-variant pl-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{(me?.full_name ?? 'TA').slice(0, 2).toUpperCase()}</div>
              <span className="hidden text-sm font-medium md:block">{me?.full_name ?? 'TSE'}</span>
              <button type="button" onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="text-outline transition-colors hover:text-primary">
                <LogOut aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={2.1} />
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map(({ label, value, Icon, colorClass, backgroundClass }) => (
              <div key={label} className="glass-card flex items-center gap-4 rounded-xl p-4 transition-transform duration-300 hover:-translate-y-1">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${backgroundClass}`}>
                  <Icon aria-hidden="true" className={`h-5 w-5 ${colorClass}`} strokeWidth={2.1} />
                </div>
                <div><p className="text-sm font-medium text-on-surface-variant">{label}</p><span className="text-lg font-bold">{value}</span></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <div className="glass-card flex flex-col overflow-hidden rounded-xl">
                <div className="flex items-center justify-between border-b border-surface-variant/50 bg-white/40 p-6"><h2 className="text-lg font-semibold">Registros / Bonos</h2></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-surface-variant/50 bg-surface-container-low/50 text-xs font-semibold uppercase text-on-surface-variant">
                      <tr><th className="px-6 py-2">ID</th><th className="px-6 py-2">Partido</th><th className="px-6 py-2">Dueño actual</th><th className="px-6 py-2">Fecha</th><th className="px-6 py-2">Estado</th></tr>
                    </thead>
                    <tbody className="divide-y divide-surface-variant/30">
                      {bonds.length === 0 && <tr><td colSpan={5} className="px-6 py-6 text-center text-on-surface-variant">Sin bonos todavía.</td></tr>}
                      {bonds.slice(0, 10).map((b) => (
                        <tr key={b.token_id} className="bg-white/60 transition-colors hover:bg-primary/5">
                          <td className="px-6 py-2 text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{b.bond_id}</td>
                          <td className="px-6 py-2 font-medium">{b.parties?.name ?? '—'}</td>
                          <td className="px-6 py-2 text-on-surface-variant">{b.profiles?.full_name ?? 'Sin asignar'}</td>
                          <td className="px-6 py-2 text-on-surface-variant">{fmtDate(b.created_at)}</td>
                          <td className="px-6 py-2"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusChip(b.status)}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{b.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="glass-card rounded-xl bg-white/50 p-4">
                <h2 className="mb-4 text-lg font-semibold">Acciones rápidas</h2>
                <div className="flex flex-col gap-3">
                  {quickActions.map(({ Icon, title, description }) => (
                    <button type="button" key={title} className="group flex items-center justify-between rounded-xl border border-[#D5E3FF] bg-white p-3 text-left transition-all hover:border-primary hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary">
                          <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2.1} />
                        </div>
                        <div><p className="text-sm font-medium text-on-surface">{title}</p><p className="text-xs text-on-surface-variant">{description}</p></div>
                      </div>
                      <ArrowRight aria-hidden="true" className="h-4 w-4 text-outline transition-colors group-hover:text-primary" strokeWidth={2.1} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card flex-1 rounded-xl bg-white/50 p-4">
                <div className="mb-6 flex items-center justify-between"><h2 className="text-lg font-semibold">Actividad reciente</h2></div>
                <div className="relative space-y-4 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-0.5 before:bg-surface-variant/50">
                  {transfers.slice(0, 6).map((t) => (
                    <div key={t.id} className="relative flex items-start gap-4">
                      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-500 shadow-sm">
                        <ArrowRightLeft aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.1} />
                      </div>
                      <div className="flex-1 pt-0.5"><div className="mb-1 flex items-baseline justify-between"><h3 className="text-sm font-semibold text-on-surface">{t.bonds?.bond_id ?? 'Bono'}</h3><span className="text-[10px] font-medium uppercase tracking-wider text-outline">{t.status}</span></div><p className="text-sm text-on-surface-variant">{t.from_profile?.full_name ?? '?'} → {t.to_profile?.full_name ?? '?'}</p></div>
                    </div>
                  ))}
                  {transfers.length === 0 && <p className="text-sm text-on-surface-variant">Sin actividad todavía.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
