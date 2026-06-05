'use client';
import { useEffect, useState } from 'react';
import { Handshake, ArrowRight } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { StatusBadge, EmptyState, fmtMoney, fmtDate } from '../../components/ui';
import { apiFetch, type Me } from '../../lib/api';

type Transfer = {
  id: string; status: string; amount: number | null; from_owner: string; to_owner: string;
  bonds?: { bond_id?: string }; from_profile?: { full_name?: string }; to_profile?: { full_name?: string };
  created_at?: string;
};

const ACTIVE = ['solicitada', 'aceptada', 'en_escrow', 'pago_registrado', 'pago_validado'];

export default function NegociacionesPage() {
  return <AppShell>{({ token, me }) => <Content token={token} me={me} />}</AppShell>;
}

function Content({ token, me }: { token: string; me: Me }) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => apiFetch(token, 'GET', '/transfers').then(setTransfers).catch((e) => setMsg(e.message));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function act(id: string, action: string) {
    setBusy(id); setMsg('');
    try { await apiFetch(token, 'PATCH', `/transfers/${id}/${action}`, action === 'payment' ? { evidence: 'comprobante-' + Date.now() } : undefined); setMsg('✅ Acción realizada'); load(); }
    catch (e: any) { setMsg('⚠️ ' + e.message); } finally { setBusy(null); }
  }

  const actionFor = (t: Transfer): [string, string] | null => {
    const soyVendedor = t.from_owner === me.id, soyComprador = t.to_owner === me.id;
    if (t.status === 'solicitada' && soyVendedor) return ['Aceptar venta', 'accept'];
    if (t.status === 'en_escrow' && soyComprador) return ['Registré el pago', 'payment'];
    if (t.status === 'pago_registrado' && soyVendedor) return ['Confirmar pago', 'release'];
    return null;
  };

  const activas = transfers.filter((t) => ACTIVE.includes(t.status));
  const historial = transfers.filter((t) => !ACTIVE.includes(t.status));

  const Row = ({ t }: { t: Transfer }) => {
    const a = actionFor(t);
    const cancelable = ['solicitada', 'aceptada', 'en_escrow'].includes(t.status);
    return (
      <div className="velar-hover-card glass-card flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container/10 text-primary-container"><Handshake size={20} /></span>
          <div>
            <div className="mono-data text-sm font-semibold text-primary-container">{t.bonds?.bond_id ?? 'Bono'}</div>
            <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">{t.from_profile?.full_name ?? '?'} <ArrowRight size={13} /> {t.to_profile?.full_name ?? '?'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {t.amount ? <span className="mono-data text-sm font-semibold">{fmtMoney(t.amount)}</span> : null}
          <StatusBadge status={t.status} />
          {a && <button onClick={() => act(t.id, a[1])} disabled={busy === t.id} className={`btn-action ${busy === t.id ? 'btn-loading' : ''}`}>{busy === t.id ? <><span className="btn-spinner" /> Procesando…</> : a[0]}</button>}
          {cancelable && <button onClick={() => act(t.id, 'cancel')} disabled={busy === t.id} className="btn-ghost">Cancelar</button>}
        </div>
      </div>
    );
  };

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold tracking-tight md:text-4xl" style={{ fontFamily: 'Geist' }}>Negociaciones</h1>
      <p className="mb-6 text-on-surface-variant">Compras, ventas, ofertas activas e historial de transacciones.</p>
      {msg && <div className="mb-4 rounded-xl border border-[#d8e2f5] bg-white px-4 py-2.5 text-sm">{msg}</div>}

      <h2 className="mb-3 text-lg font-semibold">Ofertas activas</h2>
      {activas.length === 0
        ? <EmptyState icon={<Handshake size={26} />} title="Sin negociaciones activas" desc="Solicitá comprar un bono en el marketplace o aceptá una solicitud para empezar." />
        : <div className="velar-stagger flex flex-col gap-3">{activas.map((t) => <Row key={t.id} t={t} />)}</div>}

      {historial.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-lg font-semibold">Historial</h2>
          <div className="flex flex-col gap-3 opacity-90">{historial.map((t) => <Row key={t.id} t={t} />)}</div>
        </>
      )}
    </>
  );
}
