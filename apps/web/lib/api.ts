'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from './supabase/client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

function buildApiUrl(path: string) {
  return `${API_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function messageFromPayload(payload: unknown, fallback: string) {
  const message = (payload as { message?: unknown })?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}

async function requestJson(method: string, path: string, body?: unknown, token?: string) {
  const url = buildApiUrl(path);
  let res: Response;

  try {
    res = await fetch(url, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(`No se pudo conectar con la API en ${url}. Verifica que el backend este corriendo y que NEXT_PUBLIC_API_URL apunte a la URL correcta.`);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(messageFromPayload(json, `Error ${res.status} en ${url}`));
  return json;
}

/** Hace una request publica al backend. Lanza Error con el mensaje del backend. */
export async function publicApiFetch(method: string, path: string, body?: unknown) {
  return requestJson(method, path, body);
}

/** Hace una request autenticada al backend. Lanza Error con el mensaje del backend. */
export async function apiFetch(token: string, method: string, path: string, body?: unknown) {
  return requestJson(method, path, body, token);
}

function filenameFromDisposition(header: string | null, fallback: string) {
  const match = header?.match(/filename="([^"]+)"/);
  return match?.[1] ?? fallback;
}

/** Descarga un archivo autenticado y devuelve el Blob sin disparar diálogo de descarga. */
export async function apiFetchBlob(token: string, path: string): Promise<Blob> {
  const url = buildApiUrl(path);
  let res: Response;
  try {
    res = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new Error(`No se pudo conectar con la API en ${url}.`);
  }
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(messageFromPayload(json, `Error ${res.status} en ${url}`));
  }
  return res.blob();
}

/** Descarga un archivo autenticado desde el backend (p. ej. CSV). */
export async function apiDownload(token: string, path: string, fallbackFilename: string) {
  const url = buildApiUrl(path);
  let res: Response;

  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error(`No se pudo conectar con la API en ${url}. Verifica que el backend este corriendo y que NEXT_PUBLIC_API_URL apunte a la URL correcta.`);
  }

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(messageFromPayload(json, `Error ${res.status} en ${url}`));
  }

  const blob = await res.blob();
  const filename = filenameFromDisposition(res.headers.get('Content-Disposition'), fallbackFilename);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export type Me = {
  id: string; email: string; full_name?: string; role?: string;
  country?: string | null;
  party_id?: string | null; stellar_wallet?: string | null;
  /** Wallet self-custody (Freighter) vinculada por el propio usuario. */
  stellar_public_key?: string | null;
  stellar_wallet_status?: string | null; stellar_network?: string | null;
  stellar_created_at?: string | null; stellar_wallet_error?: string | null;
  parties?: {
    stellar_wallet?: string | null; stellar_wallet_status?: string | null;
    stellar_network?: string | null; stellar_created_at?: string | null;
    stellar_wallet_error?: string | null;
  } | null;
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
