/**
 * Campaign Send Functionality
 * Task 0046: Execute marketing campaigns and queue notifications
 */

import type { AppSupabaseClient } from '@/lib/supabase/server';
import type { SegmentCriteria, MarketingCampaign, CampaignChannel } from '@/types/marketing';
import { randomUUID } from 'crypto';

export interface AudienceMember {
  id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  preferences?: Record<string, unknown>;
}

export interface CampaignSendResult {
  success: boolean;
  sent_count: number;
  skipped_count: number;
  errors: string[];
}

/**
 * Get audience from segment criteria
 * Queries users table with joins to appointments, pets, memberships
 */
export async function getAudienceFromSegment(
  supabase: AppSupabaseClient,
  criteria: SegmentCriteria
): Promise<AudienceMember[]> {
  try {
    console.log('[Campaign Sender] Building audience from segment criteria:', criteria);

    // Start with all customers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('users')
      .select(
        `
        id,
        email,
        phone,
        first_name,
        last_name,
        preferences,
        appointments:appointments(
          id,
          scheduled_at,
          status,
          total_price,
          service_id,
          pet_id
        ),
        pets:pets(
          id,
          size,
          breed_id
        ),
        customer_memberships:customer_memberships(
          id,
          status
        )
      `
      )
      .eq('role', 'customer');

    const { data: customers, error } = await query;

    if (error) {
      console.error('[Campaign Sender] Error fetching customers:', error);
      return [];
    }

    if (!customers || customers.length === 0) {
      console.log('[Campaign Sender] No customers found');
      return [];
    }

    // Apply filters in-memory (complex joins not easily done in Supabase query)
    const filteredCustomers = applySegmentFilters(customers, criteria);

    console.log(`[Campaign Sender] Filtered to ${filteredCustomers.length} customers`);

    return filteredCustomers.map((customer) => ({
      id: customer.id,
      email: customer.email,
      phone: customer.phone,
      first_name: customer.first_name,
      last_name: customer.last_name,
      preferences: customer.preferences,
    }));
  } catch (error) {
    console.error('[Campaign Sender] Error in getAudienceFromSegment:', error);
    return [];
  }
}

/**
 * Sanitize segment criteria to prevent DoS attacks
 */
function sanitizeCriteria(criteria: SegmentCriteria): SegmentCriteria {
  return {
    ...criteria,
    min_appointments:
      criteria.min_appointments !== undefined
        ? Math.max(0, Math.min(criteria.min_appointments, 10000))
        : undefined,
    max_appointments:
      criteria.max_appointments !== undefined
        ? Math.max(0, Math.min(criteria.max_appointments, 10000))
        : undefined,
    min_visits:
      criteria.min_visits !== undefined ? Math.max(0, Math.min(criteria.min_visits, 10000)) : undefined,
    max_visits:
      criteria.max_visits !== undefined ? Math.max(0, Math.min(criteria.max_visits, 10000)) : undefined,
    last_visit_days:
      criteria.last_visit_days !== undefined
        ? Math.max(0, Math.min(criteria.last_visit_days, 3650))
        : undefined,
    min_total_spend:
      criteria.min_total_spend !== undefined
        ? Math.max(0, Math.min(criteria.min_total_spend, 1000000))
        : undefined,
  };
}

