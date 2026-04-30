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

// Routes groomers are allowed to access (admin gets full access)
const groomerAllowedRoutes = [
  '/admin/dashboard',
  '/admin/appointments',
  '/admin/customers',
  '/admin/notifications',
];
const groomerAllowedApiRoutes = [
  '/api/admin/appointments',
  '/api/admin/customers',
  '/api/admin/notifications',
  '/api/admin/groomers',
  '/api/admin/services',
  '/api/admin/addons',
  '/api/admin/breeds',
  '/api/admin/pets',
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const { pathname } = request.nextUrl;

  // Helper: build redirect URL preserving the original host (not internal proxy port)
  function redirectTo(path: string, params?: Record<string, string>) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = '';
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }
    return NextResponse.redirect(url);
  }
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isAdminApiRoute = adminApiRoutes.some((route) => pathname.startsWith(route));

  // In mock mode, check localStorage-based auth via cookies
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
    const authCookie = request.cookies.get('auth-storage');

    let isAuthenticated = false;
    let userRole = 'customer';

    if (authCookie) {
      try {
        const authData = JSON.parse(decodeURIComponent(authCookie.value));
        isAuthenticated = authData.state?.isAuthenticated || false;
        userRole = authData.state?.user?.role || 'customer';
      } catch {
        // Invalid cookie, treat as unauthenticated
      }
    }

    // Check if trying to access auth routes while authenticated
    if (isAuthenticated && authRoutes.some((route) => pathname.startsWith(route))) {
      const redirectPath = userRole === 'admin' || userRole === 'groomer' ? '/admin/dashboard' : '/dashboard';
      return redirectTo(redirectPath);
    }

    // Check if trying to access protected routes without authentication
    if (!isAuthenticated && protectedRoutes.some((route) => pathname.startsWith(route))) {
      return redirectTo('/login', { returnTo: pathname });
    }

    // Check if trying to access admin routes without admin/staff role
    if (isAdminRoute) {
      if (!isAuthenticated) {
        return redirectTo('/login', { returnTo: pathname });
      }

      if (userRole !== 'admin' && userRole !== 'groomer') {
        // Redirect to customer dashboard if not admin/staff
        return redirectTo('/dashboard');
      }

      // Restrict groomers to allowed routes only
      if (userRole === 'groomer') {
        const isAllowed = groomerAllowedRoutes.some((route) => pathname.startsWith(route));
        if (!isAllowed) {
          return redirectTo('/admin/dashboard');
        }
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

      // Restrict groomer API access
      if (userRole === 'groomer') {
        const isAllowed = groomerAllowedApiRoutes.some((route) => pathname.startsWith(route));
        if (!isAllowed) {
          return NextResponse.json(
            { error: 'Forbidden: Admin access required' },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.next();
  }

  // Real Supabase mode - use Supabase session
  let user = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabase: any = null;
  try {
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh session if expired - required for Server Components
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    // @supabase/ssr throws on malformed/stale sb-* cookies (bad base64 encoding).
    // Evict all Supabase cookies and redirect so the next request arrives clean.
    console.error('[Middleware] Supabase cookie parse error, evicting session:', err);
    const clean = NextResponse.redirect(request.nextUrl);
    request.cookies.getAll()
      .filter(c => c.name.startsWith('sb-'))
      .forEach(c => clean.cookies.delete(c.name));
    return clean;
  }

  const isAuthenticated = !!user;
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Fetch role once when needed (auth route redirect or admin route protection)
  let userRole: string | null = null;
  if (user && (isAuthRoute || isAdminRoute || isAdminApiRoute)) {
    const { data: userData, error: dbError } = (await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()) as { data: { role: string } | null; error: Error | null };

    if (dbError) {
      console.error('[Middleware] Database error:', dbError);
      if (isAdminRoute) {
        return redirectTo('/login', { error: 'auth_error' });
      }
      if (isAdminApiRoute) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    } else {
      userRole = userData?.role ?? null;
    }
  }

  const isPrivileged = userRole === 'admin' || userRole === 'groomer';

  // Redirect authenticated users away from auth pages — admins go to /admin/dashboard
  if (isAuthRoute && isAuthenticated) {
    const redirectPath = isPrivileged ? '/admin/dashboard' : '/dashboard';
    return redirectTo(redirectPath);
  }

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !isAuthenticated) {
    return redirectTo('/login', { returnTo: pathname });
  }

  // Protect admin routes and API routes
  if (isAdminRoute || isAdminApiRoute) {
    if (!user) {
      if (isAdminRoute) {
        return redirectTo('/login', { returnTo: pathname });
      }
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    if (!isPrivileged) {
      if (isAdminRoute) {
        return redirectTo('/dashboard');
      }
      return NextResponse.json(
        { error: 'Forbidden: Admin or staff access required' },
        { status: 403 }
      );
    }

    // Restrict groomers to allowed routes only
    if (userRole === 'groomer') {
      if (isAdminRoute) {
        const isAllowed = groomerAllowedRoutes.some((route) => pathname.startsWith(route));
        if (!isAllowed) {
          return redirectTo('/admin/dashboard');
        }
      }
      if (isAdminApiRoute) {
        const isAllowed = groomerAllowedApiRoutes.some((route) => pathname.startsWith(route));
        if (!isAllowed) {
          return NextResponse.json(
            { error: 'Forbidden: Admin access required' },
            { status: 403 }
          );
        }
      }
    }
  }

  return supabaseResponse;
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
