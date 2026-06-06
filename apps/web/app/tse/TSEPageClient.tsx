'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, BadgeCheck, Send, Activity, CheckCircle } from 'lucide-react';
import { TSEShell } from '../../components/TSEShell';
import { useSession, apiFetch } from '../../lib/api';

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha';
const fmtMoney = (n: number | null, cur = 'CRC') =>
  n == null ? 'Sin dato' : new Intl.NumberFormat('es-CR', { style: 'currency', currency: cur || 'CRC', maximumFractionDigits: 0 }).format(n);

const CHIP: Record<string, string> = {
  activo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  en_venta: 'bg-blue-50 text-primary border-blue-200',
  en_escrow: 'bg-amber-50 text-amber-700 border-amber-200',
  vendido: 'bg-gray-100 text-gray-500 border-gray-200',
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  aprobado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rechazado: 'bg-red-50 text-red-600 border-red-200',
  emitido: 'bg-blue-50 text-primary border-blue-200',
};

const EVENT_LABELS: Record<string, string> = {
  bond_emitido: 'Bono emitido',
  bond_asignado: 'Bono asignado',
  transfer_solicitada: 'Transferencia solicitada',
  escrow_bloqueado: 'Escrow bloqueado',
  pago_registrado: 'Pago registrado',
  pago_validado: 'Pago validado',
  token_liberado: 'Token liberado',
  transfer_rechazada: 'Transferencia rechazada',
  transfer_cancelada: 'Transferencia cancelada',
  bond_congelado: 'Bono congelado',
  bond_descongelado: 'Bono descongelado',
};

