import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import NavBar from '../../components/NavBar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, parties(*)')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar profile={profile} />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">{children}</main>
    </div>
  );
}
