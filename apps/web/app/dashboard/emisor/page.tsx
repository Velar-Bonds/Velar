'use client';
import { useState, useEffect } from 'react';
import { getApiClient } from '../../../lib/api/client';
import crypto from 'crypto';

export default function EmisorDashboard() {
  const [parties, setParties] = useState<any[]>([]);
  const [bonds, setBonds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ bondId: '', issuerPartyId: '', documentContent: '', faceValue: '', metadataUri: '', initialOwner: '' });

  useEffect(() => {
    (async () => {
      const api = await getApiClient();
      const [p, b] = await Promise.all([api.get('/parties'), api.get('/bonds')]);
      setParties(p.data);
      setBonds(b.data);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const api = await getApiClient();
      const hashRes = await api.post('/bonds/hash', { content: form.documentContent || 'placeholder' });
      const documentHash = hashRes.data.hash;
      await api.post('/bonds', {
        bondId: form.bondId, issuerPartyId: form.issuerPartyId, documentHash,
        faceValue: form.faceValue ? Number(form.faceValue) : undefined,
        metadataUri: form.metadataUri || undefined,
        initialOwner: form.initialOwner || undefined,
      });
      setMsg('Bono registrado exitosamente.');
      const b = await api.get('/bonds');
      setBonds(b.data);
      setForm({ bondId: '', issuerPartyId: '', documentContent: '', faceValue: '', metadataUri: '', initialOwner: '' });
    } catch (err: any) {
      setMsg('Error: ' + (err.response?.data?.message ?? err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-blue-900">Panel de Emisión — Partido Político</h1>
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Registrar nuevo bono</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Código del bono *</label>
            <input required value={form.bondId} onChange={e => setForm(f => ({ ...f, bondId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="BONO-2026-001" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Partido emisor *</label>
            <select required value={form.issuerPartyId} onChange={e => setForm(f => ({ ...f, issuerPartyId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Seleccionar partido...</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor facial (₡)</label>
            <input type="number" value={form.faceValue} onChange={e => setForm(f => ({ ...f, faceValue: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dueño inicial (UUID, opcional)</label>
            <input value={form.initialOwner} onChange={e => setForm(f => ({ ...f, initialOwner: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Contenido del documento (para hash)</label>
            <textarea rows={3} value={form.documentContent} onChange={e => setForm(f => ({ ...f, documentContent: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          {msg && <div className={`md:col-span-2 text-sm rounded-lg px-3 py-2 ${msg.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg}</div>}
          <div className="md:col-span-2">
            <button type="submit" disabled={loading} className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
              {loading ? 'Registrando...' : 'Registrar bono'}
            </button>
          </div>
        </form>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Bonos emitidos</h2>
        {bonds.length === 0 ? <p className="text-gray-500 text-sm">Sin bonos registrados aún.</p> : (
          <table className="w-full text-sm"><thead><tr className="border-b text-left text-gray-500">
            <th className="pb-2 pr-4">Código</th><th className="pb-2 pr-4">Partido</th><th className="pb-2 pr-4">Estado</th><th className="pb-2 pr-4">Valor</th><th className="pb-2">Dueño</th>
          </tr></thead><tbody>{bonds.map(b => (
            <tr key={b.token_id} className="border-b last:border-0">
              <td className="py-2 pr-4 font-mono text-xs">{b.bond_id}</td>
              <td className="py-2 pr-4">{b.parties?.name}</td>
              <td className="py-2 pr-4"><span className="text-xs bg-gray-100 rounded-full px-2 py-0.5">{b.status}</span></td>
              <td className="py-2 pr-4">{b.face_value ? `₡${Number(b.face_value).toLocaleString()}` : '—'}</td>
              <td className="py-2 text-xs text-gray-500">{b.profiles?.full_name ?? '—'}</td>
            </tr>
          ))}</tbody></table>
        )}
      </div>
    </div>
  );
}
