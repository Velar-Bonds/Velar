import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Los Client Components se prerenderizan durante `next build`. Un cliente
  // inerte permite verificar el bundle sin credenciales; en ejecución normal
  // las variables públicas siempre reemplazan estos valores.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://build-placeholder.supabase.co';
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'build-placeholder-key';
  return createBrowserClient(
    url,
    publishableKey,
  );
}
