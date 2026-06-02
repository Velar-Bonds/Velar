'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

const ROLE_LABELS: Record<string, string> = {
  tse: 'TSE', admin: 'Administrador', emisor: 'Partido Emisor',
  comprador: 'Comprador', recomprador: 'Recomprador', validador: 'Validador',
};

export default function NavBar({ profile }: { profile: any }) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="bg-blue-900 text-white shadow-md">
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between h-14">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">VELAR</Link>
        <nav className="flex items-center gap-4 text-sm">
          {(profile?.role === 'tse' || profile?.role === 'admin') && (
            <Link href="/dashboard/tse" className="hover:text-blue-200">Auditoría</Link>
          )}
          {profile?.role === 'admin' && (
            <Link href="/dashboard/admin" className="hover:text-blue-200">Usuarios</Link>
          )}
          <span className="bg-blue-700 rounded-full px-3 py-0.5 text-xs font-medium">
            {ROLE_LABELS[profile?.role] ?? profile?.role}
          </span>
          <span className="text-blue-300 text-xs hidden sm:block">{profile?.email}</span>
          <button onClick={signOut} className="text-blue-200 hover:text-white underline text-xs">Salir</button>
        </nav>
      </div>
    </header>
  );
}
