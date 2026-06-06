'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'ok' | 'err' | 'info';

export interface ToastData {
  id: number;
  type: ToastType;
  text: string;
}

type Listener = (t: ToastData) => void;
const listeners: Listener[] = [];
let nextId = 1;

export function toast(type: ToastType, text: string) {
  const data: ToastData = { id: nextId++, type, text };
  listeners.forEach((l) => l(data));
}

export const notify = {
  ok: (text: string) => toast('ok', text),
  err: (text: string) => toast('err', text),
  info: (text: string) => toast('info', text),
};

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
    const timer = setTimeout(() => { setVisible(false); setTimeout(onDone, 300); }, 4000);
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
      <p className="flex-1 py-3.5 pr-2 text-sm font-medium text-on-surface leading-snug">{t.text}</p>
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
