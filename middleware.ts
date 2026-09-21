import { type NextRequest, NextResponse } from 'next/server';
import { updateSupabaseSession } from '@/lib/supabase/middleware';

const ADMIN_LOGIN = '/admin/login';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const provider = process.env.NEXT_PUBLIC_DATA_PROVIDER ?? 'mock';

  // ── 1. Always refresh Supabase session when provider=supabase ─────────────
  let response = NextResponse.next({ request });

  if (provider === 'supabase') {
    response = await updateSupabaseSession(request, response);
  }

  // ── 2. Guard /admin/* routes ───────────────────────────────────────────────
  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage  = pathname === ADMIN_LOGIN;

  if (!isAdminRoute) return response;

  // In mock mode: allow access (demo banner handles the rest)
  if (provider !== 'supabase') return response;

  // In supabase mode: check the auth cookie exists.
  // Full validation (profile.active, role) happens in the Server Component
  // — middleware only blocks unauthenticated requests early.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

  if (isLoginPage) {
    // If already logged in, redirect away from the login page
    if (hasAuthCookie) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return response;
  }

  // Protect all other /admin/* routes
  if (!hasAuthCookie) {
    const loginUrl = new URL(ADMIN_LOGIN, request.url);
    // Avoid open redirects: only allow same-origin next param
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Match all paths except static files, images, and _next internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.jpg|images/).*)',
  ],
};
