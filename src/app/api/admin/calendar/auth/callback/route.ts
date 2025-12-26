/**
 * Google Calendar OAuth Callback Endpoint
 * GET /api/admin/calendar/auth/callback
 * Task 0008: Process OAuth callback and store tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens } from '@/lib/calendar/oauth';
import { createConnection } from '@/lib/calendar/connection';
import { google } from 'googleapis';
import { createAuthenticatedClient } from '@/lib/calendar/oauth';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    // Extract OAuth callback parameters
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth error
    if (error) {
      console.error('[Calendar OAuth Callback] OAuth error:', error);
      const redirectUrl = new URL(
        '/admin/settings?tab=calendar&error=oauth_denied',
        request.url
      );
      return NextResponse.redirect(redirectUrl);
    }

    // Validate required parameters
    if (!code) {
      console.error('[Calendar OAuth Callback] Missing authorization code');
      const redirectUrl = new URL(
        '/admin/settings?tab=calendar&error=missing_code',
        request.url
      );
      return NextResponse.redirect(redirectUrl);
    }

    if (!state) {
      console.error('[Calendar OAuth Callback] Missing state parameter');
      const redirectUrl = new URL(
        '/admin/settings?tab=calendar&error=invalid_state',
        request.url
      );
      return NextResponse.redirect(redirectUrl);
    }

    // Validate state parameter (should be admin user ID)
    const adminId = state;

    // Verify the admin user exists
    const { data: adminUser, error: userError } = await (supabase as any)
      .from('users')
      .select('id, email, role')
      .eq('id', adminId)
      .single();

    if (userError || !adminUser) {
      console.error('[Calendar OAuth Callback] Invalid admin user:', adminId);
      const redirectUrl = new URL(
        '/admin/settings?tab=calendar&error=invalid_user',
        request.url
      );
      return NextResponse.redirect(redirectUrl);
    }

    // Verify admin role
    if (adminUser.role !== 'admin' && adminUser.role !== 'groomer') {
      console.error('[Calendar OAuth Callback] User is not admin:', adminUser.role);
      const redirectUrl = new URL(
        '/admin/settings?tab=calendar&error=unauthorized',
        request.url
      );
      return NextResponse.redirect(redirectUrl);
    }

    console.log('[Calendar OAuth Callback] Processing callback for admin:', adminUser.email);

    // Exchange authorization code for tokens
    let tokens;
    try {
      tokens = await exchangeCodeForTokens(code);
    } catch (error) {
      console.error('[Calendar OAuth Callback] Token exchange failed:', error);
      const redirectUrl = new URL(
        '/admin/settings?tab=calendar&error=token_exchange_failed',
        request.url
      );
      return NextResponse.redirect(redirectUrl);
    }

    // Fetch calendar metadata from Google
    let calendarEmail = adminUser.email;
    let calendarId = 'primary';

    try {
      const oauth2Client = createAuthenticatedClient(tokens);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Fetch primary calendar to get email
      const { data: calendarInfo } = await calendar.calendars.get({
        calendarId: 'primary',
      });

      if (calendarInfo.id) {
        calendarId = calendarInfo.id;
      }

      // Fetch user info to get email
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data: userInfo } = await oauth2.userinfo.get();

      if (userInfo.email) {
        calendarEmail = userInfo.email;
      }
    } catch (error) {
      console.error('[Calendar OAuth Callback] Failed to fetch calendar metadata:', error);
      // Continue with default values
    }

    // Create calendar connection with encrypted tokens
    try {
      await createConnection(
        supabase,
        adminId,
        tokens,
        calendarEmail,
        calendarId
      );

      console.log('[Calendar OAuth Callback] Connection created successfully for:', calendarEmail);

      // Redirect to settings page with success status
      const redirectUrl = new URL(
        '/admin/settings?tab=calendar&status=connected',
        request.url
      );
      return NextResponse.redirect(redirectUrl);
    } catch (error) {
      console.error('[Calendar OAuth Callback] Failed to create connection:', error);

      // Check if error is due to existing connection
      if (
        error instanceof Error &&
        error.message.includes('already exists')
      ) {
        const redirectUrl = new URL(
          '/admin/settings?tab=calendar&error=already_connected',
          request.url
        );
        return NextResponse.redirect(redirectUrl);
      }

      const redirectUrl = new URL(
        '/admin/settings?tab=calendar&error=connection_failed',
        request.url
      );
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    console.error('[Calendar OAuth Callback] Unexpected error:', error);

    const redirectUrl = new URL(
      '/admin/settings?tab=calendar&error=server_error',
      new URL(request.url)
    );
    return NextResponse.redirect(redirectUrl);
  }
}
