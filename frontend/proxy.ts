import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'avyrix_access_token';
const USER_ROLE_COOKIE = 'avyrix_role';

const authRoutePrefixes = ['/login', '/signup', '/forgot-password', '/reset-password'];

function isPrefixed(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const role = req.cookies.get(USER_ROLE_COOKIE)?.value;

  const isAuthRoute = isPrefixed(pathname, authRoutePrefixes);
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  // Protected routes rely on client-side auth (localStorage + /api/auth/me).
  // Blocking here on cookie-only caused false logouts when the cookie was missing.

  if (isAuthRoute && token) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && token && role !== 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
