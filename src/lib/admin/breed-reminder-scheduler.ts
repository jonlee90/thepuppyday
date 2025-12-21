/**
 * Breed-based Grooming Reminder Scheduler
 * Task 0037: Automated breed-based grooming reminders for retention marketing
 * Task 0038: Updated to use new SMS and Email notification templates
 *
 * Runs daily at 9 AM to send grooming reminders based on breed frequency.
 * Sends reminders 7 days before the pet is due for grooming.
 */

import type { AppSupabaseClient } from '@/lib/supabase/server';
import type { NotificationPreferences } from '@/types/database';
import { randomUUID } from 'crypto';

export interface BreedReminderStats {
  eligible_count: number;
  sent_count: number;
  skipped_count: number;
  errors: string[];
}

export interface EligiblePet {
  id: string;
  name: string;
  customer_id: string;
  breed_id: string;
  size: string;
  last_appointment_date: string;
  grooming_frequency_weeks: number;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    preferences: NotificationPreferences | Record<string, unknown>;
  };
  breed: {
    name: string;
    reminder_message: string | null;
  };
}

interface CampaignSendRecord {
  campaign_id: string | null;
  user_id: string;
  notification_log_id: string | null;
  variant: null;
  sent_at: string;
  tracking_id: string;
  pet_id: string;
  attempt_count: number;
}

/**
 * Main function to process and send breed-based grooming reminders
 */
