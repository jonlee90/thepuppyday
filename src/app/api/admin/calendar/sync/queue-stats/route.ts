/**
 * Calendar Sync Queue Stats Endpoint
 * GET endpoint for retry queue statistics
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getQueueStats } from '@/lib/calendar/sync/retry-queue';

/**
 * GET /api/admin/calendar/sync/queue-stats
 * Get retry queue statistics
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

    // Get queue statistics
    const stats = await getQueueStats(supabase);

    return NextResponse.json({
      pending: stats.pending,
      total: stats.totalInQueue,
      exceededLimit: stats.exceededLimit,
      nextRetryAt: stats.nextRetryTime,
    });
  } catch (error) {
    console.error('[Queue Stats API] Error fetching queue stats:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch queue statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
