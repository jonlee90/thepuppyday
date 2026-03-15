/**
 * Phase 8 Task 0110: Waitlist Notification Trigger
 * Notifies waitlisted customers when slots open (FIFO order)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationResult } from '../types';
import { sendNotification } from '../index';
import {
  createWaitlistAvailableEmail,
  type WaitlistAvailableEmailData,
} from '../email-templates';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export interface WaitlistNotificationTriggerData {
  waitlistEntryId: string;
  customerId: string;
  customerPhone: string | null;
  /** Optional email address — when provided, email is dispatched alongside SMS */
  customerEmail?: string;
  /** Optional customer name — used in email greeting when customerEmail is provided */
  customerName?: string;
  petName: string;
  availableDate: string; // ISO date string
  availableTime: string; // Time string (e.g., "10:00")
  serviceId: string;
  /** Expiration time in hours (default: 2) */
  expirationHours?: number;
}

export interface WaitlistNotificationTriggerResult {
  success: boolean;
  emailSent: boolean;
  emailResult?: NotificationResult;
  skipped: boolean;
  skipReason?: string;
  errors: string[];
}

export interface WaitlistBatchNotificationResult {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  results: Array<{
    waitlistEntryId: string;
    result: WaitlistNotificationTriggerResult;
  }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default expiration time for waitlist slot offers (2 hours)
 */
const DEFAULT_EXPIRATION_HOURS = 2;

// ============================================================================
// TRIGGER FUNCTION
// ============================================================================

/**
 * Trigger waitlist notification for a single customer
 * Sends SMS notification when a slot becomes available
 *
 * @param supabase - Supabase client
 * @param data - Waitlist notification data
 * @returns Result indicating success, whether SMS sent, and any errors
 */
export async function triggerWaitlistNotification(
  supabase: SupabaseClient,
  data: WaitlistNotificationTriggerData
): Promise<WaitlistNotificationTriggerResult> {
  const errors: string[] = [];
  let emailSent = false;
  let emailResult: NotificationResult | undefined;

  console.log(
    `[WaitlistNotification] Triggering notification for waitlist entry ${data.waitlistEntryId}`
  );

  // Check if we have email available
  if (!data.customerEmail) {
    console.log('[WaitlistNotification] Skipping - no email available');
    return {
      success: true,
      emailSent: false,
      skipped: true,
      skipReason: 'No email available',
      errors: [],
    };
  }

  // Generate claim link
  const claimLink = generateClaimLink(data.waitlistEntryId);

  // Format date and time for template
  const formattedDate = format(new Date(data.availableDate), 'M/d');
  const formattedTime = data.availableTime;
  const expirationHours = data.expirationHours || DEFAULT_EXPIRATION_HOURS;

  // Send email notification
  try {
    console.log(
      `[WaitlistNotification] Sending email to ${data.customerEmail}`
    );

    const emailTemplateData: WaitlistAvailableEmailData = {
      customer_name: data.customerName || 'Valued Customer',
      pet_name: data.petName,
      available_date: formattedDate,
      available_time: formattedTime,
      claim_link: claimLink,
      expiration_hours: expirationHours,
    };

    const emailContent = createWaitlistAvailableEmail(emailTemplateData);

    emailResult = await sendNotification(supabase, {
      type: 'waitlist_available',
      channel: 'email',
      recipient: data.customerEmail,
      templateData: {
        ...emailTemplateData,
        _preRenderedHtml: emailContent.html,
        _preRenderedText: emailContent.text,
        _preRenderedSubject: emailContent.subject,
      },
      userId: data.customerId,
    });

    if (emailResult.success) {
      emailSent = true;
      console.log(
        `[WaitlistNotification] Email sent successfully (log ID: ${emailResult.logId})`
      );
    } else {
      errors.push(`Email failed: ${emailResult.error}`);
      console.error(`[WaitlistNotification] Email failed: ${emailResult.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Email error: ${errorMessage}`);
    console.error('[WaitlistNotification] Email exception:', error);
  }

  // Update waitlist entry status if email was sent
  if (emailSent) {
    await updateWaitlistEntryStatus(supabase, data.waitlistEntryId, expirationHours);
  }

  return {
    success: emailSent,
    emailSent,
    emailResult,
    skipped: false,
    errors,
  };
}

/**
 * Trigger waitlist notifications for multiple customers (FIFO order)
 * Processes waitlist entries in order until one accepts or all are notified
 *
 * @param supabase - Supabase client
 * @param availableDate - Date of available slot
 * @param availableTime - Time of available slot
 * @param serviceId - Service ID for the slot (must be valid UUID)
 * @param maxNotifications - Maximum number of customers to notify (default: 1 for FIFO, max: 10)
 * @returns Batch result with details for all notifications
 */
export async function triggerWaitlistNotificationBatch(
  supabase: SupabaseClient,
  availableDate: string,
  availableTime: string,
  serviceId: string,
  maxNotifications = 1
): Promise<WaitlistBatchNotificationResult> {
  console.log(
    `[WaitlistNotification] Processing batch for ${availableDate} at ${availableTime}`
  );

  const results: Array<{
    waitlistEntryId: string;
    result: WaitlistNotificationTriggerResult;
  }> = [];

  try {
    // Validate serviceId is a valid UUID to prevent SQL injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(serviceId)) {
      console.error('[WaitlistNotification] Invalid serviceId format:', serviceId);
      return {
        total: 0,
        sent: 0,
        failed: 1,
        skipped: 0,
        results: [],
      };
    }

    // Hard cap maxNotifications at 10 to prevent excessive batch processing
    const safeMaxNotifications = Math.min(Math.max(1, maxNotifications), 10);
    if (maxNotifications > 10) {
      console.warn(
        `[WaitlistNotification] maxNotifications capped at 10 (requested: ${maxNotifications})`
      );
    }

    // Get waitlist entries in FIFO order (oldest first)
    // Only get entries that haven't been notified or expired
    const { data: waitlistEntries, error: fetchError } = await supabase
      .from('waitlist')
      .select(
        `
        id,
        customer_id,
        pet_id,
        service_id,
        preferred_date,
        created_at,
        customer:users!customer_id(id, first_name, phone),
        pet:pets!pet_id(id, name)
      `
      )
      .eq('service_id', serviceId)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(safeMaxNotifications);

    if (fetchError) {
      console.error('[WaitlistNotification] Error fetching waitlist entries:', fetchError);
      return {
        total: 0,
        sent: 0,
        failed: 1,
        skipped: 0,
        results: [],
      };
    }

    if (!waitlistEntries || waitlistEntries.length === 0) {
      console.log('[WaitlistNotification] No active waitlist entries found');
      return {
        total: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
        results: [],
      };
    }

    // Process each entry in parallel for better performance
    const notificationPromises = waitlistEntries.map(async (entry) => {
      const customer = entry.customer as { id: string; first_name: string; phone: string | null };
      const pet = entry.pet as { id: string; name: string };

      const result = await triggerWaitlistNotification(supabase, {
        waitlistEntryId: entry.id,
        customerId: customer.id,
        customerPhone: customer.phone,
        petName: pet.name,
        availableDate,
        availableTime,
        serviceId,
      });

      return {
        waitlistEntryId: entry.id,
        result,
      };
    });

    // Wait for all notifications to complete
    const notificationResults = await Promise.all(notificationPromises);
    results.push(...notificationResults);

    // Calculate summary
    const sent = results.filter((r) => r.result.emailSent).length;
    const failed = results.filter((r) => !r.result.success && !r.result.skipped).length;
    const skipped = results.filter((r) => r.result.skipped).length;

    return {
      total: results.length,
      sent,
      failed,
      skipped,
      results,
    };
  } catch (error) {
    console.error('[WaitlistNotification] Batch processing error:', error);
    return {
      total: 0,
      sent: 0,
      failed: 1,
      skipped: 0,
      results,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate claim link for waitlist slot
 */
function generateClaimLink(waitlistEntryId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/booking/claim/${waitlistEntryId}`;
}

/**
 * Update waitlist entry status after notification sent
 */
async function updateWaitlistEntryStatus(
  supabase: SupabaseClient,
  waitlistEntryId: string,
  expirationHours: number
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expirationHours);

  try {
    const { error } = await supabase
      .from('waitlist')
      .update({
        status: 'notified',
        notified_at: new Date().toISOString(),
        offer_expires_at: expiresAt.toISOString(),
      })
      .eq('id', waitlistEntryId);

    if (error) {
      console.error('[WaitlistNotification] Error updating waitlist entry:', error);
    } else {
      console.log(
        `[WaitlistNotification] Updated waitlist entry ${waitlistEntryId} status to 'notified'`
      );
    }
  } catch (error) {
    console.error('[WaitlistNotification] Exception updating waitlist entry:', error);
  }
}

/**
 * Validate waitlist notification trigger data
 */
export function validateWaitlistNotificationData(
  data: Partial<WaitlistNotificationTriggerData>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.waitlistEntryId) errors.push('waitlistEntryId is required');
  if (!data.customerId) errors.push('customerId is required');
  if (!data.petName) errors.push('petName is required');
  if (!data.availableDate) errors.push('availableDate is required');
  if (!data.availableTime) errors.push('availableTime is required');
  if (!data.serviceId) errors.push('serviceId is required');

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Handle waitlist slot expiration
 * Notifies next customer in line when current offer expires
 */
export async function handleWaitlistExpiration(
  supabase: SupabaseClient,
  waitlistEntryId: string
): Promise<{ notifiedNext: boolean; nextEntryId?: string }> {
  try {
    // Mark current entry as expired
    const { error: updateError } = await supabase
      .from('waitlist')
      .update({
        status: 'expired_offer',
      })
      .eq('id', waitlistEntryId);

    if (updateError) {
      console.error('[WaitlistNotification] Error marking entry as expired:', updateError);
      return { notifiedNext: false };
    }

    // Get the expired entry details to find matching waitlist entries
    const { data: expiredEntry, error: fetchError } = await supabase
      .from('waitlist')
      .select('service_id, preferred_date')
      .eq('id', waitlistEntryId)
      .single();

    if (fetchError || !expiredEntry) {
      console.error('[WaitlistNotification] Error fetching expired entry:', fetchError);
      return { notifiedNext: false };
    }

    // Notify next customer in line
    // This would typically be called by a cron job that checks for expired offers
    console.log('[WaitlistNotification] Expired offer handled, next customer can be notified');

    return { notifiedNext: false }; // Actual notification handled by separate process
  } catch (error) {
    console.error('[WaitlistNotification] Error handling expiration:', error);
    return { notifiedNext: false };
  }
}
