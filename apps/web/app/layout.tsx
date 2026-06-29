import type { Metadata } from 'next';
import './globals.css';
import { ToastContainer } from '../components/Toast';
import { CountryProvider } from '../lib/country';
import { WalletProvider } from '../lib/wallet';

export const metadata: Metadata = {
  title: 'VELAR | Trazabilidad de Bonos',
  description: 'Infraestructura blockchain para el traspaso digital de bonos de partidos políticos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-background text-on-surface antialiased">
        <CountryProvider>
          <WalletProvider>
            {children}
            <ToastContainer />
          </WalletProvider>
        </CountryProvider>
      </body>
    </html>
  );
}