export async function processBreedReminders(
  supabase: AppSupabaseClient
): Promise<BreedReminderStats> {
  const stats: BreedReminderStats = {
    eligible_count: 0,
    sent_count: 0,
    skipped_count: 0,
    errors: [],
  };

  try {
    console.log('[Breed Reminder Scheduler] Starting daily reminder processing...');

    // Step 1: Find pets eligible for reminders (7 days before next grooming)
    const eligiblePets = await findEligiblePets(supabase);
    stats.eligible_count = eligiblePets.length;

    console.log(`[Breed Reminder Scheduler] Found ${eligiblePets.length} eligible pets`);

    // Step 2: Process each pet and send reminders
    for (const pet of eligiblePets) {
      try {
        // Check if pet has upcoming appointments (skip if yes)
        const hasUpcoming = await hasUpcomingAppointment(supabase, pet.id, pet.customer_id);
        if (hasUpcoming) {
          console.log(`[Breed Reminder Scheduler] Skipping pet ${pet.name} - has upcoming appointment`);
          stats.skipped_count++;
          continue;
        }

        // Check for recent appointments within 14 days (skip if yes)
        const hasRecentAppointment = await hasAppointmentWithinDays(supabase, pet.id, 14);
        if (hasRecentAppointment) {
          console.log(`[Breed Reminder Scheduler] Skipping pet ${pet.name} - has appointment within 14 days`);
          stats.skipped_count++;
          continue;
        }

        // Check if we've already sent reminders recently
        const attemptCount = await getRecentAttemptCount(supabase, pet.customer_id, pet.id);
        if (attemptCount >= 2) {
          console.log(`[Breed Reminder Scheduler] Skipping pet ${pet.name} - max attempts (2) reached`);
          stats.skipped_count++;
          continue;
        }

        // Check customer notification preferences
        const customerPrefs = pet.customer.preferences as NotificationPreferences | Record<string, unknown>;
        const emailEnabled = 'email_promotional' in customerPrefs ? customerPrefs.email_promotional !== false : true;
        const smsEnabled = 'sms_promotional' in customerPrefs ? customerPrefs.sms_promotional === true : false;

        if (!emailEnabled && !smsEnabled) {
          console.log(`[Breed Reminder Scheduler] Skipping pet ${pet.name} - customer opted out of promotional notifications`);
          stats.skipped_count++;
          continue;
        }

        // Generate unique tracking ID for conversion tracking
        const trackingId = randomUUID();

        // Send reminder notification(s)
        const sendResult = await sendBreedReminder(
          supabase,
          pet,
          trackingId,
          emailEnabled,
          smsEnabled,
          attemptCount + 1
        );

        if (sendResult.success) {
          stats.sent_count++;
          console.log(`[Breed Reminder Scheduler] Sent reminder for pet ${pet.name}`);
        } else {
          stats.errors.push(`Failed to send reminder for pet ${pet.name}: ${sendResult.error}`);
          stats.skipped_count++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        stats.errors.push(`Error processing pet ${pet.name}: ${errorMsg}`);
        console.error(`[Breed Reminder Scheduler] Error processing pet ${pet.name}:`, error);
      }
    }

    console.log(`[Breed Reminder Scheduler] Completed. Stats:`, stats);
    return stats;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    stats.errors.push(`Fatal error: ${errorMsg}`);
    console.error('[Breed Reminder Scheduler] Fatal error:', error);
    return stats;
  }
}

/**
 * Find pets eligible for grooming reminders
 * Eligibility: last_appointment_date + breed.grooming_frequency_weeks = today + 7 days
 */
async function findEligiblePets(supabase: AppSupabaseClient): Promise<EligiblePet[]> {
  try {
    // Calculate target date: 7 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`[Breed Reminder Scheduler] Looking for pets due on ${targetDateStr}`);

    // Get all active pets with breeds and their last appointment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: petsData, error: petsError } = await (supabase as any)
      .from('pets')
      .select(`
        id,
        name,
        owner_id,
        breed_id,
        size,
        breeds!inner (
          id,
          name,
          grooming_frequency_weeks,
          reminder_message
        ),
        users!owner_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          preferences
        )
      `)
      .eq('is_active', true)
      .not('breed_id', 'is', null);

    if (petsError) {
      console.error('[Breed Reminder Scheduler] Error fetching pets:', petsError);
      return [];
    }

    if (!petsData || petsData.length === 0) {
      console.log('[Breed Reminder Scheduler] No active pets with breeds found');
      return [];
    }

    // For each pet, get their last completed appointment
    const eligiblePets: EligiblePet[] = [];

    for (const pet of petsData) {
      try {
        // Get last completed appointment
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: lastAppt, error: apptError } = await (supabase as any)
          .from('appointments')
          .select('scheduled_at, status')
          .eq('pet_id', pet.id)
          .eq('status', 'completed')
          .order('scheduled_at', { ascending: false })
          .limit(1)
          .single();

        if (apptError || !lastAppt) {
          // No completed appointments - skip this pet
          continue;
        }

        // Calculate next grooming due date
        const lastApptDate = new Date(lastAppt.scheduled_at);
        const groomingFrequencyDays = pet.breeds.grooming_frequency_weeks * 7;
        const nextDueDate = new Date(lastApptDate);
        nextDueDate.setDate(nextDueDate.getDate() + groomingFrequencyDays);

        const nextDueDateStr = nextDueDate.toISOString().split('T')[0];

        // Check if next due date matches our target date (7 days from now)
        if (nextDueDateStr === targetDateStr) {
          eligiblePets.push({
            id: pet.id,
            name: pet.name,
            customer_id: pet.owner_id,
            breed_id: pet.breed_id,
            size: pet.size,
            last_appointment_date: lastAppt.scheduled_at,
            grooming_frequency_weeks: pet.breeds.grooming_frequency_weeks,
            customer: {
              id: pet.users.id,
              first_name: pet.users.first_name,
              last_name: pet.users.last_name,
              email: pet.users.email,
              phone: pet.users.phone,
              preferences: pet.users.preferences,
            },
            breed: {
              name: pet.breeds.name,
              reminder_message: pet.breeds.reminder_message,
            },
          });
        }
      } catch (error) {
        console.error(`[Breed Reminder Scheduler] Error processing pet ${pet.name}:`, error);
      }
    }

    return eligiblePets;
  } catch (error) {
    console.error('[Breed Reminder Scheduler] Error in findEligiblePets:', error);
    return [];
  }
}

/**
 * Check if pet has upcoming appointments
 */
async function hasUpcomingAppointment(
  supabase: AppSupabaseClient,
  petId: string,
  customerId: string
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('appointments')
      .select('id')
      .eq('pet_id', petId)
      .eq('customer_id', customerId)
      .gte('scheduled_at', now)
      .in('status', ['pending', 'confirmed', 'checked_in'])
      .limit(1);

    if (error) {
      console.error('[Breed Reminder Scheduler] Error checking upcoming appointments:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('[Breed Reminder Scheduler] Error in hasUpcomingAppointment:', error);
    return false;
  }
}

/**
 * Check if pet has appointments within next N days
 */
async function hasAppointmentWithinDays(
  supabase: AppSupabaseClient,
  petId: string,
  days: number
): Promise<boolean> {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('appointments')
      .select('id')
      .eq('pet_id', petId)
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', futureDate.toISOString())
      .in('status', ['pending', 'confirmed', 'checked_in', 'in_progress'])
      .limit(1);

    if (error) {
      console.error('[Breed Reminder Scheduler] Error checking appointments within days:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('[Breed Reminder Scheduler] Error in hasAppointmentWithinDays:', error);
    return false;
  }
}

/**
 * Get recent attempt count for breed reminders
 * Checks campaign_sends for this customer/pet in the last 30 days
 */
async function getRecentAttemptCount(
  supabase: AppSupabaseClient,
  customerId: string,
  petId: string
): Promise<number> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('campaign_sends')
      .select('id')
      .eq('user_id', customerId)
      .eq('pet_id', petId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('[Breed Reminder Scheduler] Error checking attempt count:', error);
      return 0;
    }

    return data ? data.length : 0;
  } catch (error) {
    console.error('[Breed Reminder Scheduler] Error in getRecentAttemptCount:', error);
    return 0;
  }
}

