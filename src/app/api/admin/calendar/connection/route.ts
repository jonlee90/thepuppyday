/**
 * Google Calendar Connection Status Endpoint
 * GET /api/admin/calendar/connection
 * Task 0010: Return connection status and metadata
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AppSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getActiveConnection } from '@/lib/calendar/connection';
import type { CalendarConnectionStatus } from '@/types/calendar';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { user: adminUser } = await requireAdmin(supabase);


    // Get active calendar connection
    const connection = await getActiveConnection(supabase, adminUser.id);

    // If no connection exists, return not connected status
    if (!connection) {

      const response: CalendarConnectionStatus = {
        connected: false,
      };

      return NextResponse.json(response);
    }


    // Fetch sync statistics from the last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Fetch all three counts in parallel
    const [
      { count: totalSyncedCount },
      { count: last24hCount },
      { count: failedLast24hCount },
    ] = await Promise.all([
      (supabase as AppSupabaseClient)
        .from('calendar_event_mapping')
        .select('*', { count: 'exact', head: true })
        .eq('connection_id', connection.id),
      (supabase as AppSupabaseClient)
        .from('calendar_sync_log')
        .select('*', { count: 'exact', head: true })
        .eq('connection_id', connection.id)
        .eq('status', 'success')
        .gte('created_at', twentyFourHoursAgo.toISOString()),
      (supabase as AppSupabaseClient)
        .from('calendar_sync_log')
        .select('*', { count: 'exact', head: true })
        .eq('connection_id', connection.id)
        .eq('status', 'failed')
        .gte('created_at', twentyFourHoursAgo.toISOString()),
    ]);

    // Build response
    const response: CalendarConnectionStatus = {
      connected: true,
      connection: {
        id: connection.id,
        calendar_email: connection.calendar_email,
        calendar_id: connection.calendar_id,
        last_sync_at: connection.last_sync_at,
        is_active: connection.is_active,
      },
      sync_stats: {
        total_synced: totalSyncedCount || 0,
        last_24h: last24hCount || 0,
        failed_last_24h: failedLast24hCount || 0,
      },
    };


    return NextResponse.json(response);
  } catch (error) {
    console.error('[Calendar Connection Status] Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch connection status',
        details: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
