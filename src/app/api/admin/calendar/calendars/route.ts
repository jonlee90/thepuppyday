/**
 * Google Calendar List Endpoint
 * GET /api/admin/calendar/calendars
 * Task 0012: List available Google Calendars for the connected account
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getActiveConnection } from '@/lib/calendar/connection';
import { getValidAccessToken } from '@/lib/calendar/token-manager';
import { createAuthenticatedClient } from '@/lib/calendar/oauth';
import { google } from 'googleapis';
import type { GoogleCalendarInfo } from '@/types/calendar';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { user: adminUser } = await requireAdmin(supabase);

    console.log('[Calendar List] Admin user:', adminUser.email);

    // Get active calendar connection
    const connection = await getActiveConnection(supabase, adminUser.id);

    if (!connection) {
      console.log('[Calendar List] No active connection for admin:', adminUser.id);
      return NextResponse.json(
        {
          error: 'No calendar connection found',
          message: 'Please connect Google Calendar first.',
        },
        { status: 404 }
      );
    }

    console.log('[Calendar List] Fetching calendars for connection:', connection.id);

    // Get valid access token (auto-refreshes if expired)
    let accessToken: string;
    try {
      accessToken = await getValidAccessToken(supabase, connection.id);
    } catch (error) {
      console.error('[Calendar List] Failed to get valid access token:', error);

      // Check if connection was invalidated
      if (
        error instanceof Error &&
        error.message.includes('reconnect Google Calendar')
      ) {
        return NextResponse.json(
          {
            error: 'Calendar connection expired',
            message: 'Please reconnect your Google Calendar.',
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to authenticate with Google Calendar',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Create authenticated Google Calendar client
    const oauth2Client = createAuthenticatedClient({
      access_token: accessToken,
      refresh_token: '', // Not needed for this operation
      expiry_date: Date.now() + 3600000, // Not critical for this operation
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/calendar.events',
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Fetch calendar list from Google
    let calendarList;
    try {
      const response = await calendar.calendarList.list({
        minAccessRole: 'writer', // Only calendars where user can create events
        showHidden: false,
        showDeleted: false,
      });

      calendarList = response.data.items || [];
    } catch (error) {
      console.error('[Calendar List] Failed to fetch calendars from Google:', error);

      return NextResponse.json(
        {
          error: 'Failed to fetch calendars from Google',
          details:
            error instanceof Error
              ? error.message
              : 'Google Calendar API error',
        },
        { status: 500 }
      );
    }

    // Transform calendar list to our format
    const calendars: GoogleCalendarInfo[] = calendarList.map((cal) => ({
      id: cal.id || '',
      summary: cal.summary || 'Untitled Calendar',
      description: cal.description,
      timeZone: cal.timeZone || 'America/Los_Angeles',
      primary: cal.primary || false,
    }));

    // Sort calendars: primary first, then by summary
    calendars.sort((a, b) => {
      if (a.primary && !b.primary) return -1;
      if (!a.primary && b.primary) return 1;
      return a.summary.localeCompare(b.summary);
    });

    console.log('[Calendar List] Found', calendars.length, 'calendars');

    return NextResponse.json({
      calendars,
      current_calendar_id: connection.calendar_id,
      total: calendars.length,
    });
  } catch (error) {
    console.error('[Calendar List] Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch calendars',
        details: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
