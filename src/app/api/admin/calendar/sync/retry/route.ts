/**
 * Calendar Sync Retry Endpoint
 * POST endpoint to retry failed sync operations
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pushAppointmentToCalendar } from '@/lib/calendar/sync/push';
import { removeFromQueue } from '@/lib/calendar/sync/retry-queue';

/**
 * POST /api/admin/calendar/sync/retry
 * Retry failed sync for specific appointments
 *
 * Body:
 * {
 *   "appointmentIds": ["uuid1", "uuid2"]
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
    const { appointmentIds } = body;

    if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: appointmentIds array is required' },
        { status: 400 }
      );
    }

    // Process each appointment
    const results = [];
    let succeeded = 0;
    let failed = 0;

    for (const appointmentId of appointmentIds) {
      try {
        // Fetch appointment data with all required joins
        const { data: appointment, error: fetchError } = await supabase
          .from('appointments')
          .select(`
            id,
            customer_id,
            pet_id,
            service_id,
            scheduled_at,
            status,
            notes,
            customer:users!customer_id (
              first_name,
              last_name,
              email,
              phone
            ),
            pet:pets (
              name,
              size
            ),
            service:services (
              name,
              duration_minutes
            ),
            appointment_addons (
              addon:addons (
                id,
                name,
                duration_minutes
              )
            )
          `)
          .eq('id', appointmentId)
          .single();

        if (fetchError || !appointment) {
          results.push({
            appointmentId,
            success: false,
            error: `Appointment not found: ${appointmentId}`,
          });
          failed++;
          continue;
        }

        // Transform appointment data to expected format
        const appointmentForSync = {
          ...appointment,
          customer: Array.isArray(appointment.customer)
            ? appointment.customer[0]
            : appointment.customer,
          pet: Array.isArray(appointment.pet) ? appointment.pet[0] : appointment.pet,
          service: Array.isArray(appointment.service)
            ? appointment.service[0]
            : appointment.service,
          addons: appointment.appointment_addons?.map((aa: any) => ({
            addon_id: aa.addon.id,
            addon_name: aa.addon.name,
            duration_minutes: aa.addon.duration_minutes,
          })) || [],
        };

        // Attempt to sync
        const syncResult = await pushAppointmentToCalendar(
          supabase,
          appointmentForSync,
          true // Force sync
        );

        if (syncResult.success) {
          // Remove from retry queue on success
          await removeFromQueue(supabase, appointmentId);

          results.push({
            appointmentId,
            success: true,
            googleEventId: syncResult.google_event_id,
          });
          succeeded++;
        } else {
          results.push({
            appointmentId,
            success: false,
            error: syncResult.error?.message || 'Unknown sync error',
          });
          failed++;
        }
      } catch (error) {
        console.error(`[Retry API] Error processing appointment ${appointmentId}:`, error);
        results.push({
          appointmentId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }

      // Small delay between retries to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return NextResponse.json({
      success: true,
      results,
      succeeded,
      failed,
      total: appointmentIds.length,
    });
  } catch (error) {
    console.error('[Retry API] Error processing retry request:', error);

    return NextResponse.json(
      {
        error: 'Failed to process retry request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
