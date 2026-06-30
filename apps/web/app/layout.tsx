import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '../components/AppProviders';

export const metadata: Metadata = {
  title: 'VELAR | Trazabilidad de Bonos',
  description: 'Infraestructura blockchain para el traspaso digital de bonos de partidos políticos',
  icons: {
    icon: '/velar-mark.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-background text-on-surface antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
