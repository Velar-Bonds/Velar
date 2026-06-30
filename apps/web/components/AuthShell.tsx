'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AuthBranding } from './AuthBranding';
import Aurora from './Aurora';

type AuthShellProps = {
  mode: 'login' | 'signup';
  cardClassName?: string;
  children: ReactNode;
};

function AuthTabs({ active }: { active: AuthShellProps['mode'] }) {
  const tabs = [
    { href: '/login', label: 'Iniciar sesion', value: 'login' },
    { href: '/signup', label: 'Crear cuenta', value: 'signup' },
  ] as const;

  return (
    <nav className="velar-auth-tabs" aria-label="Acceso">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={tab.href}
          aria-current={active === tab.value ? 'page' : undefined}
          className="velar-auth-tab"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export function AuthShell({ mode, cardClassName = '', children }: AuthShellProps) {
  return (
    <div className="velar-auth-shell">
      <div className="velar-auth-frame">
        <div className="velar-auth-aurora" aria-hidden="true">
          <Aurora />
        </div>

        <AuthBranding />

        <section className="velar-auth-form-panel">
          <div
            className={`velar-auth-card velar-auth-card--${mode} ${cardClassName}`}
          >
            <AuthTabs active={mode} />
            {children}
          </div>
          <p className="velar-auth-legal">
            Al iniciar sesion, aceptas nuestros{' '}
            <Link href="/terminos" className="velar-auth-link">
              Terminos de uso
            </Link>{' '}
            y{' '}
            <Link href="/privacidad" className="velar-auth-link">
              Politica de privacidad.
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
