/**
 * Bulk Sync Endpoint
 * POST endpoint to trigger bulk sync of appointments
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeBulkSyncJob, estimateBulkSyncDuration } from '@/lib/calendar/sync/bulk-sync-job';
import { getActiveConnection } from '@/lib/calendar/connection';
import { bulkSyncRequestSchema } from '@/types/calendar';
import type { BulkSyncResponse } from '@/types/calendar';

/**
 * POST /api/admin/calendar/sync/bulk
 * Trigger bulk sync of appointments to Google Calendar
 */
export async function POST(request: Request) {
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

    // Parse and validate request body
    const body = await request.json();
    const validation = bulkSyncRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { dateFrom, dateTo, force } = validation.data;

    // Check if calendar connection exists
    const connection = await getActiveConnection(supabase, user.id);

    if (!connection) {
      return NextResponse.json(
        {
          error: 'No active calendar connection found',
          message: 'Please connect Google Calendar first',
        },
        { status: 400 }
      );
    }

    // Count appointments in date range for estimation
    let countQuery = supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true });

    if (dateFrom) {
      countQuery = countQuery.gte('scheduled_at', dateFrom);
    }

    if (dateTo) {
      countQuery = countQuery.lte('scheduled_at', dateTo);
    }

    const { count } = await countQuery;
    const totalAppointments = count || 0;

    if (totalAppointments === 0) {
      return NextResponse.json(
        {
          error: 'No appointments found',
          message: 'No appointments found in the specified date range',
        },
        { status: 400 }
      );
    }

    // Estimate duration
    const estimatedDuration = estimateBulkSyncDuration(totalAppointments);

    // Execute bulk sync job immediately (synchronous)
    // Note: For very large datasets, you might want to implement a job queue
    const result = await executeBulkSyncJob(supabase, {
      dateFrom,
      dateTo,
      force,
    });

    // Return results
    return NextResponse.json({
      success: true,
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      skipped: result.skipped,
      duration_ms: result.duration_ms,
      estimated_duration_seconds: estimatedDuration,
      errors: result.errors.slice(0, 10), // Limit error details to first 10
    });
  } catch (error) {
    console.error('Bulk sync endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
