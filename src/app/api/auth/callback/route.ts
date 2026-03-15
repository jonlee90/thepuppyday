/**
 * Auth Callback Route
 * Handles Supabase PKCE code exchange for:
 *   - Password reset links (redirects to /reset-password)
 *   - Email confirmation links (redirects to /dashboard)
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const url = request.nextUrl.clone();
      url.pathname = next;
      url.search = '';
      return NextResponse.redirect(url);
    }

    console.error('[Auth Callback] Code exchange failed:', error.message);
  }

  // Exchange failed or no code — redirect to login with error
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '?error=invalid_link';
  return NextResponse.redirect(url);
}
