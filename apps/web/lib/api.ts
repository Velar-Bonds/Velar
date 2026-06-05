'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from './supabase/client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

/** Hace una request autenticada al backend. Lanza Error con el mensaje del backend. */
export async function apiFetch(token: string, method: string, path: string, body?: unknown) {
  const res = await fetch(API_URL + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any).message ?? `Error ${res.status}`);
  return json;
}

export type Me = {
  id: string; email: string; full_name?: string; role?: string;
  party_id?: string | null; stellar_wallet?: string | null;
};

/**
 * Hook de sesión: devuelve el token y el perfil del usuario.
 * Si no hay sesión, redirige a /login. Maneja loading/errores (sin pantallas en blanco).
 */
export function useSession() {
  const router = useRouter();
  const supabase = createClient();
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const t = data.session?.access_token;
      if (!t) { router.replace('/login?next=' + encodeURIComponent(window.location.pathname)); return; }
      if (!active) return;
      setToken(t);
      try {
        const profile = await apiFetch(t, 'GET', '/users/me');
        if (active) setMe(profile);
      } catch (e: any) {
        if (active) setError(e.message ?? 'Error al cargar el perfil');
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => { await supabase.auth.signOut(); router.replace('/login'); };

  return { token, me, loading, error, logout };
}
