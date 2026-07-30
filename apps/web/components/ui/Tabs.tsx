'use client';
/**
 * Tabs — navegación por pestañas accesible (role=tablist, flechas, Home/End).
 */
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from './cn';

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export function Tabs({ items, defaultId, className }: { items: TabItem[]; defaultId?: string; className?: string }) {
  const base = useId();
  const [active, setActive] = useState(defaultId ?? items[0]?.id);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, idx: number) {
    const enabled = items.filter((t) => !t.disabled);
    const pos = enabled.findIndex((t) => t.id === items[idx].id);
    let next = pos;
    if (e.key === 'ArrowRight') next = (pos + 1) % enabled.length;
    else if (e.key === 'ArrowLeft') next = (pos - 1 + enabled.length) % enabled.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = enabled.length - 1;
    else return;
    e.preventDefault();
    const target = enabled[next];
    setActive(target.id);
    document.getElementById(`${base}-tab-${target.id}`)?.focus();
  }

  return (
    <div className={className}>
      <div role="tablist" aria-orientation="horizontal" className="flex gap-1 border-b border-outline-variant">
        {items.map((t, i) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              id={`${base}-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${base}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={t.disabled}
              onClick={() => setActive(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container',
                selected
                  ? 'border-primary-container text-primary-container'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {items.map((t) => (
        <div
          key={t.id}
          id={`${base}-panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={t.id !== active}
          tabIndex={0}
          className="pt-4 focus-visible:outline-none"
        >
          {t.id === active && t.content}
        </div>
      ))}
    </div>
  );
}
