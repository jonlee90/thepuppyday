/**
 * Proxy for route protection (Next.js 16+)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { config as appConfig } from '@/lib/config';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/appointments', '/pets', '/profile'];

// Routes that require admin role
const adminRoutes = ['/admin'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // In mock mode, check localStorage-based auth via cookies
  // In real mode, this would check Supabase session cookies
  const authCookie = request.cookies.get('auth-storage');

  let isAuthenticated = false;
  let userRole = 'customer';

  if (authCookie) {
    try {
      const authData = JSON.parse(authCookie.value);
      isAuthenticated = authData.state?.isAuthenticated || false;
      userRole = authData.state?.user?.role || 'customer';
    } catch {
      // Invalid cookie, treat as unauthenticated
    }
  }

  // Check if trying to access auth routes while authenticated
  if (isAuthenticated && authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check if trying to access protected routes without authentication
  if (!isAuthenticated && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if trying to access admin routes without admin role
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole !== 'admin' && userRole !== 'groomer') {
      // Redirect to customer dashboard if not admin
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
