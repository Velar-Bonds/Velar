import type { Metadata } from 'next';
import MarketplacePageClient from './MarketplacePageClient';

export const metadata: Metadata = {
  title: 'Marketplace de bonos | VELAR',
  description: 'Explora, negocia y compra bonos políticos con trazabilidad verificable.',
};

export default function MarketplacePage() {
  return <MarketplacePageClient />;
}
