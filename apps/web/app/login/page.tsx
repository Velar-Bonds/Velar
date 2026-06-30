import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginPageClient from './LoginPageClient';

export const metadata: Metadata = {
  title: 'Iniciar sesión | VELAR',
  description: 'Accede a VELAR para gestionar y consultar bonos políticos trazables.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageClient />
    </Suspense>
  );
}
