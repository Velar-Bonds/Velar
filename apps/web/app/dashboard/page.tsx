import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = profile?.role ?? 'comprador';

  const destinations: Record<string, string> = {
    tse: '/dashboard/tse',
    admin: '/dashboard/admin',
    emisor: '/dashboard/emisor',
    comprador: '/dashboard/comprador',
    recomprador: '/dashboard/recomprador',
    validador: '/dashboard/validador',
  };
  redirect(destinations[role] ?? '/dashboard/comprador');
}
