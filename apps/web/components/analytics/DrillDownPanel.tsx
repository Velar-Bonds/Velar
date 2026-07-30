'use client';
import { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp, Users } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { apiFetch } from '../../lib/api';

const fmtCRC = (n: number) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n || 0);

/**
 * Drill-down from a chart segment (a top bond) into its underlying set:
 * price history + ownership chain. Reuses the legacy bond-detail endpoints
 * (kept for exactly this purpose — see analytics.controller.ts).
 */
export function DrillDownPanel({ token, tokenId, onClose }: { token: string; tokenId: string | null; onClose: () => void }) {
  const [priceHistory, setPriceHistory] = useState<any>(null);
  const [owners, setOwners] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tokenId) {
      setPriceHistory(null);
      setOwners(null);
      return;
    }
    setLoading(true);
    Promise.all([
      apiFetch(token, 'GET', `/analytics/bonds/${tokenId}/price-history`).catch(() => null),
      apiFetch(token, 'GET', `/analytics/bonds/${tokenId}/owners`).catch(() => null),
    ])
      .then(([ph, ow]) => {
        setPriceHistory(ph);
        setOwners(ow);
      })
      .finally(() => setLoading(false));
  }, [token, tokenId]);

  return (
    <Modal
      open={!!tokenId}
      onClose={onClose}
      title={priceHistory ? `${priceHistory.bond_id} · ${priceHistory.party_name}` : 'Detalle del bono'}
      size="lg"
    >
      {loading && <p className="py-8 text-center text-sm text-on-surface-variant">Cargando…</p>}
      {!loading && priceHistory && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-on-surface">Histórico de precios</h4>
              <span className={`flex items-center gap-1 text-xs font-semibold ${priceHistory.total_change_pct >= 0 ? 'text-success' : 'text-error'}`}>
                {priceHistory.total_change_pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {priceHistory.total_change_pct > 0 ? '+' : ''}
                {priceHistory.total_change_pct}%
              </span>
            </div>
            {priceHistory.points.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Sin ventas registradas todavía.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {priceHistory.points.map((pt: any, i: number) => (
                  <li key={i} className="flex items-center justify-between rounded-lg border border-outline-variant/20 px-3 py-2 text-xs">
                    <span className="text-on-surface-variant">Venta #{pt.index}</span>
                    <span className="font-mono font-semibold">{fmtCRC(pt.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {owners && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Users size={16} className="text-primary" />
                <h4 className="font-semibold text-on-surface">Propietarios históricos</h4>
              </div>
              <ul className="flex flex-col gap-2">
                {owners.owners.map((o: any, i: number) => (
                  <li key={i} className={`rounded-xl border p-3 text-xs ${o.current ? 'border-success/30 bg-success/10' : 'border-outline-variant/20'}`}>
                    <p className="font-semibold">
                      {o.name ?? 'Sin dato'}
                      {o.current && <span className="ml-1 rounded-full bg-success px-1.5 py-0.5 text-[9px] font-bold text-white">ACTUAL</span>}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {!loading && !priceHistory && <p className="py-8 text-center text-sm text-on-surface-variant">No se pudo cargar el detalle.</p>}
    </Modal>
  );
}
