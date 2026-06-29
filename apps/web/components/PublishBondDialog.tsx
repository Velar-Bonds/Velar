'use client';

import { useState } from 'react';
import { Smartphone, Landmark, Wallet, X } from 'lucide-react';

export type PaymentMethod = 'sinpe' | 'transferencia' | 'wallet';

const METHODS: { id: PaymentMethod; label: string; desc: string; Icon: any }[] = [
  { id: 'sinpe', label: 'SINPE Móvil', desc: 'Pago P2P instantáneo; el comprador adjunta el comprobante.', Icon: Smartphone },
  { id: 'transferencia', label: 'Transferencia bancaria', desc: 'Pago P2P por transferencia; se valida con evidencia.', Icon: Landmark },
  { id: 'wallet', label: 'Wallet / cripto (USDC)', desc: 'Liquidación atómica on-chain: el bono se libera al recibir el pago.', Icon: Wallet },
];

/**
 * Modal para que el DUEÑO elija qué métodos de pago acepta al publicar el bono.
 * Llama onConfirm con la lista elegida (al menos uno).
 */
export function PublishBondDialog({
  open,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (methods: PaymentMethod[]) => void;
}) {
  const [selected, setSelected] = useState<PaymentMethod[]>(['sinpe', 'transferencia']);

  if (!open) return null;

  const toggle = (id: PaymentMethod) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/30 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
          <h2 className="text-lg font-semibold">Publicar en el marketplace</h2>
          <button onClick={onClose} className="text-on-surface-variant transition hover:text-on-surface"><X size={18} /></button>
        </div>

        <div className="px-5 py-4">
          <p className="mb-4 text-sm text-on-surface-variant">
            Elegí qué métodos de pago aceptás. El comprador usará el flujo correspondiente.
          </p>
          <div className="space-y-2">
            {METHODS.map(({ id, label, desc, Icon }) => {
              const active = selected.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                    active ? 'border-primary-container bg-primary-container/5' : 'border-outline-variant/30 hover:bg-surface-container-low/60'
                  }`}
                >
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${active ? 'bg-primary-container/15 text-primary-container' : 'bg-surface-container-low text-on-surface-variant'}`}>
                    <Icon size={18} />
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold">{label}
                      {id === 'wallet' && <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">on-chain</span>}
                    </span>
                    <span className="mt-0.5 block text-xs text-on-surface-variant">{desc}</span>
                  </span>
                  <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${active ? 'border-primary-container bg-primary-container text-white' : 'border-outline-variant/50'}`}>
                    {active && '✓'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-outline-variant/20 px-5 py-4">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container-low">Cancelar</button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={busy || selected.length === 0}
            className="velar-primary-button rounded-xl px-5 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {busy ? 'Publicando…' : 'Publicar bono'}
          </button>
        </div>
      </div>
    </div>
  );
}
