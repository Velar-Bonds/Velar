'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet, Boxes, ShoppingCart } from 'lucide-react';
import { PartidoShell } from '../../../components/PartidoShell';
import { useSession, apiFetch } from '../../../lib/api';
import { bondAssetUrl } from '../../../lib/stellar';

type Bond = {
  token_id: string;
  bond_id: string;
  status: string;
  face_value: number | null;
  currency?: string;
  certificate_number?: string;
  interest_rate?: number | null;
  series?: string;
  maturity_date?: string;
};

const STATUS_MAP: Record<string, [string, string]> = {
  pendiente: ['bg-amber-50 text-amber-700 border-amber-200', 'Pendiente'],
  aprobado: ['bg-sky-50 text-sky-700 border-sky-200', 'Aprobado'],
  activo: ['bg-emerald-50 text-emerald-700 border-emerald-200', 'Activo'],
  en_venta: ['bg-blue-50 text-primary border-blue-200', 'En marketplace'],
  en_escrow: ['bg-amber-50 text-amber-700 border-amber-200', 'En escrow'],
  vendido: ['bg-gray-100 text-gray-500 border-gray-200', 'Vendido'],
  rechazado: ['bg-red-50 text-red-600 border-red-200', 'Rechazado'],
  cancelado: ['bg-gray-100 text-gray-500 border-gray-200', 'Cancelado'],
};

const fmtMoney = (n: number | null | undefined, cur = 'CRC') =>
  n == null
    ? 'Sin monto'
    : new Intl.NumberFormat('es-CR', { style: 'currency', currency: cur || 'CRC', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha';

export default function PartidoMisBonosPage() {
  const { token, me, loading, error } = useSession();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [loadError, setLoadError] = useState('');

  const load = (tok: string) =>
    apiFetch(tok, 'GET', '/bonds')
      .then((bs) => {
        setLoadError('');
        setBonds(Array.isArray(bs) ? bs : []);
      })
      .catch((e: any) => {
        setBonds([]);
        setLoadError(e.message ?? 'No se pudieron cargar los bonos.');
      });

  useEffect(() => {
    if (token) load(token);
  }, [token]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  async function publicar(tokenId: string) {
    setBusy(tokenId);
    setMsg('');
    try {
      await apiFetch(token, 'PATCH', `/bonds/${tokenId}/publish`);
      setMsg('Bono publicado en el marketplace.');
      load(token);
    } catch (e: any) {
      setMsg(e.message ?? 'No se pudo publicar el bono.');
    } finally {
      setBusy(null);
    }
  }

  const totalCRC = bonds.filter((b) => (b.currency ?? 'CRC') === 'CRC').reduce((s, b) => s + (Number(b.face_value) || 0), 0);
  const enVenta = bonds.filter((b) => b.status === 'en_venta').length;

  return (
    <PartidoShell me={me}>
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-outline-variant/30 bg-surface/70 px-10 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Geist' }}>Mis bonos</h1>
        </div>
        <Link href="/partido/solicitar-bonos" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90">
          + Solicitar bono
        </Link>
      </header>

      <div className="mx-auto w-full max-w-[1200px] p-10 pb-20">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {([
            ['Total de bonos', bonds.length, <Boxes size={20} key="a" />],
            ['Valor total (CRC)', fmtMoney(totalCRC), <Wallet size={20} key="b" />],
            ['En marketplace', enVenta, <ShoppingCart size={20} key="c" />],
          ] as const).map(([label, val, icon]: any) => (
            <div key={label} className="glass-card flex items-center gap-4 rounded-2xl p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">{label}</p>
                <p className="text-2xl font-bold">{val}</p>
              </div>
            </div>
          ))}
        </div>

        {msg && <div className="mb-4 rounded-xl border border-[#d8e2f5] bg-white px-4 py-2.5 text-sm">{msg}</div>}
        {loadError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{loadError}</div>}

        <div className="glass-card overflow-hidden rounded-2xl">
          {bonds.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-on-surface-variant">
              No hay registros disponibles todavia.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-outline-variant/30 bg-surface-container-low/60 text-[11px] uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3">ID del bono</th>
                  <th className="px-5 py-3">Certificado</th>
                  <th className="px-5 py-3">Serie</th>
                  <th className="px-5 py-3">Monto</th>
                  <th className="px-5 py-3">Tasa</th>
                  <th className="px-5 py-3">Vencimiento</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {bonds.map((b) => {
                  const [cls, lbl] = STATUS_MAP[b.status] ?? ['bg-gray-100 text-gray-600 border-gray-200', b.status];
                  const canPublish = ['aprobado', 'activo'].includes(b.status);
                  return (
                    <tr key={b.token_id} className="transition-colors hover:bg-primary/[0.02]">
                      <td className="px-5 py-3.5 font-semibold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{b.bond_id}</td>
                      <td className="px-5 py-3.5 text-on-surface-variant">{b.certificate_number ?? 'Sin dato'}</td>
                      <td className="px-5 py-3.5 text-on-surface-variant">{b.series ?? 'Sin dato'}</td>
                      <td className="px-5 py-3.5 font-semibold">{fmtMoney(b.face_value, b.currency)}</td>
                      <td className="px-5 py-3.5">{b.interest_rate != null ? `${b.interest_rate}%` : 'Sin dato'}</td>
                      <td className="px-5 py-3.5 text-on-surface-variant">{fmtDate(b.maturity_date)}</td>
                      <td className="px-5 py-3.5"><span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>{lbl}</span></td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canPublish && (
                            <button onClick={() => publicar(b.token_id)} disabled={busy === b.token_id} className={`btn-action ${busy === b.token_id ? 'btn-loading' : ''}`}>
                              {busy === b.token_id ? <><span className="btn-spinner" /> Publicando...</> : <><ShoppingCart size={12} /> Publicar</>}
                            </button>
                          )}
                          <a href={bondAssetUrl(b.bond_id)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg border border-outline-variant/40 px-2.5 py-1.5 text-xs text-on-surface-variant transition hover:text-primary">
                            Stellar
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PartidoShell>
  );
}
