'use client';
import { notify } from '../../components/Toast';
import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRightLeft, FileText, Handshake, Landmark, Wallet } from 'lucide-react';
import Link from 'next/link';
import { PartidoShell } from '../../components/PartidoShell';
import { useSession } from '../../lib/api';
import { apiFetch } from '../../lib/api';
import { unwrapPaginated } from '../../lib/pagination';

const fmt = (n: number | null | undefined, cur = 'CRC') => {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: cur || 'CRC', maximumFractionDigits: 0 }).format(n);
};


const reqChip: Record<string, [string, string, string]> = {
  solicitada: ['bg-blue-50 text-primary border-blue-100', 'bg-primary', 'Solicitada'],
  en_escrow: ['bg-amber-50 text-amber-700 border-amber-100', 'bg-amber-500', 'En canasta'],
  pago_registrado: ['bg-purple-50 text-purple-600 border-purple-100', 'bg-purple-600', 'Pago registrado'],
  liberada: ['bg-emerald-50 text-emerald-600 border-emerald-100', 'bg-emerald-600', 'Vendido'],
};

function actionFor(t: any): [string, string] | null {
  if (t.status === 'solicitada') return ['Aceptar', 'accept'];
  if (t.status === 'pago_registrado') return ['Confirmar pago', 'release'];
  return null;
}

export default function PartidoPageClient() {
  const { token, me, loading, error } = useSession();
  const [bonds, setBonds] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  
  const [busy, setBusy] = useState<string | null>(null);

  const load = (tok: string) =>
    Promise.all([
      apiFetch(tok, 'GET', '/bonds?page=1&limit=20').catch(() => null),
      apiFetch(tok, 'GET', '/transfers?page=1&limit=20').catch(() => null),
    ]).then(([bs, trs]) => {
      setBonds(unwrapPaginated(bs ?? []));
      setTransfers(unwrapPaginated(trs ?? []));
    });

  useEffect(() => { if (token) load(token); /* eslint-disable-next-line */ }, [token]);

  async function act(id: string, action: string) {
    if (!token) return;
    setBusy(id); 
    try { const res = await apiFetch(token, 'PATCH', `/transfers/${id}/${action}`); notify.tx(res?.txHash ?? res?.returnTx, 'Acción realizada'); load(token); }
    catch (e: any) { notify.err(e.message); } finally { setBusy(null); }
  }

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error
          ? <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">{error}</div>
          : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  const myTransfers = transfers.filter((t) => t.from_owner === me.id);
  const ventas = myTransfers.filter((t) => t.status === 'liberada');
  const ingresos = ventas.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const pending = myTransfers.filter((t) => !['liberada', 'cancelada'].includes(t.status));

  const metrics: Array<{ label: string; value: number | string; Icon: LucideIcon; color: string }> = [
    { label: 'Solicitudes de compra', value: myTransfers.filter((t) => t.status === 'solicitada').length, Icon: FileText, color: 'text-primary' },
    { label: 'Bonos a mi nombre', value: bonds.length, Icon: Landmark, color: 'text-emerald-600' },
    { label: 'Ventas completadas', value: ventas.length, Icon: Handshake, color: 'text-purple-600' },
    { label: 'Ingresos generados', value: fmt(ingresos), Icon: Wallet, color: 'text-emerald-600' },
  ];

  return (
    <PartidoShell me={me}>
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-outline-variant/30 bg-surface/70 px-10 shadow-sm backdrop-blur-xl">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Geist' }}>Panel del Partido</h1>
        <Link href="/partido/solicitar-bonos" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90">
          + Solicitar bono
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 p-10 pb-20">

        {/* Métricas */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map(({ label, value, Icon, color }, i) => (
            <div key={label} className={`glass-card rounded-2xl p-6 ${i === 3 ? 'border-t-[1.5px] border-t-primary-container' : ''}`} style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
              <p className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">{label}</p>
              <div className="mt-1 flex items-center gap-2">
                <Icon className={`h-6 w-6 ${color}`} strokeWidth={2.1} />
                <h2 className="text-[22px] font-bold">{value}</h2>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Solicitudes de compra */}
            <div className="glass-card flex flex-col gap-6 rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold" style={{ fontFamily: 'Geist' }}>Solicitudes de compra</h3>
                <Link href="/partido/negociaciones" className="text-xs font-medium text-primary hover:underline">Ver todas</Link>
              </div>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
                    <th className="pb-3">Bono</th><th className="pb-3">Comprador</th><th className="pb-3">Estado</th><th className="pb-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {pending.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-on-surface-variant">No hay solicitudes pendientes.</td></tr>}
                  {pending.slice(0, 5).map((t) => {
                    const chip = reqChip[t.status] ?? ['bg-gray-100 text-gray-600 border-gray-200', 'bg-gray-400', t.status];
                    const a = actionFor(t);
                    return (
                      <tr key={t.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50">
                        <td className="py-3 font-medium text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{t.bonds?.bond_id ?? '—'}</td>
                        <td className="py-3 text-on-surface-variant">{t.to_profile?.full_name ?? '—'}</td>
                        <td className="py-3"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${chip[0]}`}><span className={`h-1.5 w-1.5 rounded-full ${chip[1]}`} />{chip[2]}</span></td>
                        <td className="py-3 text-right">{a ? <button onClick={() => act(t.id, a[1])} disabled={busy === t.id} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60">{a[0]}</button> : <span className="text-xs text-on-surface-variant">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mis bonos */}
            <div className="glass-card flex flex-col gap-4 rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold" style={{ fontFamily: 'Geist' }}>Mis bonos</h3>
                <Link href="/partido/mis-bonos" className="text-xs font-medium text-primary hover:underline">Ver todos</Link>
              </div>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-[10px] font-medium uppercase tracking-wider text-on-surface-variant">
                    <th className="pb-3">ID del bono</th><th className="pb-3">Serie</th><th className="pb-3">Monto</th><th className="pb-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {bonds.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-on-surface-variant">El TSE aún no te emitió bonos.</td></tr>}
                  {bonds.slice(0, 5).map((b) => (
                    <tr key={b.token_id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50">
                      <td className="py-3 font-medium text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{b.bond_id}</td>
                      <td className="py-3 text-on-surface-variant">{b.series ?? '—'}</td>
                      <td className="py-3 font-semibold">{fmt(b.face_value, b.currency)}</td>
                      <td className="py-3"><span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="glass-card flex flex-col gap-4 rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.7)' }}>
            <h3 className="text-xl font-semibold" style={{ fontFamily: 'Geist' }}>Actividad reciente</h3>
            <div className="relative flex flex-col">
              <div className="absolute bottom-4 left-[19px] top-4 -z-10 w-0.5 bg-outline-variant/30" />
              {transfers.slice(0, 6).map((t) => (
                <div key={t.id} className="flex gap-4 py-3">
                  <div className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-primary">
                    <ArrowRightLeft className="h-4 w-4" strokeWidth={2.1} />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-medium">{t.bonds?.bond_id ?? 'Bono'} · {t.status}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{t.from_profile?.full_name ?? '?'} → {t.to_profile?.full_name ?? '?'}</p>
                  </div>
                </div>
              ))}
              {transfers.length === 0 && <p className="text-sm text-on-surface-variant">Sin actividad todavía.</p>}
            </div>
          </div>
        </div>
      </div>
    </PartidoShell>
  );
}
