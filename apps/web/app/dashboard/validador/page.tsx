'use client';
import { useState, useEffect } from 'react';
import { getApiClient } from '../../../lib/api/client';

export default function ValidadorDashboard() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});

  const load = async () => {
    const api = await getApiClient();
    const { data } = await api.get('/transfers');
    setTransfers(data);
  };

  useEffect(() => { load(); }, []);

  const act = async (transferId: string, action: 'validate' | 'release') => {
    setLoading(l => ({ ...l, [transferId]: true }));
    setMsg(m => ({ ...m, [transferId]: '' }));
    try {
      const api = await getApiClient();
      await api.patch(`/transfers/${transferId}/${action}`);
      setMsg(m => ({ ...m, [transferId]: action === 'validate' ? 'Pago validado.' : 'Token liberado.' }));
      await load();
    } catch (err: any) {
      setMsg(m => ({ ...m, [transferId]: 'Error: ' + (err.response?.data?.message ?? err.message) }));
    } finally {
      setLoading(l => ({ ...l, [transferId]: false }));
    }
  };

  const pendingValidation = transfers.filter(t => t.status === 'pago_registrado');
  const pendingRelease = transfers.filter(t => t.status === 'pago_validado');

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-blue-900">Panel del Validador de Pago</h1>
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Transferencias con pago registrado ({pendingValidation.length})</h2>
        {pendingValidation.length === 0 ? <p className="text-gray-500 text-sm">Sin transferencias pendientes.</p> :
          pendingValidation.map(t => (
            <div key={t.id} className="border rounded-xl p-4 mb-3 space-y-2">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-sm">{t.bonds?.bond_id}</p>
                  <p className="text-xs text-gray-500">Vendedor: {t.from_profile?.full_name}</p>
                  <p className="text-xs text-gray-500">Comprador: {t.to_profile?.full_name}</p>
                  {t.amount && <p className="text-xs font-medium text-blue-900">₡{Number(t.amount).toLocaleString()}</p>}
                  {t.payment_evidence_hash && <p className="text-xs font-mono text-gray-400 break-all">Hash: {t.payment_evidence_hash}</p>}
                </div>
                <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 self-start">{t.status}</span>
              </div>
              {msg[t.id] && <p className={`text-xs rounded p-2 ${msg[t.id].startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{msg[t.id]}</p>}
              <button onClick={() => act(t.id, 'validate')} disabled={!!loading[t.id]}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                {loading[t.id] ? 'Procesando...' : 'Validar pago'}
              </button>
            </div>
          ))
        }
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Transferencias validadas — liberar token ({pendingRelease.length})</h2>
        {pendingRelease.length === 0 ? <p className="text-gray-500 text-sm">Sin tokens pendientes.</p> :
          pendingRelease.map(t => (
            <div key={t.id} className="border rounded-xl p-4 mb-3 space-y-2">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-sm">{t.bonds?.bond_id}</p>
                  <p className="text-xs text-gray-500">{t.from_profile?.full_name} → {t.to_profile?.full_name}</p>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 self-start">{t.status}</span>
              </div>
              {msg[t.id] && <p className={`text-xs rounded p-2 ${msg[t.id].startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{msg[t.id]}</p>}
              <button onClick={() => act(t.id, 'release')} disabled={!!loading[t.id]}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                {loading[t.id] ? 'Liberando...' : 'Liberar token al nuevo dueño'}
              </button>
            </div>
          ))
        }
      </div>
    </div>
  );
}
