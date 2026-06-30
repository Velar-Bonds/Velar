'use client';
/**
 * Selector de pais para el header. Cambiar el pais reconfigura toda la UI
 * (autoridad, moneda, instrumento) sobre el mismo nucleo Stellar.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useCountry } from '../lib/country';

export function CountrySelector({ compact = false }: { compact?: boolean }) {
  const { country, profile, setCountry, profiles } = useCountry();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const gutter = 12;
      const width = Math.min(288, viewportWidth - gutter * 2);

      let left = compact ? rect.left : rect.right - width;
      if (left + width > viewportWidth - gutter) left = viewportWidth - width - gutter;
      if (left < gutter) left = gutter;

      let top = rect.bottom + 8;
      if (top + 250 > viewportHeight - gutter) top = Math.max(gutter, rect.top - 258);

      setMenuStyle({ top, left, width });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [compact, open]);

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Cambiar pais"
        title={`${profile.name} - ${profile.authority.name}`}
        className="flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-2.5 py-1.5 text-sm font-medium text-on-surface transition hover:border-primary-container/50 hover:bg-surface-container-low"
      >
        <span className="text-base leading-none">{profile.flag}</span>
        {!compact && (
          <span className="hidden sm:inline">
            {profile.authority.code} - {profile.currency.code}
          </span>
        )}
        <ChevronDown size={14} className="text-outline" />
      </button>

      {open && menuStyle && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[120] overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-xl"
          style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }}
        >
          <div className="flex items-center gap-2 border-b border-outline-variant/20 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
            <Globe size={13} /> Jurisdiccion
          </div>
          {profiles.map((p) => {
            const active = p.code === country;
            return (
              <button
                key={p.code}
                type="button"
                onClick={() => {
                  setCountry(p.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-surface-container-low ${
                  active ? 'bg-primary-container/5' : ''
                }`}
              >
                <span className="text-lg leading-none">{p.flag}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-on-surface">{p.name}</span>
                  <span className="block truncate text-[11px] text-on-surface-variant">
                    {p.authority.code} - {p.instrument.label} - {p.currency.code}
                  </span>
                </span>
                {p.status === 'configured' && (
                  <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-700">
                    Beta
                  </span>
                )}
                {active && <Check size={15} className="text-primary-container" />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
