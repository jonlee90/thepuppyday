/**
 * Sync History Endpoint
 * GET endpoint for appointment-specific sync history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

/**
 * GET /api/admin/calendar/sync/history/[appointmentId]
 * Fetches sync history for a specific appointment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(appointmentId)) {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Verify admin authentication
    await requireAdmin(supabase);

    // Fetch sync history from calendar_sync_log table
    const { data: syncLogs, error: logsError } = await supabase
      .from('calendar_sync_log')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (logsError) {
      console.error('Error fetching sync history:', logsError);
      return NextResponse.json(
        { error: 'Failed to fetch sync history' },
        { status: 500 }
      );
    }

    // Transform database records to API response format
    const entries = syncLogs.map((log) => ({
      id: log.id,
      timestamp: log.created_at,
      action: log.operation, // 'create', 'update', 'delete'
      status: log.status, // 'success', 'failed'
      error: log.error_message,
      google_event_id: log.google_event_id,
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Unexpected error in sync history endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
