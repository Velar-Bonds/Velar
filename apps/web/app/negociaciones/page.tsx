'use client';
import { notify } from '../../components/Toast';
import { useEffect, useState } from 'react';
import { Handshake, Shield } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { PaginationControls } from '../../components/PaginationControls';
import { StatusBadge, EmptyState, fmtMoney } from '../../components/ui';
import { PAYMENT_METHOD_META } from '../../components/PaymentMethodPicker';
import { apiFetch, type Me } from '../../lib/api';
import { contractUrl } from '../../lib/stellar';
import { useWallet } from '../../lib/wallet';
import { paginatedQuery, paginationMeta, unwrapPaginated } from '../../lib/pagination';

/** Camino no-custodial (firma con la wallet propia), detrás de flag. Off por defecto. */
const SELF_CUSTODY = process.env.NEXT_PUBLIC_SELF_CUSTODY === '1';

type Transfer = {
  id: string; status: string; amount: number | null; from_owner: string; to_owner: string;
  payment_method?: string | null;
  bonds?: { bond_id?: string }; from_profile?: { full_name?: string }; to_profile?: { full_name?: string };
  created_at?: string;
  escrow_contract_id?: string | null;
};

const ACTIVE = ['solicitada', 'aceptada', 'en_escrow', 'pago_registrado', 'pago_validado'];

export default function NegociacionesPage() {
  return <AppShell>{({ token, me }) => <Content token={token} me={me} />}</AppShell>;
}

