const ROLE_ROUTES: Record<string, string> = {
  admin: '/tse',
  tse: '/tse',
  emisor: '/partido',
  comprador: '/marketplace',
  recomprador: '/marketplace',
};

export function getSafeRedirectTarget(rawTarget?: string | null) {
  if (!rawTarget || !rawTarget.startsWith('/')) return null;
  if (rawTarget.startsWith('//') || rawTarget === '/login') return null;
  return rawTarget;
}

export function getDefaultRouteForRole(role?: string | null) {
  if (!role) return '/';
  return ROLE_ROUTES[role] ?? '/';
}
