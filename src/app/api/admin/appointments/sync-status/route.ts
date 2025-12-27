/**
 * Batch Sync Status Endpoint
 * GET /api/admin/appointments/sync-status?ids=id1,id2,id3
 * Returns calendar sync status for multiple appointments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AppSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

export interface SyncStatusData {
  status: 'synced' | 'pending' | 'failed' | 'not_eligible';
  lastSyncedAt?: string;
  error?: string;
  googleEventId?: string;
}

export type SyncStatusMap = Record<string, SyncStatusData>;

/**
 * GET /api/admin/appointments/sync-status?ids=id1,id2,id3
 * Fetch sync status for multiple appointments
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Parse appointment IDs from query string
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'Missing required parameter: ids' },
        { status: 400 }
      );
    }

    const appointmentIds = idsParam.split(',').filter(Boolean);

    if (appointmentIds.length === 0) {
      return NextResponse.json({ syncStatus: {} });
    }

    // Fetch event mappings for the given appointment IDs
    const { data: mappings, error: mappingsError } = await (supabase as AppSupabaseClient)
      .from('calendar_event_mapping')
      .select('appointment_id, google_event_id, last_synced_at, connection_id')
      .in('appointment_id', appointmentIds);

    if (mappingsError) {
      console.error('[Sync Status] Error fetching event mappings:', mappingsError);
      return NextResponse.json(
        { error: 'Failed to fetch sync status' },
        { status: 500 }
      );
    }

    // Build a map of appointment_id -> mapping
    const mappingMap = new Map(
      (mappings || []).map((m) => [m.appointment_id, m])
    );

    // Fetch latest sync log entries for these appointments
    // Get the most recent log entry for each appointment
    const { data: syncLogs, error: logsError } = await (supabase as AppSupabaseClient)
      .from('calendar_sync_log')
      .select('appointment_id, status, error_message, google_event_id, created_at')
      .in('appointment_id', appointmentIds)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('[Sync Status] Error fetching sync logs:', logsError);
      // Continue without sync logs - we can still show basic mapping status
    }

    // Build a map of appointment_id -> latest sync log
    interface SyncLog {
      appointment_id: string;
      status: string;
      created_at: string;
      error_details?: string;
    }
    const syncLogMap = new Map<string, SyncLog>();
    if (syncLogs) {
      for (const log of syncLogs) {
        if (!syncLogMap.has(log.appointment_id)) {
          syncLogMap.set(log.appointment_id, log);
        }
      }
    }

    // Build sync status map
    const syncStatusMap: SyncStatusMap = {};

    for (const appointmentId of appointmentIds) {
      const mapping = mappingMap.get(appointmentId);
      const latestLog = syncLogMap.get(appointmentId);

      if (!mapping) {
        // No mapping exists - check if there's a failed sync attempt
        if (latestLog && latestLog.status === 'failed') {
          syncStatusMap[appointmentId] = {
            status: 'failed',
            error: latestLog.error_message || 'Sync failed',
          };
        } else if (latestLog && latestLog.status === 'partial') {
          syncStatusMap[appointmentId] = {
            status: 'pending',
            lastSyncedAt: latestLog.created_at,
          };
        } else {
          // No mapping, no failed log - appointment is not eligible or not synced yet
          syncStatusMap[appointmentId] = {
            status: 'not_eligible',
          };
        }
      } else {
        // Mapping exists
        const googleEventId = mapping.google_event_id;
        const lastSyncedAt = mapping.last_synced_at;

        // Check if the latest log shows a failure AFTER the mapping was created
        if (
          latestLog &&
          latestLog.status === 'failed' &&
          new Date(latestLog.created_at) > new Date(lastSyncedAt)
        ) {
          syncStatusMap[appointmentId] = {
            status: 'failed',
            lastSyncedAt,
            error: latestLog.error_message || 'Sync failed',
            googleEventId,
          };
        } else {
          // Successfully synced
          syncStatusMap[appointmentId] = {
            status: 'synced',
            lastSyncedAt,
            googleEventId,
          };
        }
      }
    }

    return NextResponse.json({ syncStatus: syncStatusMap });
  } catch (error) {
    console.error('[Sync Status] Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
