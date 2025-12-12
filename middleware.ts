/**
 * Next.js Middleware for route protection
 * Handles authentication and authorization for both mock and real Supabase modes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/appointments',
  '/pets',
  '/profile',
  '/loyalty',
  '/membership',
  '/report-cards',
];

// Routes that require admin role
const adminRoutes = ['/admin'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;

  // In mock mode, check localStorage-based auth via cookies
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
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

  // Real Supabase mode - use Supabase session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Protect admin routes - check user role from database
  if (isAdminRoute && user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else if (isAdminRoute && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
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
