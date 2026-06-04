import type { Metadata } from 'next';
import TSEPageClient from './TSEPageClient';

export const metadata: Metadata = {
  title: 'Panel TSE | VELAR',
  description: 'Revisa registros, bonos y actividad institucional desde el panel TSE.',
};

export default function TSEPage() {
  return <TSEPageClient />;
}
