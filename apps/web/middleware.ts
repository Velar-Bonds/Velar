import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSafeRedirectTarget } from './lib/auth/routing';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (pairs) => {
          pairs.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          pairs.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const PROTECTED = ['/marketplace', '/partido', '/tse', '/admin', '/mis-bonos', '/negociaciones', '/trazabilidad', '/en-vivo', '/configuracion'];
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (!user && isProtected) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
  if (user && pathname === '/login') {
    const nextTarget = getSafeRedirectTarget(request.nextUrl.searchParams.get('next'));
    return NextResponse.redirect(new URL(nextTarget ?? '/', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/marketplace/:path*', '/partido/:path*', '/tse/:path*', '/admin/:path*', '/mis-bonos/:path*', '/negociaciones/:path*', '/trazabilidad/:path*', '/en-vivo/:path*', '/configuracion/:path*', '/login'],
};