/**
 * Apply segment filters to customer data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySegmentFilters(customers: any[], criteria: SegmentCriteria): any[] {
  // Sanitize criteria before applying filters
  const sanitized = sanitizeCriteria(criteria);

  return customers.filter((customer) => {
    const appointments = customer.appointments || [];
    const pets = customer.pets || [];
    const memberships = customer.customer_memberships || [];

    // Filter by appointment count
    if (sanitized.min_appointments !== undefined && appointments.length < sanitized.min_appointments) {
      return false;
    }
    if (sanitized.max_appointments !== undefined && appointments.length > sanitized.max_appointments) {
      return false;
    }

    // Filter by total visits
    const completedAppointments = appointments.filter((a: any) => a.status === 'completed');
    if (sanitized.min_visits !== undefined && completedAppointments.length < sanitized.min_visits) {
      return false;
    }
    if (sanitized.max_visits !== undefined && completedAppointments.length > sanitized.max_visits) {
      return false;
    }

    // Filter by last visit days
    if (sanitized.last_visit_days !== undefined) {
      const lastVisit = completedAppointments
        .sort((a: any, b: any) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())[0];

      if (lastVisit) {
        const daysSinceVisit = (Date.now() - new Date(lastVisit.scheduled_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceVisit > sanitized.last_visit_days) {
          return false;
        }
      } else {
        // No visits, doesn't match last_visit_days filter
        return false;
      }
    }

    // Filter by not visited since date
    if (sanitized.not_visited_since) {
      const cutoffDate = new Date(sanitized.not_visited_since);
      const lastVisit = completedAppointments
        .sort((a: any, b: any) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())[0];

      if (!lastVisit || new Date(lastVisit.scheduled_at) > cutoffDate) {
        return false;
      }
    }

    // Filter by membership status
    if (sanitized.has_membership !== undefined) {
      const hasActiveMembership = memberships.some((m: any) => m.status === 'active');
      if (sanitized.has_membership !== hasActiveMembership) {
        return false;
      }
    }

    // Filter by pet size
    if (sanitized.pet_size && sanitized.pet_size.length > 0) {
      const hasMatchingSize = pets.some((p: any) => sanitized.pet_size!.includes(p.size));
      if (!hasMatchingSize) {
        return false;
      }
    }

    // Filter by service history
    if (sanitized.service_ids && sanitized.service_ids.length > 0) {
      const hasService = appointments.some((a: any) => sanitized.service_ids!.includes(a.service_id));
      if (!hasService) {
        return false;
      }
    }

    // Filter by breed
    if (sanitized.breed_ids && sanitized.breed_ids.length > 0) {
      const hasBreed = pets.some((p: any) => sanitized.breed_ids!.includes(p.breed_id));
      if (!hasBreed) {
        return false;
      }
    }

    // Filter by total spend
    if (sanitized.min_total_spend !== undefined) {
      const totalSpend = completedAppointments.reduce((sum: number, a: any) => sum + (a.total_price || 0), 0);
      if (totalSpend < sanitized.min_total_spend) {
        return false;
      }
    }

    // Filter by upcoming appointments
    if (sanitized.has_upcoming_appointment !== undefined) {
      const now = new Date();
      const hasUpcoming = appointments.some((a: any) => {
        return new Date(a.scheduled_at) > now && ['pending', 'confirmed', 'checked_in'].includes(a.status);
      });
      if (sanitized.has_upcoming_appointment !== hasUpcoming) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Check if customer has unsubscribed from a channel
 */
export async function checkUnsubscribeStatus(
  supabase: AppSupabaseClient,
  customerId: string,
  channel: CampaignChannel
): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('marketing_unsubscribes')
      .select('unsubscribed_from')
      .eq('customer_id', customerId)
      .single();

    if (error || !data) {
      // No unsubscribe record = not unsubscribed
      return false;
    }

    // Check if unsubscribed from this channel
    if (channel === 'both') {
      return data.unsubscribed_from === 'both';
    } else if (channel === 'email') {
      return data.unsubscribed_from === 'email' || data.unsubscribed_from === 'both';
    } else if (channel === 'sms') {
      return data.unsubscribed_from === 'sms' || data.unsubscribed_from === 'both';
    }

    return false;
  } catch (error) {
    console.error('[Campaign Sender] Error checking unsubscribe status:', error);
    return false; // Default to not unsubscribed on error
  }
}

/**
 * Assign A/B test variant based on split percentage
 * @param index - Customer index in audience list
 * @param splitPercentage - Percentage for variant A (0-100)
 * @returns 'A' or 'B'
 */
export function assignABVariant(index: number, splitPercentage: number): 'A' | 'B' {
  // Use deterministic assignment based on index
  // This ensures consistent assignment if campaign is re-sent
  const threshold = splitPercentage / 100;
  const hash = (index * 2654435761) % 100; // Simple hash
  return hash < splitPercentage ? 'A' : 'B';
}

/**
 * Create campaign_sends records for tracking
 */
export async function createCampaignSends(
  supabase: AppSupabaseClient,
  campaign: MarketingCampaign,
  audience: AudienceMember[],
  abTestEnabled: boolean,
  splitPercentage: number = 50
): Promise<{ success: boolean; created_count: number; error?: string }> {
  try {
    const now = new Date().toISOString();

    // Create campaign_send records for each audience member
    const campaignSends = audience.map((customer, index) => ({
      campaign_id: campaign.id,
      customer_id: customer.id,
      variant: abTestEnabled ? assignABVariant(index, splitPercentage) : null,
      sent_at: now,
      tracking_id: randomUUID(),
      notification_log_id: null, // Will be updated after sending
    }));

    // Bulk insert
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('campaign_sends')
      .insert(campaignSends)
      .select();

    if (error) {
      console.error('[Campaign Sender] Error creating campaign_sends:', error);
      return { success: false, created_count: 0, error: error.message };
    }

    console.log(`[Campaign Sender] Created ${data.length} campaign_send records`);
    return { success: true, created_count: data.length };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Campaign Sender] Error in createCampaignSends:', error);
    return { success: false, created_count: 0, error: errorMsg };
  }
}

