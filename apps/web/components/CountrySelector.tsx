'use client';
/**
 * Selector de país para el header. Cambiar el país reconfigura toda la UI
 * (autoridad, moneda, instrumento) sobre el mismo núcleo Stellar — es el gesto
 * central del demo multi-país.
 */
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useCountry } from '../lib/country';

export function CountrySelector({ compact = false }: { compact?: boolean }) {
  const { country, profile, setCountry, profiles } = useCountry();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Cambiar país"
        title={`${profile.name} · ${profile.authority.name}`}
        className="flex items-center gap-2 rounded-full border border-outline-variant/40 bg-white px-2.5 py-1.5 text-sm font-medium text-on-surface transition hover:border-primary-container/50 hover:bg-surface-container-low"
      >
        <span className="text-base leading-none">{profile.flag}</span>
        {!compact && (
          <span className="hidden sm:inline">
            {profile.authority.code} · {profile.currency.code}
          </span>
        )}
        <ChevronDown size={14} className="text-outline" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-outline-variant/20 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
            <Globe size={13} /> Jurisdicción
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
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-on-surface">{p.name}</span>
                  <span className="block truncate text-[11px] text-on-surface-variant">
                    {p.authority.code} · {p.instrument.label} · {p.currency.code}
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
        </div>
      )}
    </div>
  );
}
