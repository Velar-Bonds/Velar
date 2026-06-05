import type { Metadata } from 'next';
import LoginPageClient from '../login/LoginPageClient';

export const metadata: Metadata = {
  title: 'Iniciar sesión | VELAR',
  description: 'Accede a VELAR para gestionar y consultar bonos políticos trazables.',
};

// Alias de /login con otro slug, para evitar service workers zombies que
// puedan estar cacheando /login en el browser del usuario.
export default function EntrarPage() {
  return <LoginPageClient />;
}