/**
 * Send campaign notifications (SMS/Email)
 * Uses existing notification templates from breed reminders
 */
export async function sendCampaignNotifications(
  supabase: AppSupabaseClient,
  campaign: MarketingCampaign,
  audience: AudienceMember[],
  abTestEnabled: boolean,
  splitPercentage: number = 50
): Promise<CampaignSendResult> {
  const result: CampaignSendResult = {
    success: true,
    sent_count: 0,
    skipped_count: 0,
    errors: [],
  };

  try {
    console.log(`[Campaign Sender] Sending campaign "${campaign.name}" to ${audience.length} customers`);

    // Use notification services (they already handle mock switching internally)
    const { sendEmail } = await import('@/lib/resend/client');
    const { sendSms } = await import('@/lib/twilio/client');

    // Process each audience member
    for (let i = 0; i < audience.length; i++) {
      const customer = audience[i];

      try {
        // Check unsubscribe status
        const isUnsubscribed = await checkUnsubscribeStatus(supabase, customer.id, campaign.channel);
        if (isUnsubscribed) {
          console.log(`[Campaign Sender] Customer ${customer.email} has unsubscribed, skipping`);
          result.skipped_count++;
          continue;
        }

        // Get message content based on A/B test
        let messageContent = campaign.message_content;
        if (abTestEnabled && campaign.ab_test_config) {
          const variant = assignABVariant(i, splitPercentage);
          messageContent = variant === 'A'
            ? campaign.ab_test_config.variant_a
            : campaign.ab_test_config.variant_b;
        }

        // Send email if channel includes email
        if ((campaign.channel === 'email' || campaign.channel === 'both') && customer.email) {
          if (messageContent.email_subject && (messageContent.email_body || messageContent.email_html)) {
            const emailResult = await sendEmail({
              to: customer.email,
              subject: replaceVariables(messageContent.email_subject, customer),
              html: messageContent.email_html
                ? replaceVariables(messageContent.email_html, customer)
                : replaceVariables(messageContent.email_body || '', customer),
              text: messageContent.email_body
                ? replaceVariables(messageContent.email_body, customer)
                : undefined,
            });

            if (emailResult.error) {
              result.errors.push(`Email failed for ${customer.email}: ${emailResult.error.message}`);
            } else {
              console.log(`[Campaign Sender] Email sent to ${customer.email}: ${emailResult.id}`);
            }
          }
        }

        // Send SMS if channel includes SMS
        if ((campaign.channel === 'sms' || campaign.channel === 'both') && customer.phone) {
          if (messageContent.sms_body) {
            const smsResult = await sendSms({
              to: customer.phone,
              body: replaceVariables(messageContent.sms_body, customer),
            });

            if (smsResult.error) {
              result.errors.push(`SMS failed for ${customer.phone}: ${smsResult.error.message}`);
            } else {
              console.log(`[Campaign Sender] SMS sent to ${customer.phone}: ${smsResult.sid}`);
            }
          }
        }

        result.sent_count++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Error sending to ${customer.email}: ${errorMsg}`);
        console.error(`[Campaign Sender] Error sending to customer ${customer.id}:`, error);
      }
    }

    console.log(`[Campaign Sender] Campaign send complete. Sent: ${result.sent_count}, Skipped: ${result.skipped_count}, Errors: ${result.errors.length}`);
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    result.success = false;
    result.errors.push(`Fatal error: ${errorMsg}`);
    console.error('[Campaign Sender] Fatal error in sendCampaignNotifications:', error);
    return result;
  }
}

/**
 * Replace template variables in message content
 * Variables: {customer_name}, {first_name}, {last_name}, {email}, {booking_link}
 */
function replaceVariables(template: string, customer: AudienceMember): string {
  const bookingUrl = `https://thepuppyday.com/book?customer=${customer.id}`;

  return template
    .replace(/{customer_name}/g, `${customer.first_name} ${customer.last_name}`)
    .replace(/{first_name}/g, customer.first_name)
    .replace(/{last_name}/g, customer.last_name)
    .replace(/{email}/g, customer.email)
    .replace(/{booking_link}/g, bookingUrl);
}
