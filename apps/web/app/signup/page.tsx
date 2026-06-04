import type { Metadata } from 'next';
import SignUpPageClient from './SignUpPageClient';

export const metadata: Metadata = {
  title: 'Crear cuenta | VELAR',
  description: 'Registra una cuenta en VELAR para participar en la plataforma de trazabilidad.',
};

export default function SignUpPage() {
  return <SignUpPageClient />;
}
