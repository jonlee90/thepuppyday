/**
 * Manual Retention Reminders Job Trigger
 * Task 0115: Admin endpoint to manually trigger retention reminder job
 *
 * Only available in development mode
 * Requires admin authentication
 *
 * Usage:
 * - POST /api/admin/notifications/jobs/retention/trigger
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getNotificationService } from '@/lib/notifications';
import type { NotificationMessage } from '@/lib/notifications/types';

/**
 * POST /api/admin/notifications/jobs/retention/trigger
 * Manually trigger retention reminders job
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

    console.log('[Manual Retention Trigger] Starting manual job at:', new Date().toISOString());

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

    const now = new Date();

    // Get active pets with their last appointment and breed grooming frequency
    const { data: pets, error: queryError } = await supabase
      .from('pets')
      .select(`
        id,
        name,
        owner_id,
        breed_id,
        owner:users!owner_id(
          id,
          first_name,
          last_name,
          email,
          phone,
          preferences
        ),
        breed:breeds!breed_id(
          id,
          name,
          grooming_frequency_weeks
        )
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (queryError) {
      throw new Error(`Failed to query pets: ${queryError.message}`);
    }

    console.log('[Manual Retention Trigger] Found active pets:', pets?.length || 0);

    let processed = 0;
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    if (pets && pets.length > 0) {
      const notificationService = getNotificationService(supabase);
      const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://thepuppyday.com'}/booking`;

      for (const pet of pets) {
        try {
          processed++;

          const owner = Array.isArray(pet.owner) ? pet.owner[0] : pet.owner;
          const breed = Array.isArray(pet.breed) ? pet.breed[0] : pet.breed;

          // Skip if no owner
          if (!owner) {
            console.warn(`[Manual Retention Trigger] Skipping pet ${pet.id}: No owner found`);
            skipped++;
            continue;
          }

          // Check customer marketing preferences (opt-out)
          const preferences = owner.preferences as Record<string, unknown> || {};
          const marketingOptOut = preferences.marketing_opt_out === true;

          if (marketingOptOut) {
            console.log(`[Manual Retention Trigger] Skipping pet ${pet.id}: Owner opted out of marketing`);
            skipped++;
            continue;
          }

          // Get grooming frequency (default to 8 weeks if no breed)
          const groomingFrequencyWeeks = breed?.grooming_frequency_weeks || 8;
          const groomingFrequencyMs = groomingFrequencyWeeks * 7 * 24 * 60 * 60 * 1000;

          // Get last completed appointment for this pet
          const { data: lastAppt, error: apptError } = await supabase
            .from('appointments')
            .select('id, scheduled_at, service:services!service_id(name)')
            .eq('pet_id', pet.id)
            .eq('status', 'completed')
            .order('scheduled_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (apptError) {
            console.error(`[Manual Retention Trigger] Error querying appointments for pet ${pet.id}:`, apptError);
            failed++;
            continue;
          }

          // Skip if no previous appointments
          if (!lastAppt) {
            console.log(`[Manual Retention Trigger] Skipping pet ${pet.id}: No previous appointments`);
            skipped++;
            continue;
          }

          // Check if pet is overdue
          const lastApptDate = new Date(lastAppt.scheduled_at);
          const daysSinceLastAppt = Math.floor((now.getTime() - lastApptDate.getTime()) / (24 * 60 * 60 * 1000));
          const weeksSinceLastAppt = Math.floor(daysSinceLastAppt / 7);
          const isOverdue = now.getTime() - lastApptDate.getTime() > groomingFrequencyMs;

          if (!isOverdue) {
            console.log(`[Manual Retention Trigger] Skipping pet ${pet.id}: Not overdue (${weeksSinceLastAppt} weeks since last appt)`);
            skipped++;
            continue;
          }

          // Check if reminder already sent recently (within 7 days)
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const { data: recentReminder, error: logError } = await supabase
            .from('notifications_log')
            .select('id')
            .eq('type', 'retention_reminder')
            .eq('customer_id', owner.id)
            .gte('created_at', sevenDaysAgo.toISOString())
            .limit(1)
            .maybeSingle();

          if (logError) {
            console.error(`[Manual Retention Trigger] Error checking log for pet ${pet.id}:`, logError);
            // Continue anyway
          }

          if (recentReminder) {
            console.log(`[Manual Retention Trigger] Skipping pet ${pet.id}: Reminder sent recently`);
            skipped++;
            continue;
          }

          // Prepare template data
          const templateData = {
            customer_name: owner.first_name,
            pet_name: pet.name,
            weeks_since_last: weeksSinceLastAppt.toString(),
            breed_name: breed?.name || 'your dog',
            booking_url: bookingUrl,
          };

          let emailSent = false;
          let smsSent = false;

          // Send email reminder
          if (owner.email) {
            const emailMessage: NotificationMessage = {
              type: 'retention_reminder',
              channel: 'email',
              recipient: owner.email,
              templateData,
              userId: owner.id,
            };

            const emailResult = await notificationService.send(emailMessage);

            if (emailResult.success) {
              emailSent = true;
              console.log(`[Manual Retention Trigger] ✅ Sent email reminder for pet ${pet.id}`);
            } else {
              console.error(`[Manual Retention Trigger] ❌ Failed to send email for pet ${pet.id}:`, emailResult.error);
            }
          }

          // Send SMS reminder
          if (owner.phone) {
            const smsMessage: NotificationMessage = {
              type: 'retention_reminder',
              channel: 'sms',
              recipient: owner.phone,
              templateData,
              userId: owner.id,
            };

            const smsResult = await notificationService.send(smsMessage);

            if (smsResult.success) {
              smsSent = true;
              console.log(`[Manual Retention Trigger] ✅ Sent SMS reminder for pet ${pet.id}`);
            } else {
              console.error(`[Manual Retention Trigger] ❌ Failed to send SMS for pet ${pet.id}:`, smsResult.error);
            }
          }

          if (emailSent || smsSent) {
            sent++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
          console.error(`[Manual Retention Trigger] Error processing pet ${pet.id}:`, error);
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

    console.log('[Manual Retention Trigger] Job completed. Stats:', stats);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...stats,
    });
  } catch (error) {
    console.error('[Manual Retention Trigger] Fatal error:', error);

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
