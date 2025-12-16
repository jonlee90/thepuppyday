/**
 * Manual Appointment Reminders Job Trigger
 * Task 0115: Admin endpoint to manually trigger appointment reminder job
 *
 * Only available in development mode
 * Requires admin authentication
 *
 * Usage:
 * - POST /api/admin/notifications/jobs/reminders/trigger
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getNotificationService } from '@/lib/notifications';
import type { NotificationMessage } from '@/lib/notifications/types';

/**
 * POST /api/admin/notifications/jobs/reminders/trigger
 * Manually trigger appointment reminders job
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Manual job triggers are only available in development mode' },
        { status: 403 }
      );
    }

    console.log('[Manual Reminders Trigger] Starting manual job at:', new Date().toISOString());

    // Create Supabase client for authentication
    const authSupabase = await createServerSupabaseClient();

    // Require admin authentication
    try {
      await requireAdmin(authSupabase);
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    // Use service role client for actual operations (bypasses RLS)
    const supabase = createServiceRoleClient();

    // Calculate time window: 23-25 hours from now (1-hour window centered at 24 hours)
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    console.log('[Manual Reminders Trigger] Time window:', {
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
    });

    // Query appointments in the time window
    const { data: appointments, error: queryError } = await supabase
      .from('appointments')
      .select(`
        id,
        customer_id,
        scheduled_at,
        status,
        customer:users!customer_id(
          id,
          first_name,
          last_name,
          phone
        ),
        pet:pets!pet_id(
          id,
          name
        ),
        service:services!service_id(
          id,
          name
        )
      `)
      .gte('scheduled_at', windowStart.toISOString())
      .lte('scheduled_at', windowEnd.toISOString())
      .in('status', ['pending', 'confirmed'])
      .order('scheduled_at', { ascending: true });

    if (queryError) {
      throw new Error(`Failed to query appointments: ${queryError.message}`);
    }

    console.log('[Manual Reminders Trigger] Found appointments:', appointments?.length || 0);

    let processed = 0;
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    if (appointments && appointments.length > 0) {
      const notificationService = getNotificationService(supabase);

      for (const appointment of appointments) {
        try {
          processed++;

          // Validate phone number exists
          const customer = Array.isArray(appointment.customer)
            ? appointment.customer[0]
            : appointment.customer;

          if (!customer?.phone) {
            console.warn(`[Manual Reminders Trigger] Skipping appointment ${appointment.id}: No phone number`);
            skipped++;
            continue;
          }

          // Check if reminder already sent
          const { data: existingLog, error: logError } = await supabase
            .from('notifications_log')
            .select('id')
            .eq('type', 'appointment_reminder')
            .eq('channel', 'sms')
            .eq('customer_id', appointment.customer_id)
            .eq('status', 'sent')
            .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
            .limit(1)
            .maybeSingle();

          if (logError) {
            console.error(`[Manual Reminders Trigger] Error checking log for appointment ${appointment.id}:`, logError);
            // Continue anyway
          }

          if (existingLog) {
            console.log(`[Manual Reminders Trigger] Skipping appointment ${appointment.id}: Already sent`);
            skipped++;
            continue;
          }

          // Format appointment date/time
          const scheduledDate = new Date(appointment.scheduled_at);
          const appointmentDate = scheduledDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          });
          const appointmentTime = scheduledDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });

          const pet = Array.isArray(appointment.pet) ? appointment.pet[0] : appointment.pet;
          const service = Array.isArray(appointment.service) ? appointment.service[0] : appointment.service;

          // Send reminder notification
          const message: NotificationMessage = {
            type: 'appointment_reminder',
            channel: 'sms',
            recipient: customer.phone,
            templateData: {
              customer_name: customer.first_name,
              pet_name: pet?.name || 'your pet',
              service_name: service?.name || 'grooming',
              appointment_date: appointmentDate,
              appointment_time: appointmentTime,
            },
            userId: appointment.customer_id,
          };

          const result = await notificationService.send(message);

          if (result.success) {
            sent++;
            console.log(`[Manual Reminders Trigger] ✅ Sent reminder for appointment ${appointment.id}`);
          } else {
            failed++;
            console.error(`[Manual Reminders Trigger] ❌ Failed to send reminder for appointment ${appointment.id}:`, result.error);
          }
        } catch (error) {
          failed++;
          console.error(`[Manual Reminders Trigger] Error processing appointment ${appointment.id}:`, error);
        }
      }
    }

    const duration = Date.now() - startTime;
    const stats = {
      processed,
      sent,
      failed,
      skipped,
      duration_ms: duration,
    };

    console.log('[Manual Reminders Trigger] Job completed. Stats:', stats);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...stats,
    });
  } catch (error) {
    console.error('[Manual Reminders Trigger] Fatal error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
