/**
 * Google Calendar OAuth Disconnect Endpoint
 * POST /api/admin/calendar/auth/disconnect
 * Task 0009: Disconnect calendar and revoke OAuth tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getActiveConnection, deleteConnection } from '@/lib/calendar/connection';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user: adminUser } = await requireAdmin(supabase);

    console.log('[Calendar Disconnect] Admin user:', adminUser.email);

    // Get active calendar connection
    const connection = await getActiveConnection(supabase, adminUser.id);

    if (!connection) {
      console.log('[Calendar Disconnect] No active connection found for admin:', adminUser.id);
      return NextResponse.json(
        {
          error: 'No calendar connection found',
          message: 'You do not have an active Google Calendar connection.',
        },
        { status: 404 }
      );
    }

    console.log('[Calendar Disconnect] Disconnecting calendar for admin:', adminUser.id);

    // Delete connection (this will also revoke OAuth tokens and cascade delete event mappings)
    try {
      await deleteConnection(supabase, connection.id, true);

      console.log('[Calendar Disconnect] Successfully disconnected calendar');

      return NextResponse.json({
        success: true,
        message: 'Google Calendar disconnected successfully',
      });
    } catch (error) {
      console.error('[Calendar Disconnect] Failed to delete connection:', error);

      // If token revocation failed but connection was deleted, still return success
      if (
        error instanceof Error &&
        error.message.includes('Failed to revoke')
      ) {
        return NextResponse.json({
          success: true,
          message: 'Calendar disconnected (token revocation may have failed)',
          warning: 'Please manually revoke access at https://myaccount.google.com/permissions',
        });
      }

      return NextResponse.json(
        {
          error: 'Failed to disconnect calendar',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Calendar Disconnect] Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Failed to disconnect calendar',
        details: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
