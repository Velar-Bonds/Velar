'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, X, ExternalLink } from 'lucide-react';
import { txUrl } from '../lib/stellar';

export type ToastType = 'ok' | 'err' | 'info';

export interface ToastAction {
  href: string;
  label: string;
}

export interface ToastData {
  id: number;
  type: ToastType;
  text: string;
  action?: ToastAction;
}

type Listener = (t: ToastData) => void;
const listeners: Listener[] = [];
let nextId = 1;

export function toast(type: ToastType, text: string, action?: ToastAction) {
  const data: ToastData = { id: nextId++, type, text, action };
  listeners.forEach((l) => l(data));
}

export const notify = {
  ok: (text: string, action?: ToastAction) => toast('ok', text, action),
  err: (text: string, action?: ToastAction) => toast('err', text, action),
  info: (text: string, action?: ToastAction) => toast('info', text, action),
  /**
   * Toast de éxito de una transacción on-chain: muestra el mensaje y un link
   * "Ver en Stellar" al explorador (testnet). Si no hay hash, es un ok normal.
   */
  tx: (hash: string | null | undefined, text: string) =>
    hash
      ? toast('ok', text, { href: txUrl(hash), label: 'Ver en Stellar' })
      : toast('ok', text),
  /**
   * Error de una operación on-chain. Si el fallo es por una trustline aún en
   * propagación, muestra un estado amable ("Estableciendo trustline…") en vez
   * de un error seco; el resto se reporta como error normal.
   */
  txError: (message: string) => {
    if (TRUSTLINE_RE.test(message ?? '')) {
      toast('info', 'Estableciendo trustline en la red… Esperá unos segundos y volvé a intentar.');
    } else {
      toast('err', message);
    }
  },
};

/** Patrones de error de Stellar relacionados a trustlines en propagación. */
const TRUSTLINE_RE = /trust\s?line|op_no_trust|no_trust|change_?trust/i;

const STYLES: Record<ToastType, { bar: string; icon: string; bg: string; border: string }> = {
  ok:   { bar: 'bg-emerald-500', icon: 'text-emerald-600', bg: 'bg-white', border: 'border-emerald-100' },
  err:  { bar: 'bg-red-500',     icon: 'text-red-500',     bg: 'bg-white', border: 'border-red-100' },
  info: { bar: 'bg-primary',     icon: 'text-primary',     bg: 'bg-white', border: 'border-blue-100' },
};

function ToastItem({ t, onDone }: { t: ToastData; onDone: () => void }) {
  const [visible, setVisible] = useState(false);
  const s = STYLES[t.type];
  const Icon = t.type === 'ok' ? CheckCircle : t.type === 'err' ? AlertTriangle : Info;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const duration = t.action ? 9000 : 4000;
    const timer = setTimeout(() => { setVisible(false); setTimeout(onDone, 300); }, duration);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`relative flex w-[340px] items-start gap-3 overflow-hidden rounded-2xl border shadow-lg shadow-black/5 transition-all duration-300 ${s.bg} ${s.border}
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 ${s.bar}`} />
      <div className={`mt-3.5 ml-4 shrink-0 ${s.icon}`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="flex-1 py-3.5 pr-2">
        <p className="text-sm font-medium text-on-surface leading-snug">{t.text}</p>
        {t.action && (
          <a
            href={t.action.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary-container hover:underline"
          >
            <ExternalLink size={12} /> {t.action.label}
          </a>
        )}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(onDone, 300); }}
        className="mt-3 mr-3 shrink-0 text-on-surface-variant transition hover:text-on-surface"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const handler = (t: ToastData) => setToasts((prev) => [...prev, t]);
    listeners.push(handler);
    return () => { const i = listeners.indexOf(handler); if (i > -1) listeners.splice(i, 1); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5">
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} onDone={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
      ))}
    </div>
  );
}
