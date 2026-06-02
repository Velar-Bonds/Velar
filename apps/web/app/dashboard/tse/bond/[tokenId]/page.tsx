'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getApiClient } from '../../../../../lib/api/client';

const EVENT_LABELS: Record<string, string> = {
  bond_emitido: 'Bono emitido', bond_asignado: 'Bono asignado',
  transfer_solicitada: 'Transferencia solicitada', transfer_aceptada: 'Transferencia aceptada',
  escrow_bloqueado: 'Token bloqueado en escrow', pago_registrado: 'Pago registrado',
  pago_validado: 'Pago validado', token_liberado: 'Token liberado al nuevo dueño',
  transfer_rechazada: 'Transferencia rechazada', transfer_cancelada: 'Transferencia cancelada',
  bond_congelado: 'Bono congelado por TSE', bond_descongelado: 'Bono descongelado', bond_cancelado: 'Bono cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  emitido: 'bg-gray-100 text-gray-700', activo: 'bg-green-100 text-green-700',
  en_escrow: 'bg-yellow-100 text-yellow-700', transferido: 'bg-blue-100 text-blue-700',
  cancelado: 'bg-red-100 text-red-700', congelado: 'bg-purple-100 text-purple-700',
  solicitada: 'bg-gray-100 text-gray-700', aceptada: 'bg-blue-100 text-blue-700',
  pago_registrado: 'bg-orange-100 text-orange-700', pago_validado: 'bg-indigo-100 text-indigo-700',
  liberada: 'bg-green-100 text-green-700',
};

export default function BondTimelinePage() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const router = useRouter();
  const [data, setData] = useState<{ bond: any; events: any[]; transfers: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const api = await getApiClient();
        const { data: d } = await api.get(`/audit/bonds/${tokenId}/timeline`);
        setData(d);
      } finally { setLoading(false); }
    })();
  }, [tokenId]);

  if (loading) return <div className="text-center py-12 text-gray-400">Cargando timeline...</div>;
  if (!data) return <div className="text-center py-12 text-red-500">Bono no encontrado.</div>;

  const { bond, events, transfers } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-blue-700 hover:underline text-sm">← Volver</button>
        <h1 className="text-2xl font-bold text-blue-900">Timeline del Bono</h1>
      </div>
      <div className="bg-white rounded-xl shadow p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div><p className="text-xs text-gray-500">Código</p><p className="font-mono font-semibold">{bond.bond_id}</p></div>
        <div><p className="text-xs text-gray-500">Partido emisor</p><p className="font-semibold">{bond.parties?.name}</p></div>
        <div><p className="text-xs text-gray-500">Estado</p><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[bond.status] ?? 'bg-gray-100 text-gray-600'}`}>{bond.status}</span></div>
        <div><p className="text-xs text-gray-500">Dueño actual</p><p className="text-sm">{bond.profiles?.full_name ?? '—'}</p><p className="text-xs text-gray-400">{bond.profiles?.email}</p></div>
        <div className="col-span-2"><p className="text-xs text-gray-500">Token ID</p><p className="font-mono text-xs break-all">{bond.token_id}</p></div>
        <div className="col-span-2"><p className="text-xs text-gray-500">Hash del documento</p><p className="font-mono text-xs break-all">{bond.document_hash}</p></div>
      </div>
      {transfers.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Historial de traspasos</h2>
          {transfers.map((t, i) => (
            <div key={t.id} className="border rounded-xl p-4 mb-3 text-sm">
              <div className="flex justify-between"><span className="text-xs text-gray-400">Traspaso #{i+1}</span><span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[t.status] ?? ''}`}>{t.status}</span></div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div><p className="text-xs text-gray-500">Vendedor</p><p>{t.from_profile?.full_name}</p></div>
                <div><p className="text-xs text-gray-500">Comprador</p><p>{t.to_profile?.full_name}</p></div>
                {t.payment_evidence_hash && <div className="col-span-2"><p className="text-xs text-gray-500">Hash evidencia pago</p><p className="font-mono text-xs break-all">{t.payment_evidence_hash}</p></div>}
                {t.escrow_contract_id && <div className="col-span-2"><p className="text-xs text-gray-500">Contrato escrow</p><p className="font-mono text-xs break-all">{t.escrow_contract_id}</p></div>}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Eventos de auditoría ({events.length})</h2>
        <ol className="relative border-l border-blue-200 space-y-6 ml-3">
          {events.map(ev => (
            <li key={ev.id} className="ml-6">
              <span className="absolute -left-2 w-4 h-4 bg-blue-900 rounded-full border-2 border-white" />
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-blue-900">{EVENT_LABELS[ev.type] ?? ev.type}</span>
                  <span className="text-xs text-gray-400">{new Date(ev.created_at).toLocaleString('es-CR')}</span>
                </div>
                {ev.tx_hash && <p className="text-xs font-mono text-gray-400 break-all">TX: {ev.tx_hash}</p>}
                {ev.payload && Object.keys(ev.payload).length > 0 && (
                  <pre className="text-xs bg-white border rounded p-2 mt-2 overflow-x-auto">{JSON.stringify(ev.payload, null, 2)}</pre>
                )}
              </div>
            </li>
          ))}
          {events.length === 0 && <li className="ml-6 text-gray-400 text-sm">Sin eventos registrados.</li>}
        </ol>
      </div>
    </div>
  );
}
