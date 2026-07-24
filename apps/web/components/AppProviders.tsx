'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { CountryProvider } from '../lib/country';
import { WalletProvider } from '../lib/wallet';
import { ThemeProvider } from './ui/theme';
import { ToastContainer } from './Toast';

function isAuthRoute(pathname: string | null) {
  return pathname === '/login' || pathname === '/signup' || pathname === '/ir-login';
}

export function AppProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isAuthRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <CountryProvider>
      <ThemeProvider>
        <WalletProvider>
          {children}
          <ToastContainer />
        </WalletProvider>
      </ThemeProvider>
    </CountryProvider>
  );
}
