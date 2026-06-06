'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, ShieldCheck, Calendar, DollarSign, Percent, FileText,
  User, Hash, Boxes, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { TSEShell } from '../../../../components/TSEShell';
import { useSession, apiFetch } from '../../../../lib/api';

const fmtCRC = (n: number | null, cur = 'CRC') =>
  n == null ? 'Sin dato' : new Intl.NumberFormat('es-CR', { style: 'currency', currency: cur || 'CRC', maximumFractionDigits: 0 }).format(n);
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' }) : ':';
const shortKey = (k?: string | null, n = 6) =>
  !k ? 'Sin dato' : k.length > 2 * n + 3 ? `${k.slice(0, n)}…${k.slice(-n)}` : k;

const STATUS_LABELS: Record<string, string> = {
  Active: 'Activo',
  InEscrow: 'En custodia',
  Frozen: 'Congelado',
  Sold: 'Vendido',
  Cancelled: 'Cancelado',
  activo: 'Activo',
  en_venta: 'En venta',
  en_escrow: 'En custodia',
  vendido: 'Vendido',
  emitido: 'Emitido',
  congelado: 'Congelado',
};

function friendlySorobanReadError(message?: string) {
  if (!message) return 'Metadata pendiente de inicialización.';
  if (message.includes('Error(Contract, #2)')) {
    return 'Contrato desplegado, pero initialize no terminó. La metadata on-chain todavía no está disponible.';
  }
  if (message.includes('HostError')) {
    return 'La red Soroban devolvió un error al leer la metadata del contrato.';
  }
  return message.split('\n')[0].slice(0, 180);
}

