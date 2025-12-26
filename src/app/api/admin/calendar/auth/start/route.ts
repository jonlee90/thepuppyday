/**
 * Google Calendar OAuth Start Endpoint
 * POST /api/admin/calendar/auth/start
 * Task 0007: Initiate OAuth flow for Google Calendar integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { generateAuthUrl, validateOAuthConfig } from '@/lib/calendar/oauth';
import { hasActiveConnection } from '@/lib/calendar/connection';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user: adminUser } = await requireAdmin(supabase);

    console.log('[Calendar OAuth Start] Admin user:', adminUser.email);

    // Validate OAuth configuration
    try {
      validateOAuthConfig();
    } catch (error) {
      console.error('[Calendar OAuth Start] OAuth config validation failed:', error);
      return NextResponse.json(
        {
          error: 'Google Calendar integration is not configured',
          details:
            error instanceof Error
              ? error.message
              : 'Missing OAuth credentials',
        },
        { status: 500 }
      );
    }

    // Check if admin already has an active connection
    const existingConnection = await hasActiveConnection(supabase, adminUser.id);
    if (existingConnection) {
      console.log(
        '[Calendar OAuth Start] Admin already has active connection:',
        adminUser.id
      );
      return NextResponse.json(
        {
          error: 'Calendar already connected',
          message:
            'You already have a Google Calendar connection. Please disconnect before creating a new connection.',
        },
        { status: 409 }
      );
    }

    // Generate OAuth authorization URL with admin ID in state
    const authUrl = generateAuthUrl(adminUser.id);

    console.log('[Calendar OAuth Start] Generated auth URL for admin:', adminUser.id);

    return NextResponse.json({
      authUrl,
      message: 'Authorization URL generated successfully',
    });
  } catch (error) {
    console.error('[Calendar OAuth Start] Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Failed to initiate OAuth flow',
        details:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
