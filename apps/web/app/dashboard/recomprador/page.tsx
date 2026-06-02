'use client';
import { useState, useEffect } from 'react';
import { getApiClient } from '../../../lib/api/client';

export default function RecompradorDashboard() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [myBonds, setMyBonds] = useState<any[]>([]);
  const [evidenceContent, setEvidenceContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});

  const load = async () => {
    const api = await getApiClient();
    const [t, b] = await Promise.all([api.get('/transfers'), api.get('/bonds')]);
    setTransfers(t.data);
    setMyBonds(b.data);
  };

  useEffect(() => { load(); }, []);

  const act = async (transferId: string, action: string) => {
    setLoading(l => ({ ...l, [transferId]: true }));
    setMsg(m => ({ ...m, [transferId]: '' }));
    try {
      const api = await getApiClient();
      if (action === 'accept') await api.patch(`/transfers/${transferId}/accept`);
      else if (action === 'payment') await api.patch(`/transfers/${transferId}/payment`, { evidenceContent: evidenceContent[transferId] ?? '' });
      else if (action === 'cancel') await api.patch(`/transfers/${transferId}/cancel`);
      setMsg(m => ({ ...m, [transferId]: 'Acción completada.' }));
      await load();
    } catch (err: any) {
      setMsg(m => ({ ...m, [transferId]: 'Error: ' + (err.response?.data?.message ?? err.message) }));
    } finally {
      setLoading(l => ({ ...l, [transferId]: false }));
    }
  };

  const pending = transfers.filter(t => t.status === 'solicitada');
  const inProgress = transfers.filter(t => ['aceptada', 'en_escrow', 'pago_registrado'].includes(t.status));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-blue-900">Panel del Recomprador</h1>

      {myBonds.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Mis bonos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {myBonds.map(b => (
              <div key={b.token_id} className="border rounded-xl p-3 text-sm">
                <p className="font-mono font-semibold">{b.bond_id}</p>
                <p className="text-gray-500 text-xs">{b.parties?.name}</p>
                <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 mt-1 inline-block">{b.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Solicitudes de compra pendientes</h2>
        {pending.length === 0 ? <p className="text-gray-500 text-sm">Sin solicitudes pendientes.</p> :
          pending.map(t => (
            <TransferCard key={t.id} transfer={t} loading={!!loading[t.id]} message={msg[t.id]}>
              <button onClick={() => act(t.id, 'accept')} disabled={!!loading[t.id]}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                Aceptar
              </button>
              <button onClick={() => act(t.id, 'cancel')} disabled={!!loading[t.id]}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                Rechazar
              </button>
            </TransferCard>
          ))
        }
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Transferencias en proceso</h2>
        {inProgress.length === 0 ? <p className="text-gray-500 text-sm">Sin transferencias en proceso.</p> :
          inProgress.map(t => (
            <TransferCard key={t.id} transfer={t} loading={!!loading[t.id]} message={msg[t.id]}>
              {t.status === 'en_escrow' && (
                <div className="space-y-2 w-full">
                  <p className="text-xs text-yellow-700 bg-yellow-50 rounded p-2">
                    El token está bloqueado en escrow. Realizá el pago físico y registrá la evidencia.
                  </p>
                  <textarea rows={2} placeholder="Número de comprobante, referencia bancaria, etc."
                    value={evidenceContent[t.id] ?? ''}
                    onChange={e => setEvidenceContent(ev => ({ ...ev, [t.id]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                  <button onClick={() => act(t.id, 'payment')} disabled={!!loading[t.id] || !evidenceContent[t.id]}
                    className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                    Registrar pago
                  </button>
                </div>
              )}
              {t.status === 'pago_registrado' && (
                <p className="text-sm bg-blue-50 text-blue-800 rounded p-2">Pago registrado. Esperando validación.</p>
              )}
            </TransferCard>
          ))
        }
      </div>
    </div>
  );
}

function TransferCard({ transfer: t, loading, message, children }: {
  transfer: any; loading: boolean; message?: string; children?: React.ReactNode;
}) {
  const statusColors: Record<string, string> = {
    solicitada: 'bg-gray-100 text-gray-700', aceptada: 'bg-blue-100 text-blue-700',
    en_escrow: 'bg-yellow-100 text-yellow-700', pago_registrado: 'bg-orange-100 text-orange-700',
    pago_validado: 'bg-indigo-100 text-indigo-700', liberada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700', cancelada: 'bg-gray-100 text-gray-500',
  };
  return (
    <div className="border rounded-xl p-4 mb-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{t.bonds?.bond_id ?? t.bond_token_id}</p>
          <p className="text-xs text-gray-500">De: {t.from_profile?.full_name ?? t.from_owner}</p>
          {t.amount && <p className="text-xs font-medium text-blue-900">₡{Number(t.amount).toLocaleString()}</p>}
        </div>
        <span className={`text-xs rounded-full px-2 py-0.5 ${statusColors[t.status] ?? ''}`}>{t.status}</span>
      </div>
      {message && <p className={`text-xs rounded p-2 ${message.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{message}</p>}
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
