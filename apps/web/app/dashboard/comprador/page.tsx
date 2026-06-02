'use client';
import { useState, useEffect } from 'react';
import { getApiClient } from '../../../lib/api/client';

export default function CompradorDashboard() {
  const [bonds, setBonds] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedBond, setSelectedBond] = useState('');
  const [toOwner, setToOwner] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const api = await getApiClient();
      const [b, u] = await Promise.all([api.get('/bonds'), api.get('/users')]);
      setBonds(b.data.filter((x: any) => x.status === 'activo'));
      setUsers(u.data.filter((x: any) => x.role === 'recomprador'));
    })();
  }, []);

  async function initiateTransfer(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const api = await getApiClient();
      await api.post('/transfers', { bondTokenId: selectedBond, toOwner, amount: amount ? Number(amount) : undefined });
      setMsg('Solicitud de transferencia creada exitosamente.');
      const b = await api.get('/bonds');
      setBonds(b.data.filter((x: any) => x.status === 'activo'));
    } catch (err: any) {
      setMsg('Error: ' + (err.response?.data?.message ?? err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-blue-900">Panel del Comprador</h1>
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Mis bonos activos</h2>
        {bonds.length === 0 ? <p className="text-gray-500 text-sm">No tenés bonos activos asignados.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bonds.map(b => (
              <div key={b.token_id} className="border rounded-xl p-4 space-y-1">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-sm font-semibold">{b.bond_id}</span>
                  <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">{b.status}</span>
                </div>
                <p className="text-gray-500 text-xs">{b.parties?.name}</p>
                {b.face_value && <p className="font-semibold text-blue-900">₡{Number(b.face_value).toLocaleString()}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
      {bonds.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Iniciar transferencia</h2>
          <form onSubmit={initiateTransfer} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Bono a transferir *</label>
              <select required value={selectedBond} onChange={e => setSelectedBond(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Seleccionar bono...</option>
                {bonds.map(b => <option key={b.token_id} value={b.token_id}>{b.bond_id}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recomprador *</label>
              <select required value={toOwner} onChange={e => setToOwner(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Seleccionar recomprador...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monto acordado (₡)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            {msg && <div className={`text-sm rounded-lg px-3 py-2 ${msg.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg}</div>}
            <button type="submit" disabled={loading} className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
              {loading ? 'Enviando...' : 'Solicitar transferencia'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
