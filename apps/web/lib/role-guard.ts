'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Me } from './api';

export type Allowed = 'tse' | 'admin' | 'emisor' | 'comprador' | 'recomprador' | 'validador';

/** Home por defecto de cada rol. */
export function homeForRole(role?: string): string {
  if (role === 'tse' || role === 'admin') return '/tse';
  if (role === 'emisor') return '/partido';
  return '/marketplace';
}

/**
 * Hook que verifica el rol del usuario contra una lista de roles permitidos.
 * Si el rol no está permitido, redirige al home propio del usuario.
 * Devuelve `ready` cuando el chequeo terminó (sea OK o redirigió).
 */
export function useRoleGuard(me: Me | null, allowed: Allowed[]): boolean {
  const router = useRouter();
  useEffect(() => {
    if (!me?.role) return;
    if (!allowed.includes(me.role as Allowed)) {
      router.replace(homeForRole(me.role));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.role]);
  return !!me?.role && allowed.includes(me.role as Allowed);
}
