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
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('[Auth Callback] Code exchange failed:', error.message);
  }

  // Exchange failed or no code — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=invalid_link`);
}