export default function TSEPageClient() {
  const { token, me, loading, error } = useSession();
  const [bonds, setBonds] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch(token, 'GET', '/bonds'),
      apiFetch(token, 'GET', '/bonds/requests'),
      apiFetch(token, 'GET', '/transfers'),
      apiFetch(token, 'GET', '/audit/events?limit=4'),
    ]).then(([bs, rqs, trs, evs]) => {
      setLoadError('');
      setBonds(Array.isArray(bs) ? bs : []);
      setRequests(Array.isArray(rqs) ? rqs : []);
      setTransfers(Array.isArray(trs) ? trs : []);
      setEvents(Array.isArray(evs) ? evs : []);
    }).catch((e: any) => {
      setLoadError(e.message ?? 'No se pudo cargar el panel TSE.');
      setBonds([]);
      setRequests([]);
      setTransfers([]);
      setEvents([]);
    });
  }, [token]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const pendientes = requests.filter((r) => r.status === 'pendiente');
  const aprobados = requests.filter((r) => r.status === 'aprobado').length;
  const bonosConfirmados = bonds.filter((b) => b.stellar_status === 'confirmed').length;
  const transferenciasActivas = transfers.filter((t) => !['rechazada', 'cancelada', 'liberada'].includes(t.status)).length;

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 backdrop-blur-md">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Panel TSE</h1>
        <div className="flex items-center gap-2 rounded-full border border-outline-variant/30 bg-white/70 px-4 py-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            {(me.full_name ?? 'TA').slice(0, 2).toUpperCase()}
          </div>
          <span className="text-sm font-medium">{me.full_name ?? 'TSE Admin'}</span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1280px] p-8">
        {loadError && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {([
            { label: 'Pendientes de revision', value: pendientes.length, Icon: ClipboardCheck, bg: 'bg-primary/10', color: 'text-primary' },
            { label: 'Solicitudes aprobadas', value: aprobados, Icon: BadgeCheck, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Bonos emitidos on-chain', value: bonosConfirmados, Icon: Send, bg: 'bg-blue-50', color: 'text-blue-500' },
            { label: 'Movimientos en curso', value: transferenciasActivas, Icon: Activity, bg: 'bg-teal-50', color: 'text-teal-500' },
          ] as const).map(({ label, value, Icon, bg, color }: any) => (
            <div key={label} className="glass-card flex items-center gap-4 rounded-xl p-5 transition-transform hover:-translate-y-0.5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} strokeWidth={2.1} />
              </div>
              <div>
                <p className="text-xs font-medium text-on-surface-variant">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="glass-card overflow-hidden rounded-xl">
              <div className="flex items-center justify-between border-b border-surface-variant/40 bg-white/40 px-6 py-4">
                <h2 className="font-semibold">Solicitudes pendientes</h2>
                <Link href="/tse/revision" className="text-xs font-medium text-primary hover:underline">Consultar revision</Link>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-surface-variant/30 bg-surface-container-low/40 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                  <tr><th className="px-5 py-2.5">Solicitud</th><th className="px-5 py-2.5">Partido</th><th className="px-5 py-2.5">Monto</th><th className="px-5 py-2.5">Fecha</th><th className="px-5 py-2.5 text-right">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/20">
                  {pendientes.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-sm text-on-surface-variant">No hay solicitudes pendientes.</td></tr>}
                  {pendientes.slice(0, 5).map((r) => (
                    <tr key={r.id} className="bg-white/50 transition-colors hover:bg-primary/[0.03]">
                      <td className="px-5 py-3 font-semibold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{r.certificate_number ?? r.id}</td>
                      <td className="px-5 py-3 font-medium">{r.parties?.name ?? 'Sin dato'}</td>
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

            <div className="glass-card overflow-hidden rounded-xl">
              <div className="flex items-center justify-between border-b border-surface-variant/40 bg-white/40 px-6 py-4">
                <h2 className="font-semibold">Registros recientes</h2>
                <Link href="/tse/registros" className="text-xs font-medium text-primary hover:underline">Abrir registros</Link>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-surface-variant/30 bg-surface-container-low/40 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                  <tr><th className="px-5 py-2.5">ID</th><th className="px-5 py-2.5">Partido</th><th className="px-5 py-2.5">Titular actual</th><th className="px-5 py-2.5">Monto</th><th className="px-5 py-2.5">Estado</th></tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/20">
                  {bonds.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-sm text-on-surface-variant">No hay registros disponibles todavia.</td></tr>}
                  {bonds.slice(0, 5).map((b) => (
                    <tr key={b.token_id} className="bg-white/50 transition-colors hover:bg-primary/[0.03]">
                      <td className="px-5 py-3 font-semibold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{b.bond_id}</td>
                      <td className="px-5 py-3 font-medium">{b.parties?.name ?? 'Sin dato'}</td>
                      <td className="px-5 py-3 text-on-surface-variant">{b.profiles?.full_name ?? 'Sin dato'}</td>
                      <td className="px-5 py-3 font-semibold">{fmtMoney(b.face_value, b.currency)}</td>
                      <td className="px-5 py-3"><span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${CHIP[b.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="glass-card rounded-xl bg-white/50 p-5">
              <h2 className="mb-4 font-semibold">Acciones rapidas</h2>
              <div className="flex flex-col gap-2.5">
                {([
                  { href: '/tse/emision', label: 'Emitir registro', desc: 'Crear y emitir un nuevo bono', Icon: Send },
                  { href: '/tse/auditoria', label: 'Ver auditoria', desc: 'Consultar eventos auditables', Icon: Activity },
                  { href: '/tse/registros', label: 'Ver registros', desc: 'Consultar estado y detalle on-chain', Icon: CheckCircle },
                ] as const).map(({ href, label, desc, Icon }: any) => (
                  <Link key={href} href={href} className="group flex items-center justify-between rounded-xl border border-[#D5E3FF] bg-white p-3 transition-all hover:border-primary hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" strokeWidth={2.1} /></div>
                      <div><p className="text-sm font-semibold">{label}</p><p className="text-xs text-on-surface-variant">{desc}</p></div>
                    </div>
                    <span className="text-xs font-medium text-primary">Abrir</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="glass-card flex-1 rounded-xl bg-white/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Actividad reciente</h2>
                <Link href="/tse/auditoria" className="text-xs font-medium text-primary hover:underline">Ver historial</Link>
              </div>
              {events.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No se encontraron eventos de auditoria.</p>
              ) : (
                <div className="relative space-y-3 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-0.5 before:bg-surface-variant/60">
                  {events.map((ev) => (
                    <div key={ev.id} className="relative flex items-start gap-3">
                      <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-primary">
                        <CheckCircle size={14} />
                      </span>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold">{EVENT_LABELS[ev.type] ?? ev.type}</p>
                          <span className="shrink-0 text-[11px] text-on-surface-variant">{fmtDate(ev.created_at)}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant">{ev.bonds?.bond_id ?? 'Evento del sistema'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TSEShell>
  );
}
