'use client';
/**
 * Modal / Dialog — diálogo accesible: role=dialog, aria-modal, foco atrapado,
 * Escape para cerrar, restaura el foco al disparador, respeta reduced-motion.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './cn';

const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Foco inicial dentro del diálogo.
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) return;
      const firstEl = nodes[0];
      const lastEl = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const width = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-institutional/40 backdrop-blur-sm motion-safe:animate-[velar-fade-up_.2s_ease]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cn('velar-card relative z-10 w-full p-5 focus:outline-none motion-safe:animate-[velar-fade-up_.22s_ease]', width)}
      >
        {(title || true) && (
          <div className="mb-3 flex items-start justify-between gap-4">
            {title && <h2 className="text-lg font-semibold text-on-surface">{title}</h2>}
            <button type="button" onClick={onClose} aria-label="Cerrar" className="btn-ghost !h-8 !w-8 !px-0">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="text-sm text-on-surface-variant">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
