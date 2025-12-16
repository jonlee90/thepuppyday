/**
 * Retention Reminder Cron Job
 * Task 0113: Send retention reminders to customers whose pets need grooming
 *
 * Runs daily at 9 AM (configured in vercel.json)
 * Sends email + SMS reminders to customers with pets overdue for grooming based on breed frequency
 *
 * Usage:
 * - GET/POST /api/cron/notifications/retention
 * - Header: Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getNotificationService } from '@/lib/notifications';
import type { NotificationMessage } from '@/lib/notifications/types';
import { validateCronSecret } from '@/lib/cron/auth';

/**
 * In-memory lock to prevent concurrent execution
 */
let isProcessing = false;

/**
 * GET /api/cron/notifications/retention
 * Process retention reminders for customers with pets overdue for grooming
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[Retention Reminders Cron] Starting job at:', new Date().toISOString());

    // Validate cron secret
    if (!validateCronSecret(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check for concurrent execution
    if (isProcessing) {
      console.warn('[Retention Reminders Cron] Job already running, skipping...');
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Job already running',
        timestamp: new Date().toISOString(),
      });
    }

    isProcessing = true;

    // Create service role client (bypasses RLS for system operations)
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

    console.log('[Retention Reminders Cron] Found active pets:', pets?.length || 0);

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
            console.warn(`[Retention Reminders Cron] Skipping pet ${pet.id}: No owner found`);
            skipped++;
            continue;
          }

          // Check customer marketing preferences (opt-out)
          const preferences = owner.preferences as Record<string, unknown> || {};
          const marketingOptOut = preferences.marketing_opt_out === true;

          if (marketingOptOut) {
            console.log(`[Retention Reminders Cron] Skipping pet ${pet.id}: Owner opted out of marketing`);
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
            console.error(`[Retention Reminders Cron] Error querying appointments for pet ${pet.id}:`, apptError);
            failed++;
            continue;
          }

          // Skip if no previous appointments
          if (!lastAppt) {
            console.log(`[Retention Reminders Cron] Skipping pet ${pet.id}: No previous appointments`);
            skipped++;
            continue;
          }

          // Check if pet is overdue
          const lastApptDate = new Date(lastAppt.scheduled_at);
          const daysSinceLastAppt = Math.floor((now.getTime() - lastApptDate.getTime()) / (24 * 60 * 60 * 1000));
          const weeksSinceLastAppt = Math.floor(daysSinceLastAppt / 7);
          const isOverdue = now.getTime() - lastApptDate.getTime() > groomingFrequencyMs;

          if (!isOverdue) {
            console.log(`[Retention Reminders Cron] Skipping pet ${pet.id}: Not overdue (${weeksSinceLastAppt} weeks since last appt)`);
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
            console.error(`[Retention Reminders Cron] Error checking log for pet ${pet.id}:`, logError);
            // Continue anyway
          }

          if (recentReminder) {
            console.log(`[Retention Reminders Cron] Skipping pet ${pet.id}: Reminder sent recently`);
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
              console.log(`[Retention Reminders Cron] ✅ Sent email reminder for pet ${pet.id}`);
            } else {
              console.error(`[Retention Reminders Cron] ❌ Failed to send email for pet ${pet.id}:`, emailResult.error);
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
              console.log(`[Retention Reminders Cron] ✅ Sent SMS reminder for pet ${pet.id}`);
            } else {
              console.error(`[Retention Reminders Cron] ❌ Failed to send SMS for pet ${pet.id}:`, smsResult.error);
            }
          }

          if (emailSent || smsSent) {
            sent++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
          console.error(`[Retention Reminders Cron] Error processing pet ${pet.id}:`, error);
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

    console.log('[Retention Reminders Cron] Job completed. Stats:', stats);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...stats,
    });
  } catch (error) {
    console.error('[Retention Reminders Cron] Fatal error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } finally {
    isProcessing = false;
  }
}

/**
 * POST /api/cron/notifications/retention
 * Same as GET, supports both methods for different cron services
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
