'use client';
import { useState, useEffect } from 'react';
import { getApiClient } from '../../../lib/api/client';

const ROLES = ['tse', 'admin', 'emisor', 'comprador', 'recomprador', 'validador'];

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState('');

  const load = async () => {
    const api = await getApiClient();
    const { data } = await api.get('/users');
    setUsers(data);
  };

  useEffect(() => { load(); }, []);

  async function changeRole(userId: string, role: string) {
    setLoading(l => ({ ...l, [userId]: true }));
    try {
      const api = await getApiClient();
      await api.patch(`/users/${userId}/role`, { role });
      setMsg('Rol actualizado.');
      await load();
    } catch (err: any) {
      setMsg('Error: ' + (err.response?.data?.message ?? err.message));
    } finally {
      setLoading(l => ({ ...l, [userId]: false }));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-blue-900">Panel de Administración</h1>
      {msg && <div className={`text-sm rounded-lg px-3 py-2 ${msg.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg}</div>}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Gestión de usuarios ({users.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b text-left text-gray-500">
            <th className="pb-2 pr-4">Nombre</th><th className="pb-2 pr-4">Email</th><th className="pb-2 pr-4">Rol</th><th className="pb-2 pr-4">Partido</th><th className="pb-2">Cambiar rol</th>
          </tr></thead><tbody>{users.map(u => (
            <tr key={u.id} className="border-b last:border-0">
              <td className="py-2 pr-4">{u.full_name ?? '—'}</td>
              <td className="py-2 pr-4 text-xs text-gray-500">{u.email}</td>
              <td className="py-2 pr-4"><span className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs">{u.role}</span></td>
              <td className="py-2 pr-4 text-xs">{u.parties?.name ?? '—'}</td>
              <td className="py-2">
                <select defaultValue={u.role} onChange={e => changeRole(u.id, e.target.value)} disabled={!!loading[u.id]}
                  className="border rounded-lg px-2 py-1 text-xs disabled:opacity-50">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
            </tr>
          ))}</tbody></table>
        </div>
      </div>
    </div>
  );
}
