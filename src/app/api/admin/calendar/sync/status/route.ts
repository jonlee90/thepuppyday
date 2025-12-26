/**
 * Sync Status Endpoint
 * GET endpoint for sync health metrics
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveConnection } from '@/lib/calendar/connection';
import { getSyncStatistics } from '@/lib/calendar/sync-logger';
import { getSyncedAppointmentsCount } from '@/lib/calendar/event-mapping-repository';

/**
 * GET /api/admin/calendar/sync/status
 * Get sync health metrics and statistics
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get active calendar connection
    const connection = await getActiveConnection(supabase, user.id);

    if (!connection) {
      return NextResponse.json(
        {
          connected: false,
          message: 'No active calendar connection found',
        }
      );
    }

    // Get sync statistics
    const statistics = await getSyncStatistics(supabase, connection.id);

    // Get total synced appointments
    const totalSynced = await getSyncedAppointmentsCount(supabase, connection.id);

    // Get last sync time from connection
    const lastSyncAt = connection.last_sync_at
      ? new Date(connection.last_sync_at).toISOString()
      : null;

    // Calculate success rate
    const successRate = statistics.total > 0
      ? Math.round((statistics.successful / statistics.total) * 100)
      : 0;

    // Return status
    return NextResponse.json({
      connected: true,
      connection: {
        id: connection.id,
        calendar_email: connection.calendar_email,
        calendar_id: connection.calendar_id,
        is_active: connection.is_active,
      },
      sync_stats: {
        total_synced: totalSynced,
        total_operations: statistics.total,
        successful_operations: statistics.successful,
        failed_operations: statistics.failed,
        last_24h: statistics.last_24h,
        failed_last_24h: statistics.failed_last_24h,
        success_rate: successRate,
        last_sync_at: lastSyncAt,
      },
      health: {
        status: statistics.failed_last_24h > 10 ? 'warning' : 'healthy',
        message: statistics.failed_last_24h > 10
          ? `High failure rate: ${statistics.failed_last_24h} failures in last 24 hours`
          : 'Sync is operating normally',
      },
    });
  } catch (error) {
    console.error('Sync status endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
