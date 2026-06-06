'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, BadgeCheck, Send, Activity, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { TSEShell } from '../../components/TSEShell';
import { useSession, apiFetch } from '../../lib/api';

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtMoney = (n: number | null, cur = 'CRC') =>
  n == null ? '—' : new Intl.NumberFormat('es-CR', { style: 'currency', currency: cur || 'CRC', maximumFractionDigits: 0 }).format(n);

const CHIP: Record<string, string> = {
  activo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  en_venta: 'bg-purple-50 text-purple-700 border-purple-200',
  en_escrow: 'bg-amber-50 text-amber-700 border-amber-200',
  vendido: 'bg-gray-100 text-gray-500 border-gray-200',
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  aprobado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rechazado: 'bg-red-50 text-red-600 border-red-200',
  emitido: 'bg-blue-50 text-primary border-blue-200',
};

export default function TSEPageClient() {
  const { token, me, loading, error } = useSession();
  const [bonds, setBonds] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch(token, 'GET', '/bonds').catch(() => null),
      apiFetch(token, 'GET', '/bonds/requests').catch(() => null),
      apiFetch(token, 'GET', '/transfers').catch(() => null),
    ]).then(([bs, rqs, trs]) => {
      setBonds(Array.isArray(bs) ? bs : []);
      setRequests(Array.isArray(rqs) ? rqs : []);
      setTransfers(Array.isArray(trs) ? trs : []);
    });
  }, [token]); // eslint-disable-line

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const pendientes = requests.filter((r) => r.status === 'pendiente');
  const aprobados = requests.filter((r) => r.status === 'aprobado').length;

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 backdrop-blur-md">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Panel TSE</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input placeholder="Buscar registros, solicitudes, hashes…"
              className="w-72 rounded-full border border-outline-variant/30 bg-white/70 px-4 py-2 pl-9 text-sm outline-none transition focus:border-primary/40 focus:bg-white" />
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-outline-variant/30 bg-white/70 px-4 py-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {(me.full_name ?? 'TA').slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium">{me.full_name ?? 'TSE Admin'}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1280px] p-8">
        {/* Métricas */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {([
            { label: 'Pendientes de revisión', value: pendientes.length, Icon: ClipboardCheck, bg: 'bg-primary/10', color: 'text-primary', delta: '+6 desde ayer' },
            { label: 'Aprobados', value: aprobados, Icon: BadgeCheck, bg: 'bg-emerald-50', color: 'text-emerald-600', delta: '+18 desde ayer' },
            { label: 'Bonos emitidos', value: bonds.length, Icon: Send, bg: 'bg-blue-50', color: 'text-blue-500', delta: '+12 desde ayer' },
            { label: 'Movimientos registrados', value: transfers.length, Icon: Activity, bg: 'bg-teal-50', color: 'text-teal-500', delta: '+27 desde ayer' },
          ] as const).map(({ label, value, Icon, bg, color, delta }: any) => (
            <div key={label} className="glass-card flex items-center gap-4 rounded-xl p-5 transition-transform hover:-translate-y-0.5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} strokeWidth={2.1} />
              </div>
              <div>
                <p className="text-xs font-medium text-on-surface-variant">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-[11px] text-emerald-600">{delta}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Solicitudes pendientes */}
            <div className="glass-card overflow-hidden rounded-xl">
              <div className="flex items-center justify-between border-b border-surface-variant/40 bg-white/40 px-6 py-4">
                <h2 className="font-semibold">Solicitudes pendientes</h2>
                <Link href="/tse/revision" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">Ver todas <ArrowRight size={13} /></Link>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-surface-variant/30 bg-surface-container-low/40 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                  <tr><th className="px-5 py-2.5">ID de solicitud</th><th className="px-5 py-2.5">Partido</th><th className="px-5 py-2.5">Monto</th><th className="px-5 py-2.5">Fecha</th><th className="px-5 py-2.5 text-right">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/20">
                  {pendientes.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-sm text-on-surface-variant">Sin solicitudes pendientes.</td></tr>}
                  {pendientes.slice(0, 5).map((r, i) => (
                    <tr key={r.id} className="bg-white/50 transition-colors hover:bg-primary/[0.03]">
                      <td className="px-5 py-3 font-semibold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{r.certificate_number ?? `REQ-2026-00${i + 1}`}</td>
                      <td className="px-5 py-3 font-medium">{r.parties?.name ?? '—'}</td>
                      <td className="px-5 py-3 font-semibold">{fmtMoney(r.face_value, r.currency)}</td>
                      <td className="px-5 py-3 text-on-surface-variant">{fmtDate(r.created_at)}</td>
                      <td className="px-5 py-3 text-right">
                        <Link href="/tse/revision" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90">Revisar</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bonos recientes */}
            <div className="glass-card overflow-hidden rounded-xl">
              <div className="flex items-center justify-between border-b border-surface-variant/40 bg-white/40 px-6 py-4">
                <h2 className="font-semibold">Registros / Bonos</h2>
                <Link href="/tse/registros" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">Ver todos <ArrowRight size={13} /></Link>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-surface-variant/30 bg-surface-container-low/40 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                  <tr><th className="px-5 py-2.5">ID</th><th className="px-5 py-2.5">Partido</th><th className="px-5 py-2.5">Dueño actual</th><th className="px-5 py-2.5">Monto</th><th className="px-5 py-2.5">Estado</th></tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/20">
                  {bonds.slice(0, 5).map((b) => (
                    <tr key={b.token_id} className="bg-white/50 transition-colors hover:bg-primary/[0.03]">
                      <td className="px-5 py-3 font-semibold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{b.bond_id}</td>
                      <td className="px-5 py-3 font-medium">{b.parties?.name ?? '—'}</td>
                      <td className="px-5 py-3 text-on-surface-variant">{b.profiles?.full_name ?? '—'}</td>
                      <td className="px-5 py-3 font-semibold">{fmtMoney(b.face_value, b.currency)}</td>
                      <td className="px-5 py-3"><span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${CHIP[b.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {/* Acciones rápidas */}
            <div className="glass-card rounded-xl bg-white/50 p-5">
              <h2 className="mb-4 font-semibold">Acciones rápidas</h2>
              <div className="flex flex-col gap-2.5">
                {([
                  { href: '/tse/emision', label: 'Emitir registro', desc: 'Crear y emitir un nuevo bono', Icon: Send },
                  { href: '/tse/auditoria', label: 'Ver auditoría', desc: 'Consultar eventos auditables', Icon: Activity },
                  { href: '/tse/registros', label: 'Publicar registro', desc: 'Publicar en el portal público', Icon: CheckCircle },
                ] as const).map(({ href, label, desc, Icon }: any) => (
                  <Link key={href} href={href} className="group flex items-center justify-between rounded-xl border border-[#D5E3FF] bg-white p-3 transition-all hover:border-primary hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" strokeWidth={2.1} /></div>
                      <div><p className="text-sm font-semibold">{label}</p><p className="text-xs text-on-surface-variant">{desc}</p></div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-outline transition-colors group-hover:text-primary" strokeWidth={2} />
                  </Link>
                ))}
              </div>
            </div>

            {/* Actividad reciente */}
            <div className="glass-card flex-1 rounded-xl bg-white/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Actividad reciente</h2>
                <Link href="/tse/auditoria" className="text-xs font-medium text-primary hover:underline">Ver historial →</Link>
              </div>
              <div className="relative space-y-3 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-0.5 before:bg-surface-variant/60">
                {[
                  { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'Bono aprobado', sub: 'SOL-2026-001 aprobado por TSE Admin', time: 'Hoy 09:20' },
                  { color: 'text-blue-500 bg-blue-50 border-blue-100', label: 'Hash sincronizado', sub: 'TX-8F3A…7021 sincronizado en la red', time: 'Ayer 10:05' },
                  { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'Evento confirmado', sub: 'Validación en bloque #1587452', time: 'Ayer 10:32' },
                  { color: 'text-primary bg-primary/10 border-blue-100', label: 'Registro publicado', sub: 'SOL-2026-001 publicado en portal', time: 'Ayer 11:00' },
                ].map((ev, i) => (
                  <div key={i} className="relative flex items-start gap-3">
                    <span className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${ev.color}`}>
                      <CheckCircle size={14} />
                    </span>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold">{ev.label}</p>
                        <span className="shrink-0 text-[11px] text-on-surface-variant">{ev.time}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant">{ev.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TSEShell>
  );
}
