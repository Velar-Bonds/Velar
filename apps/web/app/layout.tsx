import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '../components/AppProviders';
import { themeInitScript } from '../components/ui/theme';

export const metadata: Metadata = {
  title: 'VELAR | Trazabilidad de Bonos',
  description: 'Infraestructura blockchain para el traspaso digital de bonos de partidos políticos',
  icons: {
    icon: '/velar-mark.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-on-surface antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
