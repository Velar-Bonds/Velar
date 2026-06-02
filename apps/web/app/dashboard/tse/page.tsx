'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiClient } from '../../../lib/api/client';

export default function TseDashboard() {
  const [bonds, setBonds] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [freezeMsg, setFreezeMsg] = useState('');
  const router = useRouter();
  const [query, setQuery] = useState({ tokenId: '', bondId: '', issuerPartyId: '', ownerId: '', status: '' });

  const searchBonds = async () => {
    setLoading(true);
    try {
      const api = await getApiClient();
      const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v));
      const { data } = await api.get('/audit/bonds', { params });
      setBonds(data);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    (async () => {
      const api = await getApiClient();
      const [e, p] = await Promise.all([api.get('/audit/events'), api.get('/parties')]);
      setEvents(e.data);
      setParties(p.data);
    })();
    searchBonds();
  }, []);

  async function toggleFreeze(tokenId: string, status: string) {
    try {
      const api = await getApiClient();
      const action = status === 'congelado' ? 'unfreeze' : 'freeze';
      await api.patch(`/bonds/${tokenId}/${action}`);
      setFreezeMsg(`Bono ${action === 'freeze' ? 'congelado' : 'descongelado'}.`);
      await searchBonds();
    } catch (err: any) { setFreezeMsg('Error: ' + (err.response?.data?.message ?? err.message)); }
  }

  const statusColors: Record<string, string> = {
    emitido: 'bg-gray-100 text-gray-700', activo: 'bg-green-100 text-green-700',
    en_escrow: 'bg-yellow-100 text-yellow-700', transferido: 'bg-blue-100 text-blue-700',
    cancelado: 'bg-red-100 text-red-700', congelado: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-900">Panel de Auditoría — TSE</h1>
        <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-3 py-1">Tribunal Supremo de Elecciones</span>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Búsqueda de bonos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <input value={query.bondId} onChange={e => setQuery(q => ({ ...q, bondId: e.target.value }))} placeholder="Código de bono" className="border rounded-lg px-3 py-2 text-sm" />
          <input value={query.tokenId} onChange={e => setQuery(q => ({ ...q, tokenId: e.target.value }))} placeholder="Token ID (UUID)" className="border rounded-lg px-3 py-2 text-sm" />
          <input value={query.ownerId} onChange={e => setQuery(q => ({ ...q, ownerId: e.target.value }))} placeholder="ID del dueño" className="border rounded-lg px-3 py-2 text-sm" />
          <select value={query.issuerPartyId} onChange={e => setQuery(q => ({ ...q, issuerPartyId: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Todos los partidos</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={query.status} onChange={e => setQuery(q => ({ ...q, status: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Todos los estados</option>
            {['emitido','activo','en_escrow','transferido','cancelado','congelado'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={searchBonds} disabled={loading} className="bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {freezeMsg && <p className={`text-sm rounded p-2 mb-3 ${freezeMsg.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{freezeMsg}</p>}
        <table className="w-full text-sm"><thead><tr className="border-b text-left text-gray-500">
          <th className="pb-2 pr-3">Código</th><th className="pb-2 pr-3">Partido</th><th className="pb-2 pr-3">Dueño</th><th className="pb-2 pr-3">Estado</th><th className="pb-2">Acciones</th>
        </tr></thead><tbody>
          {bonds.length === 0 && !loading && <tr><td colSpan={5} className="py-4 text-gray-400 text-center">Sin resultados</td></tr>}
          {bonds.map(b => (
            <tr key={b.token_id} className="border-b last:border-0">
              <td className="py-2 pr-3">
                <button onClick={() => router.push(`/dashboard/tse/bond/${b.token_id}`)} className="font-mono text-xs text-blue-700 hover:underline">{b.bond_id}</button>
              </td>
              <td className="py-2 pr-3 text-xs">{b.parties?.name}</td>
              <td className="py-2 pr-3 text-xs">{b.profiles?.full_name ?? '—'}</td>
              <td className="py-2 pr-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[b.status] ?? 'bg-gray-100 text-gray-600'}`}>{b.status}</span></td>
              <td className="py-2 flex gap-2">
                <button onClick={() => router.push(`/dashboard/tse/bond/${b.token_id}`)} className="text-xs text-blue-700 underline">Timeline</button>
                <button onClick={() => toggleFreeze(b.token_id, b.status)} className={`text-xs px-2 py-0.5 rounded ${b.status === 'congelado' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                  {b.status === 'congelado' ? 'Descongelar' : 'Congelar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody></table>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Eventos recientes</h2>
        <div className="space-y-2">
          {events.slice(0, 20).map(ev => (
            <div key={ev.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
              <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(ev.created_at).toLocaleString('es-CR')}</span>
              <span className="text-xs bg-gray-100 rounded px-2 py-0.5 font-mono">{ev.type}</span>
              <span className="text-xs text-gray-600">{ev.bonds?.bond_id}</span>
            </div>
          ))}
          {events.length === 0 && <p className="text-gray-400 text-sm">Sin eventos.</p>}
        </div>
      </div>
    </div>
  );
}
