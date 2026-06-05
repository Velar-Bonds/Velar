'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Boxes } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'hero',      label: 'Inicio',           href: '#hero',      external: false },
  { id: 'proceso',   label: 'Proceso',          href: '#proceso',   external: false },
  { id: 'historial', label: 'Historial',        href: '#historial', external: false },
  { id: 'explorer',  label: 'Explorador',       href: '/explorer',  external: true },
];

export function LandingNav() {
  const [active, setActive] = useState<string>('hero');

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-6 lg:px-10">
        <Link href="/" onClick={() => setActive('hero')} className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-container to-primary text-white shadow-sm">
            <Boxes size={18} strokeWidth={2.3} />
          </div>
          <div className="leading-none">
            <p className="text-[15px] font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Geist, sans-serif' }}>VELAR</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ledger</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ id, label, href, external }) => {
            const isActive = active === id;
            const className = `relative px-3.5 py-2 text-[14px] transition-colors ${
              isActive
                ? 'font-semibold text-primary'
                : 'font-medium text-slate-600 hover:text-primary'
            }`;
            return external ? (
              <Link key={id} href={href} className={className} onClick={() => setActive(id)}>
                {label}
              </Link>
            ) : (
              <a key={id} href={href} className={className} onClick={() => setActive(id)}>
                {label}
                {isActive && (
                  <span className="absolute -bottom-[1px] left-3.5 right-3.5 h-[2px] rounded-full bg-primary" />
                )}
              </a>
            );
          })}
        </nav>

        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/login';
          }}
          className="group inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-5 text-[14px] font-semibold text-white transition hover:bg-primary-container hover:shadow-lg hover:shadow-primary/25"
        >
          Acceder a la plataforma
          <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
        </a>
      </div>
    </header>
  );
}