/**
 * Send breed reminder notification using new templates (Task 0038)
 */
async function sendBreedReminder(
  supabase: AppSupabaseClient,
  pet: EligiblePet,
  trackingId: string,
  emailEnabled: boolean,
  smsEnabled: boolean,
  attemptCount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const notificationLogId: string | null = null;
    const now = new Date().toISOString();

    // Build booking URL with tracking parameter
    const bookingUrl = `https://thepuppyday.com/book?pet=${pet.id}&tracking=${trackingId}`;

    // Get breed-specific message (from database or use template defaults)
    const customBreedMessage = pet.breed.reminder_message || undefined;

    // Dynamic import notification templates based on environment
    const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

    const { sendBreedReminderEmail } = USE_MOCKS
      ? await import('@/mocks/resend/breed-reminder-email')
      : await import('@/lib/resend/breed-reminder-email');

    const { sendBreedReminderSMS } = USE_MOCKS
      ? await import('@/mocks/twilio/breed-reminder-sms')
      : await import('@/lib/twilio/breed-reminder-sms');

    // Send email notification if enabled
    if (emailEnabled && pet.customer.email) {
      try {
        const emailResult = await sendBreedReminderEmail(supabase, {
          customerName: pet.customer.first_name,
          customerEmail: pet.customer.email,
          customerId: pet.customer_id,
          petName: pet.name,
          petId: pet.id,
          breedName: pet.breed.name,
          breedMessage: customBreedMessage || `Based on your pet's breed, regular grooming helps keep them healthy and comfortable.`,
          trackingId,
          bookingUrl,
          // petPhotoUrl: undefined, // Could fetch from storage if available
        });

        if (emailResult.success && emailResult.emailId) {
          console.log(`[Breed Reminder Scheduler] Email sent to ${pet.customer.email}: ${emailResult.emailId}`);
          // The email template handles logging to notifications_log
        } else {
          console.error(`[Breed Reminder Scheduler] Email failed: ${emailResult.error}`);
        }
      } catch (error) {
        console.error('[Breed Reminder Scheduler] Error sending email:', error);
      }
    }

    // Send SMS notification if enabled
    if (smsEnabled && pet.customer.phone) {
      try {
        const smsResult = await sendBreedReminderSMS(supabase, {
          customerName: pet.customer.first_name,
          customerPhone: pet.customer.phone,
          customerId: pet.customer_id,
          petName: pet.name,
          petId: pet.id,
          breedName: pet.breed.name,
          breedMessage: customBreedMessage,
          trackingId,
          bookingUrl,
        });

        if (smsResult.success && smsResult.messageSid) {
          console.log(`[Breed Reminder Scheduler] SMS sent to ${pet.customer.phone}: ${smsResult.messageSid}`);
          // The SMS template handles logging to notifications_log
        } else {
          console.error(`[Breed Reminder Scheduler] SMS failed: ${smsResult.error}`);
        }
      } catch (error) {
        console.error('[Breed Reminder Scheduler] Error sending SMS:', error);
      }
    }

    // Create campaign_send record for tracking
    const campaignSend: Partial<CampaignSendRecord> = {
      campaign_id: null, // Breed reminders are not part of a specific campaign
      user_id: pet.customer_id,
      notification_log_id: notificationLogId,
      variant: null,
      sent_at: now,
      tracking_id: trackingId,
      pet_id: pet.id,
      attempt_count: attemptCount,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: campaignSendError } = await (supabase as any)
      .from('campaign_sends')
      .insert(campaignSend);

    if (campaignSendError) {
      console.error('[Breed Reminder Scheduler] Error creating campaign_send:', campaignSendError);
      return { success: false, error: 'Failed to create campaign_send record' };
    }

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Breed Reminder Scheduler] Error in sendBreedReminder:', error);
    return { success: false, error: errorMsg };
  }
}
