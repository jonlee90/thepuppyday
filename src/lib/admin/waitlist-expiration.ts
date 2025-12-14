/**
 * Waitlist Slot Offer Expiration Handler
 *
 * Handles expiration of waitlist slot offers that haven't been accepted
 * within the response window. Returns slots to available inventory.
 */

import type { AppSupabaseClient } from '@/lib/supabase/server';

export interface ExpirationResult {
  expiredOffers: number;
  expiredWaitlistEntries: number;
  errors: string[];
}

/**
 * Process expired slot offers
 *
 * Finds and expires slot offers that have passed their expiration time
 * and haven't been accepted. Updates related waitlist entries and
 * returns slots to available inventory.
 *
 * @param supabase Supabase client
 * @returns Result with counts of expired offers and entries
 */
export async function processExpiredOffers(
  supabase: AppSupabaseClient
): Promise<ExpirationResult> {
  const result: ExpirationResult = {
    expiredOffers: 0,
    expiredWaitlistEntries: 0,
    errors: [],
  };

  try {
    const now = new Date().toISOString();

    // Find expired pending offers
    const { data: expiredOffers, error: findError } = await (supabase as any)
      .from('waitlist_slot_offers')
      .select('id')
      .eq('status', 'pending')
      .lt('expires_at', now);

    if (findError) {
      console.error('Error finding expired offers:', findError);
      result.errors.push(`Find error: ${findError.message}`);
      return result;
    }

    if (!expiredOffers || expiredOffers.length === 0) {
      console.log('No expired offers found');
      return result;
    }

    console.log(`Found ${expiredOffers.length} expired offers`);

    // Process each expired offer
    for (const offer of expiredOffers) {
      try {
        // 1. Update slot offer status to expired
        const { error: offerUpdateError } = await (supabase as any)
          .from('waitlist_slot_offers')
          .update({ status: 'expired' })
          .eq('id', offer.id)
          .eq('status', 'pending'); // Only update if still pending

        if (offerUpdateError) {
          console.error(`Error updating offer ${offer.id}:`, offerUpdateError);
          result.errors.push(`Offer ${offer.id}: ${offerUpdateError.message}`);
          continue;
        }

        result.expiredOffers++;

        // 2. Update related waitlist entries to expired_offer
        const { error: waitlistUpdateError, count } = await (supabase as any)
          .from('waitlist')
          .update({ status: 'expired_offer' })
          .eq('offer_id', offer.id)
          .eq('status', 'notified'); // Only update notified entries

        if (waitlistUpdateError) {
          console.error(`Error updating waitlist for offer ${offer.id}:`, waitlistUpdateError);
          result.errors.push(`Waitlist for ${offer.id}: ${waitlistUpdateError.message}`);
        } else if (count) {
          result.expiredWaitlistEntries += count;
        }

        // 3. Slot is automatically returned to inventory
        // (no appointment was created, so the slot remains available)
        console.log(`✅ Expired offer ${offer.id}, updated ${count || 0} waitlist entries`);
      } catch (error) {
        console.error(`Error processing offer ${offer.id}:`, error);
        result.errors.push(
          `Offer ${offer.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    console.log('📊 Expiration Results:');
    console.log(`  Expired Offers: ${result.expiredOffers}`);
    console.log(`  Expired Waitlist Entries: ${result.expiredWaitlistEntries}`);
    console.log(`  Errors: ${result.errors.length}`);

    return result;
  } catch (error) {
    console.error('Error in processExpiredOffers:', error);
    result.errors.push(
      `Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return result;
  }
}

/**
 * Get expiration statistics
 *
 * Returns current counts of pending/expired offers for monitoring
 *
 * @param supabase Supabase client
 * @returns Statistics object
 */
export async function getExpirationStats(supabase: AppSupabaseClient): Promise<{
  pendingOffers: number;
  expiredOffers: number;
  acceptedOffers: number;
  rejectedOffers: number;
}> {
  try {
    const { data: stats, error } = await (supabase as any)
      .from('waitlist_slot_offers')
      .select('status');

    if (error) {
      console.error('Error fetching expiration stats:', error);
      return {
        pendingOffers: 0,
        expiredOffers: 0,
        acceptedOffers: 0,
        rejectedOffers: 0,
      };
    }

    const counts = {
      pendingOffers: 0,
      expiredOffers: 0,
      acceptedOffers: 0,
      rejectedOffers: 0,
    };

    if (stats) {
      for (const offer of stats) {
        switch (offer.status) {
          case 'pending':
            counts.pendingOffers++;
            break;
          case 'expired':
            counts.expiredOffers++;
            break;
          case 'accepted':
            counts.acceptedOffers++;
            break;
          case 'rejected':
            counts.rejectedOffers++;
            break;
        }
      }
    }

    return counts;
  } catch (error) {
    console.error('Error in getExpirationStats:', error);
    return {
      pendingOffers: 0,
      expiredOffers: 0,
      acceptedOffers: 0,
      rejectedOffers: 0,
    };
  }
}
