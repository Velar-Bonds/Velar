'use client';
import { notify } from '../../../components/Toast';
import { useEffect, useState } from 'react';
import { Handshake, ArrowRight, Clock, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { PartidoShell } from '../../../components/PartidoShell';
import { ProvenanceDialog } from '../../../components/provenance/ProvenanceDialog';
import { PaginationControls } from '../../../components/PaginationControls';
import { useSession, apiFetch, type Me } from '../../../lib/api';
import { contractUrl } from '../../../lib/stellar';
import { paginatedQuery, paginationMeta, unwrapPaginated } from '../../../lib/pagination';

type Transfer = {
  id: string; status: string; amount: number | null;
  from_owner: string; to_owner: string; created_at?: string;
  bond_token_id?: string;
  bonds?: { bond_id?: string };
  from_profile?: { full_name?: string };
  to_profile?: { full_name?: string };
};

const STATUS_MAP: Record<string, [string, string]> = {
  solicitada: ['bg-blue-50 text-primary border-blue-200', 'Solicitada'],
  aceptada: ['bg-amber-50 text-amber-700 border-amber-200', 'Aceptada'],
  en_escrow: ['bg-amber-50 text-amber-700 border-amber-200', 'En escrow'],
  pago_registrado: ['bg-purple-50 text-purple-700 border-purple-200', 'Pago registrado'],
  pago_validado: ['bg-emerald-50 text-emerald-700 border-emerald-200', 'Pago validado'],
  liberada: ['bg-emerald-50 text-emerald-700 border-emerald-200', 'Completada'],
  cancelada: ['bg-gray-100 text-gray-500 border-gray-200', 'Cancelada'],
};

const ACTIVE = ['solicitada', 'aceptada', 'en_escrow', 'pago_registrado', 'pago_validado'];

const fmt = (n: number | null | undefined) => n == null ? '' : '₡' + Number(n).toLocaleString('es-CR');
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function PartidoNegociacionesPage() {
  const { token, me, loading, error } = useSession();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [provFor, setProvFor] = useState<string | null>(null);
  

  const load = (tok: string, p = page) => apiFetch(tok, 'GET', `/transfers?${paginatedQuery(p, limit)}`)
    .then((res) => {
      setTransfers(unwrapPaginated(res));
      setTotal(paginationMeta(res).total);
    })
    .catch((e: any) => notify.err(e.message));
  useEffect(() => { if (token) load(token, page); /* eslint-disable-next-line */ }, [token, page]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  async function act(id: string, action: string) {
    if (!token) return;
    let body: any = undefined;
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
      load(token, page);
    } catch (e: any) { notify.txError(e.message); }
    finally { setBusy(null); }
  }

  const soyVendedor = (t: Transfer) => t.from_owner === me.id;

  const actionsFor = (t: Transfer): Array<[string, string, string]> => {
    const vendedor = soyVendedor(t);
    const acts: Array<[string, string, string]> = [];
    if (t.status === 'solicitada' && vendedor) acts.push(['Aceptar', 'accept', 'primary']);
    if (t.status === 'pago_registrado' && vendedor) acts.push(['Confirmar pago', 'release', 'primary']);
    if (['solicitada', 'aceptada'].includes(t.status) && vendedor) acts.push(['Cancelar', 'cancel', 'danger']);
    // En escrow: el dueño no puede cancelar solo. Pide retiro al TSE.
    const hayRetornoPendiente = (t as any).return_requested_at && !(t as any).return_approved_at && !(t as any).return_rejected_at;
    if (['en_escrow', 'pago_registrado'].includes(t.status) && vendedor && !hayRetornoPendiente) {
      acts.push(['Pedir retiro al TSE', 'request-return', 'danger']);
    }
    return acts;
  };

  const activas = transfers.filter((t) => ACTIVE.includes(t.status) && soyVendedor(t));
  const historial = transfers.filter((t) => !ACTIVE.includes(t.status) && soyVendedor(t));

  const Card = ({ t }: { t: Transfer }) => {
    const [cls, lbl] = STATUS_MAP[t.status] ?? ['bg-gray-100 text-gray-500 border-gray-200', t.status];
    const acts = actionsFor(t);
    return (
      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Handshake size={20} /></span>
            <div>
              <p className="font-semibold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{t.bonds?.bond_id ?? 'Bono'}</p>
              <p className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                {t.from_profile?.full_name ?? '?'} <ArrowRight size={13} /> {t.to_profile?.full_name ?? '?'}
              </p>
              <p className="text-xs text-on-surface-variant">{fmtDate(t.created_at)}</p>
              {(t as any).escrow_contract_id && (
                <a
                  href={contractUrl((t as any).escrow_contract_id)}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-100"
                  title={(t as any).escrow_contract_id}
                >
                  Canasta on-chain (Trustless Work)
                </a>
              )}
              {t.bond_token_id && (
                <button
                  type="button"
                  onClick={() => setProvFor(t.bond_token_id ?? null)}
                  className="mt-1.5 ml-2 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-100"
                >
                  <ShieldCheck size={10} /> Procedencia
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {t.amount ? <span className="text-sm font-semibold">{fmt(t.amount)}</span> : null}
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>{lbl}</span>
            {acts.map(([label, action, variant]) => (
              <button key={action} onClick={() => act(t.id, action)} disabled={busy === t.id}
                className={`${variant === 'primary' ? 'btn-action btn-success' : 'btn-ghost btn-ghost-danger'} ${busy === t.id ? 'btn-loading' : ''}`}>
                {busy === t.id ? <span className="btn-spinner" /> : label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PartidoShell me={me}>
      <header className="sticky top-0 z-40 flex h-20 items-center border-b border-outline-variant/30 bg-surface/70 px-10 shadow-sm backdrop-blur-xl">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Geist' }}>Negociaciones</h1>
      </header>

      <div className="mx-auto w-full max-w-[1100px] p-10 pb-20">

        {/* Flujo visual */}
        <div className="mb-8 flex items-center gap-2 overflow-x-auto rounded-2xl border border-blue-100 bg-blue-50 px-6 py-4">
          {['Comprador solicita', 'Vos aceptás', 'Escrow activo', 'Comprador paga', 'Vos confirmás', 'Completado'].map((step, i, arr) => (
            <div key={step} className="flex shrink-0 items-center gap-2">
              <div className="text-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">{i + 1}</div>
                <p className="mt-1 text-[11px] font-medium text-primary/80">{step}</p>
              </div>
              {i < arr.length - 1 && <ArrowRight size={14} className="shrink-0 text-primary/40" />}
            </div>
          ))}
        </div>

        <h2 className="mb-3 text-lg font-semibold">Solicitudes activas</h2>
        {activas.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-outline-variant/40 py-14 text-center">
            <Handshake size={32} className="text-outline" />
            <p className="font-medium text-on-surface">Sin negociaciones activas</p>
            <p className="text-sm text-on-surface-variant">Cuando un comprador solicite adquirir uno de tus bonos, aparecerá acá.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">{activas.map((t) => <Card key={t.id} t={t} />)}</div>
        )}

        {historial.length > 0 && (
          <>
            <h2 className="mb-3 mt-10 text-lg font-semibold text-on-surface-variant">Historial</h2>
            <div className="flex flex-col gap-3 opacity-80">{historial.map((t) => <Card key={t.id} t={t} />)}</div>
          </>
        )}
        <PaginationControls page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>

      {provFor && (
        <ProvenanceDialog subjectId={provFor} mode="auth" token={token} onClose={() => setProvFor(null)} />
      )}
    </PartidoShell>
  );
}
