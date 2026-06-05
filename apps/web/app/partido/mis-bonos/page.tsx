'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet, Boxes, ExternalLink, ShoppingCart, TrendingUp } from 'lucide-react';
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
  issue_date?: string;
  maturity_date?: string;
  parties?: { name?: string };
};

const STATUS_MAP: Record<string, [string, string]> = {
  pendiente: ['bg-amber-50 text-amber-700 border-amber-200', 'Pendiente'],
  aprobado: ['bg-sky-50 text-sky-700 border-sky-200', 'Aprobado'],
  activo: ['bg-emerald-50 text-emerald-700 border-emerald-200', 'Activo'],
  en_venta: ['bg-purple-50 text-purple-700 border-purple-200', 'En marketplace'],
  en_escrow: ['bg-amber-50 text-amber-700 border-amber-200', 'En escrow'],
  vendido: ['bg-gray-100 text-gray-500 border-gray-200', 'Vendido'],
  rechazado: ['bg-red-50 text-red-600 border-red-200', 'Rechazado'],
  cancelado: ['bg-gray-100 text-gray-500 border-gray-200', 'Cancelado'],
};

const fmtMoney = (n: number | null | undefined, cur = 'CRC') => {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: cur || 'CRC', maximumFractionDigits: 0 }).format(n);
};
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Datos de seed visual para mostrar sin backend ───────────────────────────
const MOCK_BONDS: Bond[] = [
  {
    token_id: 'mock-1',
    bond_id: 'SOL-2026-001',
    status: 'activo',
    face_value: 5_000_000,
    currency: 'CRC',
    certificate_number: 'CERT-2026-001',
    interest_rate: 6.5,
    series: 'Serie A',
    issue_date: '2026-01-15',
    maturity_date: '2027-01-15',
  },
  {
    token_id: 'mock-2',
    bond_id: 'SOL-2026-002',
    status: 'en_venta',
    face_value: 2_500_000,
    currency: 'CRC',
    certificate_number: 'CERT-2026-002',
    interest_rate: 5.0,
    series: 'Serie A',
    issue_date: '2026-02-01',
    maturity_date: '2027-02-01',
  },
  {
    token_id: 'mock-3',
    bond_id: 'SOL-2026-003',
    status: 'activo',
    face_value: 10_000_000,
    currency: 'CRC',
    certificate_number: 'CERT-2026-003',
    interest_rate: null,
    series: 'Serie B',
    issue_date: '2026-03-10',
    maturity_date: '2028-03-10',
  },
  {
    token_id: 'mock-4',
    bond_id: 'SOL-2026-004',
    status: 'vendido',
    face_value: 1_800_000,
    currency: 'USD',
    certificate_number: 'CERT-2026-004',
    interest_rate: 4.75,
    series: 'Serie A',
    issue_date: '2026-01-20',
    maturity_date: '2026-07-20',
  },
];

export default function PartidoMisBonosPage() {
  const { token, me, loading, error } = useSession();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [useMock, setUseMock] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const load = (tok: string) =>
    apiFetch(tok, 'GET', '/bonds')
      .then((bs) => { if (Array.isArray(bs)) setBonds(bs); })
      .catch(() => { setBonds(MOCK_BONDS); setUseMock(true); });

  useEffect(() => { if (token) load(token); /* eslint-disable-next-line */ }, [token]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  // Si no hay datos reales, muestra seed
  const display = bonds.length > 0 ? bonds : MOCK_BONDS;

  async function publicar(tokenId: string) {
    if (!token || useMock) { setMsg('Esta es una vista de ejemplo.'); return; }
    setBusy(tokenId); setMsg('');
    try {
      await apiFetch(token, 'PATCH', `/bonds/${tokenId}/publish`);
      setMsg('Bono publicado en el marketplace.');
      load(token);
    } catch (e: any) { setMsg('⚠️ ' + e.message); } finally { setBusy(null); }
  }

  const totalCRC = display.filter((b) => (b.currency ?? 'CRC') === 'CRC').reduce((s, b) => s + (Number(b.face_value) || 0), 0);
  const activos = display.filter((b) => ['aprobado', 'activo'].includes(b.status)).length;
  const enVenta = display.filter((b) => b.status === 'en_venta').length;

  return (
    <PartidoShell me={me}>
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-outline-variant/30 bg-surface/70 px-10 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Geist' }}>Mis bonos</h1>
          {useMock && <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">Vista de ejemplo</span>}
        </div>
        <Link href="/partido/solicitar-bonos" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90">
          + Solicitar bono
        </Link>
      </header>

      <div className="mx-auto w-full max-w-[1200px] p-10 pb-20">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {([
            ['Total de bonos', display.length, <Boxes size={20} key="a" />],
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

        <div className="glass-card overflow-hidden rounded-2xl">
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
              {display.map((b) => {
                const [cls, lbl] = STATUS_MAP[b.status] ?? ['bg-gray-100 text-gray-600 border-gray-200', b.status];
                const canPublish = ['aprobado', 'activo'].includes(b.status);
                return (
                  <tr key={b.token_id} className="transition-colors hover:bg-primary/[0.02]">
                    <td className="px-5 py-3.5 font-semibold text-primary" style={{ fontFamily: 'JetBrains Mono' }}>{b.bond_id}</td>
                    <td className="px-5 py-3.5 text-on-surface-variant">{b.certificate_number ?? '—'}</td>
                    <td className="px-5 py-3.5 text-on-surface-variant">{b.series ?? '—'}</td>
                    <td className="px-5 py-3.5 font-semibold">{fmtMoney(b.face_value, b.currency)}</td>
                    <td className="px-5 py-3.5">{b.interest_rate != null ? `${b.interest_rate}%` : '—'}</td>
                    <td className="px-5 py-3.5 text-on-surface-variant">{fmtDate(b.maturity_date)}</td>
                    <td className="px-5 py-3.5"><span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>{lbl}</span></td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canPublish && (
                          <button onClick={() => publicar(b.token_id)} disabled={busy === b.token_id}
                            className={`btn-action ${busy === b.token_id ? 'btn-loading' : ''}`}>
                            {busy === b.token_id ? <><span className="btn-spinner" /> Publicando…</> : <><ShoppingCart size={12} /> Publicar</>}
                          </button>
                        )}
                        {!b.token_id.startsWith('mock') && (
                          <a href={bondAssetUrl(b.bond_id)} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-lg border border-outline-variant/40 px-2.5 py-1.5 text-xs text-on-surface-variant transition hover:text-primary">
                            <ExternalLink size={12} /> Stellar
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PartidoShell>
  );
}
