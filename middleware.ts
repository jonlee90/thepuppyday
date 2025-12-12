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

// Routes that require admin or staff role (groomer)
const adminRoutes = ['/admin'];

// Admin API routes that require admin/staff role
const adminApiRoutes = ['/api/admin'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isAdminApiRoute = adminApiRoutes.some((route) => pathname.startsWith(route));

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

    // Check if trying to access admin routes without admin/staff role
    if (isAdminRoute) {
      if (!isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnTo', pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (userRole !== 'admin' && userRole !== 'groomer') {
        // Redirect to customer dashboard if not admin/staff
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Protect admin API routes - return 403 for unauthorized access
    if (isAdminApiRoute) {
      if (!isAuthenticated || (userRole !== 'admin' && userRole !== 'groomer')) {
        return NextResponse.json(
          { error: 'Forbidden: Admin or staff access required' },
          { status: 403 }
        );
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

  // Protect admin routes and API routes - check user role from database
  if (isAdminRoute || isAdminApiRoute) {
    if (!user) {
      // For page routes, redirect to login
      if (isAdminRoute) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('returnTo', pathname);
        return NextResponse.redirect(redirectUrl);
      }
      // For API routes, return 401
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    // Query user role once with error handling
    // Type assertion is safe here as we're querying the users table for role
    const { data: userData, error: dbError } = (await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()) as { data: { role: string } | null; error: Error | null };

    if (dbError) {
      console.error('[Middleware] Database error:', dbError);
      // For page routes, redirect to login with error
      if (isAdminRoute) {
        return NextResponse.redirect(new URL('/login?error=auth_error', request.url));
      }
      // For API routes, return 500
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Check if user has admin or groomer (staff) role
    if (userData?.role !== 'admin' && userData?.role !== 'groomer') {
      // For page routes, redirect to customer dashboard
      if (isAdminRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      // For API routes, return 403
      return NextResponse.json(
        { error: 'Forbidden: Admin or staff access required' },
        { status: 403 }
      );
    }
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
     * - public folder (files with extensions)
     * Note: Explicitly include /api/admin/* for protection
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
    '/api/admin/:path*',
  ],
};
