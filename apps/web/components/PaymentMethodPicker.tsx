'use client';

import { Landmark, Smartphone, Wallet } from 'lucide-react';

export type PaymentMethodId = 'sinpe' | 'transferencia' | 'wallet';

const META: Record<PaymentMethodId, { label: string; Icon: typeof Wallet }> = {
  sinpe: { label: 'SINPE Móvil', Icon: Smartphone },
  transferencia: { label: 'Transferencia', Icon: Landmark },
  wallet: { label: 'Wallet · USDC', Icon: Wallet },
};

type Props = {
  methods: string[];
  value: PaymentMethodId;
  onChange: (m: PaymentMethodId) => void;
  disabled?: boolean;
};

export function defaultPaymentMethod(methods: string[]): PaymentMethodId {
  if (methods.includes('wallet')) return 'wallet';
  if (methods.includes('sinpe')) return 'sinpe';
  if (methods.includes('transferencia')) return 'transferencia';
  return 'sinpe';
}

/** Selector compacto de método de pago al ofertar compra. */
export function PaymentMethodPicker({ methods, value, onChange, disabled }: Props) {
  const options = (methods.length > 0 ? methods : ['sinpe', 'transferencia']) as PaymentMethodId[];
  if (options.length <= 1) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">Pagar con:</span>
      {options.map((m) => {
        const meta = META[m];
        if (!meta) return null;
        const Icon = meta.Icon;
        const active = value === m;
        return (
          <button
            key={m}
            type="button"
            disabled={disabled}
            onClick={() => onChange(m)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
              active
                ? m === 'wallet'
                  ? 'border-violet-300 bg-violet-100 text-violet-800'
                  : 'border-primary-container/40 bg-primary-container/10 text-primary-container'
                : 'border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:border-outline-variant'
            }`}
          >
            <Icon size={11} /> {meta.label}
          </button>
        );
      })}
    </div>
  );
}

export { META as PAYMENT_METHOD_META };