function Content({ token, me }: { token: string; me: Me }) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const wallet = useWallet();
  const [busy, setBusy] = useState<string | null>(null);

  const load = (p = page) => apiFetch(token, 'GET', `/transfers?${paginatedQuery(p, limit)}`)
    .then((res) => {
      setTransfers(unwrapPaginated(res));
      setTotal(paginationMeta(res).total);
    })
    .catch((e) => notify.err(e.message));
  useEffect(() => { load(page); /* eslint-disable-next-line */ }, [page]);

  async function payWithWallet(id: string) {
    if (!wallet.isConnected) {
      try { await wallet.connect(); }
      catch { notify.err('Conecta una wallet Stellar para pagar con USDC.'); return; }
    }
    if (wallet.wrongNetwork) {
      notify.err('Cambia tu wallet a la red TESTNET para pagar.');
      return;
    }
    setBusy(id);
    try {
      const built: any = await apiFetch(token, 'POST', `/transfers/${id}/build-wallet-payment-xdr`);
      const signed = await wallet.signXdr(built.xdr);
      const res: any = await apiFetch(token, 'POST', `/transfers/${id}/submit-wallet-payment-xdr`, { signedXdr: signed });
      notify.tx(res?.txHash, `Liquidación DvP: pagaste ${built.usdcAmount} USDC y recibiste el bono.`);
      load(page);
    } catch (e: any) { notify.txError(e?.message ?? 'No se pudo completar el pago con wallet'); }
    finally { setBusy(null); }
  }

  async function act(id: string, action: string) {
    if (action === 'wallet-payment') { await payWithWallet(id); return; }
    let body: any = undefined;
    if (action === 'payment') body = { evidence: 'comprobante-' + Date.now() };
    if (action === 'request-return') {
      const reason = window.prompt('Motivo del retiro (lo verá el TSE):');
      if (!reason || !reason.trim()) return;
      body = { reason: reason.trim() };
    }
    setBusy(id); 
    try {
      const res = await apiFetch(token, 'PATCH', `/transfers/${id}/${action}`, body);
      const msg = action === 'request-return' ? 'Solicitud enviada al TSE' : 'Acción realizada';
      notify.tx(res?.txHash ?? res?.returnTx, msg);
      load(page);
    } catch (e: any) { notify.txError(e.message); }
    finally { setBusy(null); }
  }

  // Self-custody: el vendedor firma la transferencia con la wallet Stellar seleccionada.
  // build-xdr (backend) -> signTransaction (Stellar Wallets Kit) -> submit-xdr (backend).
  async function signSelfCustody(id: string) {
    if (!wallet.isConnected) { notify.err('Conecta una wallet Stellar primero con el boton "Conectar wallet".'); return; }
    if (wallet.wrongNetwork) { notify.err('Cambia tu wallet a la red TESTNET para firmar.'); return; }
    setBusy(id);
    try {
      const built = await apiFetch(token, 'POST', `/transfers/${id}/build-xdr`);
      const signedXdr = await wallet.signXdr(built.xdr);
      const res = await apiFetch(token, 'POST', `/transfers/${id}/submit-xdr`, { signedXdr });
      notify.tx(res?.txHash, 'Transferencia firmada y enviada con tu wallet.');
      load(page);
    } catch (e: any) { notify.txError(e?.message ?? 'No se pudo firmar la transferencia'); }
    finally { setBusy(null); }
  }

  const canSelfCustody = (t: Transfer) =>
    SELF_CUSTODY && t.from_owner === me.id &&
    ['aceptada', 'en_escrow', 'pago_registrado'].includes(t.status);

  const actionFor = (t: Transfer): [string, string] | null => {
    const soyVendedor = t.from_owner === me.id, soyComprador = t.to_owner === me.id;
    if (t.status === 'solicitada' && soyVendedor) return ['Aceptar venta', 'accept'];
    if (t.status === 'aceptada' && soyComprador && t.payment_method === 'wallet') {
      return ['Pagar con wallet (USDC)', 'wallet-payment'];
    }
    if (t.status === 'en_escrow' && soyComprador && t.payment_method !== 'wallet') {
      return ['Registré el pago', 'payment'];
    }
    if (t.status === 'pago_registrado' && soyVendedor) return ['Confirmar pago', 'release'];
    if (['en_escrow', 'pago_registrado'].includes(t.status) && soyVendedor && !(t as any).return_requested_at) {
      return ['Pedir retiro al TSE', 'request-return'];
    }
    return null;
  };

  const activas = transfers.filter((t) => ACTIVE.includes(t.status));
  const historial = transfers.filter((t) => !ACTIVE.includes(t.status));

  const Row = ({ t }: { t: Transfer }) => {
    const a = actionFor(t);
    const cancelable = ['solicitada', 'aceptada', 'en_escrow'].includes(t.status);
    const payMeta = t.payment_method
      ? PAYMENT_METHOD_META[t.payment_method as keyof typeof PAYMENT_METHOD_META]
      : null;
    const PayIcon = payMeta?.Icon;
    return (
      <div className="velar-hover-card glass-card flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container/10 text-primary-container"><Handshake size={20} /></span>
          <div>
            <div className="mono-data text-sm font-semibold text-primary-container">{t.bonds?.bond_id ?? 'Bono'}</div>
            <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">{t.from_profile?.full_name ?? '?'}  {t.to_profile?.full_name ?? '?'}</div>
            {payMeta && PayIcon && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-outline-variant/40 bg-surface-container-low px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">
                <PayIcon size={10} /> Pago: {payMeta.label}
              </span>
            )}
            {t.status === 'aceptada' && t.payment_method === 'wallet' && t.to_owner === me.id && (
              <p className="mt-1.5 text-xs text-violet-700">El vendedor aceptó. Pagá con Freighter para recibir el bono (DvP atómico).</p>
            )}
            {t.escrow_contract_id && (
              <a
                href={contractUrl(t.escrow_contract_id)}
                target="_blank" rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-100"
                title={t.escrow_contract_id}
              >
                <Shield size={10} /> Canasta on-chain (Trustless Work)
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {t.amount ? <span className="mono-data text-sm font-semibold">{fmtMoney(t.amount)}</span> : null}
          <StatusBadge status={t.status} />
          {a && (
            <button
              onClick={() => act(t.id, a[1])}
              disabled={busy === t.id}
              className={`btn-action ${a[1] === 'wallet-payment' ? 'bg-violet-600 hover:bg-violet-700' : ''} ${busy === t.id ? 'btn-loading' : ''}`}
            >
              {busy === t.id ? <span className="btn-spinner" /> : a[0]}
            </button>
          )}
          {canSelfCustody(t) && <button onClick={() => signSelfCustody(t.id)} disabled={busy === t.id} className="btn-ghost" title="Firmar la transferencia con tu propia wallet (no custodial)">Firmar con mi wallet</button>}
          {cancelable && <button onClick={() => act(t.id, 'cancel')} disabled={busy === t.id} className="btn-ghost btn-ghost-danger">Cancelar</button>}
        </div>
      </div>
    );
  };

  return (
    <>
      <h1 className="mb-1 text-3xl font-bold tracking-tight md:text-4xl" style={{ fontFamily: 'Geist' }}>Negociaciones</h1>
      <p className="mb-6 text-on-surface-variant">Compras, ventas, ofertas activas e historial. Si elegiste pago con wallet, liquidás acá tras la aceptación del vendedor.</p>

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
      <PaginationControls page={page} limit={limit} total={total} onPageChange={setPage} />
    </>
  );
}
