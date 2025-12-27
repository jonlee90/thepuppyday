/**
 * Calendar Connection Resume Endpoint
 * POST endpoint to resume auto-sync for paused connection
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resumeAutoSync } from '@/lib/calendar/sync/pause-manager';

/**
 * POST /api/admin/calendar/connection/resume
 * Resume auto-sync for paused connection
 *
 * Body:
 * {
 *   "connectionId": "uuid"
 * }
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

    // Parse request body
    const body = await request.json();
    const { connectionId } = body;

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Invalid request: connectionId is required' },
        { status: 400 }
      );
    }

    // Verify connection exists and belongs to user
    const { data: connection, error: connectionError } = await supabase
      .from('calendar_connections')
      .select('id, user_id, auto_sync_paused, pause_reason')
      .eq('id', connectionId)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'Calendar connection not found' },
        { status: 404 }
      );
    }

    if (connection.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Connection belongs to another user' },
        { status: 403 }
      );
    }

    // Check if connection is actually paused
    if (!connection.auto_sync_paused) {
      return NextResponse.json({
        success: true,
        message: 'Auto-sync is already active',
        wasAlreadyActive: true,
      });
    }

    // Resume auto-sync
    await resumeAutoSync(supabase, connectionId);

    console.log(`[Resume API] Auto-sync resumed for connection ${connectionId}`);

    return NextResponse.json({
      success: true,
      message: 'Auto-sync resumed successfully',
      wasAlreadyActive: false,
      previousPauseReason: connection.pause_reason,
    });
  } catch (error) {
    console.error('[Resume API] Error resuming auto-sync:', error);

    return NextResponse.json(
      {
        error: 'Failed to resume auto-sync',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
