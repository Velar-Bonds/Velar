'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { NotificationType } from '@velar/types';
import { apiFetch } from '../lib/api';
import { createClient } from '../lib/supabase/client';

type NotifRow = {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
};

const LABELS: Record<NotificationType, string> = {
  offer_received: 'Nueva oferta recibida',
  offer_accepted: 'Oferta aceptada',
  offer_rejected: 'Oferta rechazada',
  counter_offer_received: 'Contraoferta recibida',
  payment_confirmed: 'Pago confirmado',
  bond_approved: 'Bono aprobado',
  bond_rejected: 'Solicitud de bono rechazada',
};

function str(v: unknown): string | undefined {
  if (typeof v === 'string' && v) return v;
  if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  return undefined;
}

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

function summaryFor(n: NotifRow): string {
  const p = n.payload;
  switch (n.type) {
    case 'offer_received': {
      const bondId = str(p.bondId);
      const amount = num(p.amount);
      if (bondId) return `Bono ${bondId}${amount != null ? `, ₡${amount}` : ''}`;
      return 'Tenés una nueva oferta de compra';
    }
    case 'offer_accepted': {
      const bondId = str(p.bondId);
      return `Tu oferta fue aceptada${bondId ? ` · Bono ${bondId}` : ''}`;
    }
    case 'offer_rejected':
      return 'Tu oferta fue rechazada';
    case 'counter_offer_received': {
      const counterOfferAmount = num(p.counterOfferAmount);
      return counterOfferAmount != null
        ? `Nueva contraoferta: ₡${counterOfferAmount}`
        : 'Recibiste una contraoferta';
    }
    case 'payment_confirmed':
      return 'El pago fue validado';
    case 'bond_approved': {
      const bondId = str(p.bondId);
      return bondId ? `Bono ${bondId} aprobado` : 'Tu solicitud fue aprobada';
    }
    case 'bond_rejected': {
      const reason = str(p.reason);
      return reason ? `Motivo: ${reason}` : 'Tu solicitud fue rechazada';
    }
    default:
      return '';
  }
}

function routeFor(type: NotificationType, role?: string): string {
  const base = role === 'emisor' ? '/partido' : role === 'tse' || role === 'admin' ? '/tse' : '';
  if (type === 'bond_approved' || type === 'bond_rejected') return '/partido/solicitar-bonos';
  return `${base}/negociaciones`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'hace un momento';
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

type NotificationBellProps = {
  role?: string;
  panelAlign?: 'left' | 'right';
};

export function NotificationBell({ role, panelAlign = 'right' }: NotificationBellProps) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotifRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch(token, 'GET', '/notifications') as {
        notifications: NotifRow[];
        unreadCount: number;
      };
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      /* silently ignore — never crash the navbar */
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [token, load]);

  useEffect(() => {
    if (open && token) load();
  }, [open, token, load]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = async () => {
    if (!token) return;
    try {
      await apiFetch(token, 'PATCH', '/notifications/read-all');
      await load();
    } catch {
      /* silent */
    }
  };

  const handleNotifClick = async (n: NotifRow) => {
    if (!token) return;
    setOpen(false);
    try {
      if (!n.read) {
        await apiFetch(token, 'PATCH', `/notifications/${n.id}/read`);
      }
      load();
    } catch {
      /* silent */
    }
    router.push(routeFor(n.type, role));
  };

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-on-surface-variant transition hover:bg-primary-container/5 hover:text-primary-container"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-error px-1 text-[9px] font-bold leading-none text-white">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 w-80 overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-xl ${panelAlign === 'right' ? 'right-0' : 'left-0'}`}
        >
          <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-3">
            <p className="text-sm font-semibold text-on-surface">Notificaciones</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-primary transition hover:text-primary-container"
              >
                <CheckCheck size={14} />
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-on-surface-variant">
                No tenés notificaciones
              </p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotifClick(n)}
                  className={`flex w-full items-start gap-2 border-b border-outline-variant/20 px-4 py-3 text-left transition hover:bg-surface-container-low ${!n.read ? 'bg-primary-container/5' : ''}`}
                >
                  <span className="mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center">
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-on-surface">{LABELS[n.type]}</span>
                    <span className="block truncate text-xs text-on-surface-variant">{summaryFor(n)}</span>
                    <span className="mt-0.5 block text-[11px] text-outline">{timeAgo(n.created_at)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
