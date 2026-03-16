/**
 * Google Calendar OAuth Callback Endpoint
 * GET /api/admin/calendar/auth/callback
 * Task 0008: Process OAuth callback and store tokens
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens } from '@/lib/calendar/oauth';
import { createConnection } from '@/lib/calendar/connection';
import { google } from 'googleapis';
import { createAuthenticatedClient } from '@/lib/calendar/oauth';

export async function GET(request: NextRequest) {
  try {
    const serviceClient = createServiceRoleClient();
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
        process.env.NEXT_PUBLIC_APP_URL!
      );
      return NextResponse.redirect(redirectUrl);
    }

    // Validate required parameters
    if (!code) {
      console.error('[Calendar OAuth Callback] Missing authorization code');
      const redirectUrl = new URL(
        '/admin/settings?tab=calendar&error=missing_code',
        process.env.NEXT_PUBLIC_APP_URL!
      );
      return NextResponse.redirect(redirectUrl);
    }

    if (!state) {
      console.error('[Calendar OAuth Callback] Missing state parameter');
      const redirectUrl = new URL(
        '/admin/settings?tab=calendar&error=invalid_state',
        process.env.NEXT_PUBLIC_APP_URL!
      );
      return NextResponse.redirect(redirectUrl);
    }

    // Validate state parameter (should be admin user ID)
    const adminId = state;

    // Verify the admin user exists
    const { data: adminUser, error: userError } = await (serviceClient as any)
      .from('users')
      .select('id, email, role')
      .eq('id', adminId)
      .single();

    if (userError || !adminUser) {
      console.error('[Calendar OAuth Callback] Invalid admin user:', adminId);
      const redirectUrl = new URL(
        '/admin/settings?tab=calendar&error=invalid_user',
        process.env.NEXT_PUBLIC_APP_URL!
      );
      return NextResponse.redirect(redirectUrl);
    }

    // Verify admin role
    if (adminUser.role !== 'admin' && adminUser.role !== 'groomer') {
      console.error('[Calendar OAuth Callback] User is not admin:', adminUser.role);
      const redirectUrl = new URL(
        '/admin/settings?tab=calendar&error=unauthorized',
        process.env.NEXT_PUBLIC_APP_URL!
      );
      return NextResponse.redirect(redirectUrl);
    }


    // Exchange authorization code for tokens
    let tokens;
    try {
      tokens = await exchangeCodeForTokens(code);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Calendar OAuth Callback] Token exchange failed:', errorMsg);
      const redirectUrl = new URL(
        '/admin/settings?tab=calendar&error=token_exchange_failed',
        process.env.NEXT_PUBLIC_APP_URL!
      );
      redirectUrl.searchParams.set('detail', errorMsg.substring(0, 200));
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
        serviceClient,
        adminId,
        tokens,
        calendarEmail,
        calendarId
      );


      // Redirect to settings page with success status
      const redirectUrl = new URL(
        '/admin/settings?tab=calendar&status=connected',
        process.env.NEXT_PUBLIC_APP_URL!
      );
      return NextResponse.redirect(redirectUrl);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Calendar OAuth Callback] Failed to create connection:', errorMsg, error);

      // Check if error is due to existing connection
      if (errorMsg.includes('already exists')) {
        const redirectUrl = new URL(
          '/admin/settings?tab=calendar&error=already_connected',
          process.env.NEXT_PUBLIC_APP_URL!
        );
        return NextResponse.redirect(redirectUrl);
      }

      const redirectUrl = new URL(
        '/admin/settings?tab=calendar&error=connection_failed',
        process.env.NEXT_PUBLIC_APP_URL!
      );
      redirectUrl.searchParams.set('detail', errorMsg.substring(0, 200));
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Calendar OAuth Callback] Unexpected error:', errorMsg, error);

    const redirectUrl = new URL(
      '/admin/settings?tab=calendar&error=server_error',
      process.env.NEXT_PUBLIC_APP_URL!
    );
    redirectUrl.searchParams.set('detail', errorMsg.substring(0, 200));
    return NextResponse.redirect(redirectUrl);
  }
}
