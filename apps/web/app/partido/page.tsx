import type { Metadata } from 'next';
import PartidoPageClient from './PartidoPageClient';

export const metadata: Metadata = {
  title: 'Panel del Partido | VELAR',
  description: 'Gestiona bonos políticos, ventas y trazabilidad desde el panel del partido.',
};

export default function PartidoPage() {
  return <PartidoPageClient />;
}
