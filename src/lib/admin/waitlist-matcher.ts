/**
 * Waitlist Matching Algorithm
 *
 * Finds matching waitlist entries for an open appointment slot
 * based on service, date proximity, and priority.
 */

import type { AppSupabaseClient } from '@/lib/supabase/server';
import type { WaitlistEntry } from '@/types/database';

export interface MatchCriteria {
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
}

export interface MatchResult {
  matches: Array<WaitlistEntry & {
    customer?: { id: string; first_name: string; last_name: string; email: string; phone: string };
    pet?: { id: string; name: string };
    service?: { id: string; name: string };
  }>;
  total: number;
}

/**
 * Find matching waitlist entries for an open slot
 *
 * Matching criteria:
 * - Same service_id
 * - requested_date within ±3 days of appointment_date
 * - status = 'active' only
 * - No existing active offers
 *
 * Sorting:
 * - Priority: DESC (higher priority first) - currently using created_at as proxy
 * - Created date: ASC (older entries first for same priority)
 *
 * @param supabase Supabase client
 * @param criteria Matching criteria
 * @param limit Maximum number of matches to return (default: 10)
 * @returns Array of matching waitlist entries
 */
export async function findMatchingWaitlistEntries(
  supabase: AppSupabaseClient,
  criteria: MatchCriteria,
  limit: number = 10
): Promise<MatchResult> {
  try {
    const { serviceId, appointmentDate } = criteria;

    // Calculate date range (±3 days)
    const targetDate = new Date(appointmentDate);
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - 3);
    const endDate = new Date(targetDate);
    endDate.setDate(endDate.getDate() + 3);

    // Format dates as YYYY-MM-DD
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Query matching waitlist entries
    const { data: matches, error, count } = await (supabase as any)
      .from('waitlist')
      .select(
        `
        *,
        customer:users!customer_id(id, first_name, last_name, email, phone),
        pet:pets!pet_id(id, name),
        service:services!service_id(id, name)
      `,
        { count: 'exact' }
      )
      .eq('service_id', serviceId)
      .eq('status', 'active')
      .gte('requested_date', startDateStr)
      .lte('requested_date', endDateStr)
      .is('offer_id', null) // No existing active offers
      .order('created_at', { ascending: true }) // Older entries first (FIFO for now)
      .limit(limit);

    if (error) {
      console.error('Error finding matching waitlist entries:', error);
      throw error;
    }

    return {
      matches: matches || [],
      total: count || 0,
    };
  } catch (error) {
    console.error('Error in findMatchingWaitlistEntries:', error);
    throw error;
  }
}

/**
 * Calculate priority score for a waitlist entry
 *
 * Priority factors (for future enhancement):
 * - Time on waitlist (longer = higher priority)
 * - Customer loyalty status
 * - Number of previous cancellations
 * - Special flags (VIP, medical need, etc.)
 *
 * @param entry Waitlist entry
 * @returns Priority score (higher is better)
 */
export function calculatePriority(entry: WaitlistEntry): number {
  // Simple priority calculation based on time on waitlist
  const createdDate = new Date(entry.created_at);
  const now = new Date();
  const daysOnWaitlist = Math.floor(
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // For now, just return days on waitlist as priority
  // In future, we can add more sophisticated scoring
  return daysOnWaitlist;
}