export default function BonoDetallePage() {
  const { token, me, loading, error } = useSession();
  const params = useParams<{ tokenId: string }>();
  const tokenId = params?.tokenId;

  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!token || !tokenId) return;
    setErr('');
    apiFetch(token, 'GET', `/bonds/${tokenId}/soroban-details`)
      .then(setData)
      .catch(async (e: any) => {
        try {
          const bond = await apiFetch(token, 'GET', `/bonds/${tokenId}`);
          if (!bond?.soroban_contract_id) {
            setErr(e.message);
            return;
          }
          setData({
            source: 'database_snapshot',
            read_error: friendlySorobanReadError(e.message),
            contract_id: bond.soroban_contract_id,
            init_tx_hash: bond.soroban_init_tx_hash ?? null,
            bond_id: bond.bond_id,
            certificate_number: bond.certificate_number ?? null,
            series: bond.series ?? null,
            face_value: bond.face_value != null ? Number(bond.face_value) : null,
            currency: bond.currency ?? 'CRC',
            interest_rate: bond.interest_rate != null ? Number(bond.interest_rate) : null,
            issue_date: bond.issue_date ?? null,
            maturity_date: bond.maturity_date ?? null,
            document_hash_hex: bond.document_hash ?? null,
            current_owner: bond.profiles?.stellar_wallet ?? bond.current_owner ?? null,
            status: bond.status ?? null,
            created_at: bond.created_at ?? null,
            party_name: bond.parties?.name ?? null,
            party_code: bond.parties?.code ?? null,
          });
        } catch {
          setErr(e.message);
        }
      });
  }, [token, tokenId]);

  if (loading || !token || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 flex h-20 items-center gap-3 border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 backdrop-blur-md">
        <Link href="/tse/registros" className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary">
           Volver a registros
        </Link>
      </header>

      <div className="mx-auto w-full max-w-[1100px] p-8 pb-20">
        {err && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}

        {!data ? (
          <div className="flex h-64 items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Header del certificado */}
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-primary">
                  {data.source === 'soroban' ? 'Certificado on-chain' : 'Registro verificado en base de datos'}
                </p>
                <h1 className="mt-1 font-mono text-4xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {data.bond_id}
                </h1>
                <p className="mt-2 text-on-surface-variant">{data.party_name ?? 'Partido sin nombre'}</p>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${
                data.status === 'Active' || data.status === 'activo' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                data.status === 'Frozen' || data.status === 'congelado' ? 'border-red-200 bg-red-50 text-red-700' :
                data.status === 'InEscrow' || data.status === 'en_escrow' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                'border-slate-200 bg-slate-50 text-slate-700'
              }`}>
                <ShieldCheck size={14} /> {STATUS_LABELS[data.status] ?? data.status ?? 'Sin estado'}
              </span>
            </div>

            {data.source !== 'soroban' && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
                  <div>
                    <p className="font-semibold">La metadata Soroban aun no se pudo leer.</p>
                    <p className="mt-1 text-amber-800">
                      Mostramos los datos registrados por VELAR y el contract ID para verificación pública.
                      Motivo técnico: {friendlySorobanReadError(data.read_error)}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Card del certificado */}
            <div className="glass-card mb-6 rounded-3xl border-2 border-primary/10 bg-gradient-to-br from-white to-slate-50 p-8">
              <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container text-white shadow">
                    <Boxes size={22} strokeWidth={2.2} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">VELAR Bond</p>
                    <p className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>
                      {data.source === 'soroban' ? 'Soroban Smart Contract' : 'Soroban Contract ID'}
                    </p>
                  </div>
                </div>
                <a href={`https://stellar.expert/explorer/testnet/contract/${data.contract_id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5">
                  Ver on-chain 
                </a>
              </div>

              <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
                <Field icon={<FileText size={15} />} label="Número de certificado" value={data.certificate_number} />
                <Field icon={<Hash size={15} />} label="Serie / Lote" value={data.series} />
                <Field
                  icon={<DollarSign size={15} />}
                  label="Valor facial"
                  value={fmtCRC(data.face_value, data.currency)}
                  emphasis
                />
                <Field icon={<Percent size={15} />} label="Tasa de interés" value={data.interest_rate != null ? `${data.interest_rate}%` : ':'} />
                <Field icon={<Calendar size={15} />} label="Fecha de emisión" value={fmtDate(data.issue_date)} />
                <Field icon={<Calendar size={15} />} label="Vencimiento" value={fmtDate(data.maturity_date)} />
                <Field icon={<User size={15} />} label="Dueño actual" value={shortKey(data.current_owner, 8)} mono />
                <Field icon={<Boxes size={15} />} label="Registrado el" value={fmtDate(data.created_at)} />
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                  Hash del documento (SHA-256)
                </p>
                <p className="break-all font-mono text-[12px] text-slate-700">
                  {data.document_hash_hex ?? 'Sin dato'}
                </p>
                <p className="mt-2 text-[11px] text-on-surface-variant">
                  Cualquier persona puede descargar el certificado físico, calcular su SHA-256
                  y comparar con este hash para verificar que es el documento original.
                </p>
              </div>
            </div>

            {/* Verificación */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-emerald-900">¿Cómo verificar que estos datos son reales?</p>
                  <p className="mt-1 text-sm text-emerald-800/80">
                    {data.source === 'soroban'
                      ? 'Todos estos campos vienen leídos directamente del contrato Soroban en Stellar testnet. No salen de la base de datos de VELAR; salen de la red pública.'
                      : 'El contract ID viene del despliegue Soroban en Stellar testnet. La metadata legible se muestra desde VELAR porque initialize/details aun no esta disponible para este contrato.'}
                  </p>
                  <p className="mt-3 font-mono text-[11px] text-emerald-700">
                    Contract: <span className="break-all">{data.contract_id}</span>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </TSEShell>
  );
}

function Field({
  icon, label, value, mono, emphasis,
}: { icon: React.ReactNode; label: string; value: string | null; mono?: boolean; emphasis?: boolean }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
        <span className="text-primary/60">{icon}</span> {label}
      </p>
      <p
        className={`${mono ? 'font-mono text-[13px]' : ''} ${emphasis ? 'text-2xl font-bold text-slate-900' : 'text-base font-medium text-slate-900'}`}
        style={mono ? { fontFamily: 'JetBrains Mono, monospace' } : {}}
      >
        {value ?? 'Sin dato'}
      </p>
    </div>
  );
}
