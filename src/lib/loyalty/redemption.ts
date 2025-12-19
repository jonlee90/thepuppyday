/**
 * Loyalty Redemption Logic
 * Handles redemption of earned loyalty rewards based on configured rules
 * Task 0201: Loyalty system integration
 */

import type { AppSupabaseClient } from '@/lib/supabase/server';
import {
  getLoyaltySettings,
  isServiceEligibleForRedemption,
  isRewardExpired,
  calculateRedemptionValue,
} from '@/lib/admin/loyalty-settings';

/**
 * Redemption validation result
 */
export interface RedemptionValidation {
  allowed: boolean;
  reason?: string;
  availableRewards?: number;
  redemptionValue?: number;
}

/**
 * Redemption result
 */
export interface RedemptionResult {
  success: boolean;
  redemptionId?: string;
  redemptionValue: number;
  remainingRewards: number;
  message: string;
  error?: string;
}

/**
 * Check if customer can redeem a loyalty reward for a specific service
 *
 * Validates:
 * 1. Service is in eligible_services list
 * 2. Customer has pending (unredeemed) rewards
 * 3. Pending rewards haven't expired based on expiration_days setting
 * 4. Calculates redemption value based on max_value cap
 *
 * @param supabase - Supabase client instance
 * @param customerId - UUID of customer
 * @param serviceId - UUID of service to redeem for
 * @param servicePrice - Price of the service
 * @returns Promise resolving to validation result
 *
 * @example
 * const validation = await canRedeemForService(
 *   supabase,
 *   customerId,
 *   serviceId,
 *   85.00
 * );
 *
 * if (validation.allowed) {
 *   console.log(`Can redeem for $${validation.redemptionValue}`);
 * } else {
 *   console.log(`Cannot redeem: ${validation.reason}`);
 * }
 */
export async function canRedeemForService(
  supabase: AppSupabaseClient,
  customerId: string,
  serviceId: string,
  servicePrice: number
): Promise<RedemptionValidation> {
  try {
    console.log(`[Redemption] Checking redemption eligibility for customer ${customerId}`);

    // 1. Fetch settings
    const settings = await getLoyaltySettings(supabase);

    // 2. Check if service is eligible for redemption
    if (!isServiceEligibleForRedemption(serviceId, settings.redemption_rules.eligible_services)) {
      console.log(`[Redemption] Service ${serviceId} is not eligible for redemption`);
      return {
        allowed: false,
        reason: 'Service is not eligible for loyalty redemption',
      };
    }

    // 3. Get customer loyalty record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: loyalty, error: loyaltyError } = await (supabase as any)
      .from('customer_loyalty')
      .select('id')
      .eq('customer_id', customerId)
      .single();

    if (loyaltyError || !loyalty) {
      console.log('[Redemption] No loyalty record found for customer');
      return {
        allowed: false,
        reason: 'No loyalty account found',
        availableRewards: 0,
      };
    }

    // 4. Get pending (unredeemed) rewards
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: redemptions, error: redemptionError } = await (supabase as any)
      .from('loyalty_redemptions')
      .select('*')
      .eq('customer_loyalty_id', loyalty.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }); // Oldest first

    if (redemptionError) throw redemptionError;

    if (!redemptions || redemptions.length === 0) {
      console.log('[Redemption] No pending rewards available');
      return {
        allowed: false,
        reason: 'No available rewards to redeem',
        availableRewards: 0,
      };
    }

    // 5. Check if oldest reward has expired
    const oldestRedemption = redemptions[0];
    if (isRewardExpired(oldestRedemption.created_at, settings.redemption_rules.expiration_days)) {
      console.log('[Redemption] Oldest reward has expired');

      // Mark as expired
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('loyalty_redemptions')
        .update({ status: 'expired' })
        .eq('id', oldestRedemption.id);

      // Check if there are other non-expired rewards
      const nonExpiredRewards = redemptions.filter(
        (r: { id: string; created_at: string }) =>
          r.id !== oldestRedemption.id &&
          !isRewardExpired(r.created_at, settings.redemption_rules.expiration_days)
      );

      if (nonExpiredRewards.length === 0) {
        return {
          allowed: false,
          reason: 'All available rewards have expired',
          availableRewards: 0,
        };
      }
    }

    // 6. Calculate redemption value (apply max_value cap if set)
    const redemptionValue = calculateRedemptionValue(
      servicePrice,
      settings.redemption_rules.max_value
    );

    console.log(
      `[Redemption] Customer can redeem. Available rewards: ${redemptions.length}, Value: $${redemptionValue}`
    );

    return {
      allowed: true,
      availableRewards: redemptions.length,
      redemptionValue,
    };
  } catch (error) {
    console.error('[Redemption] Error checking redemption eligibility:', error);
    return {
      allowed: false,
      reason: 'Error validating redemption',
    };
  }
}

/**
 * Redeem a loyalty reward for an appointment
 *
 * This function:
 * 1. Validates redemption is allowed
 * 2. Marks oldest pending reward as redeemed
 * 3. Links redemption to the appointment
 * 4. Updates customer loyalty redemption count
 *
 * @param supabase - Supabase client instance
 * @param customerId - UUID of customer
 * @param appointmentId - UUID of appointment to apply redemption to
 * @param serviceId - UUID of service being redeemed
 * @param servicePrice - Price of the service
 * @returns Promise resolving to redemption result
 *
 * @example
 * const result = await redeemRewardForAppointment(
 *   supabase,
 *   customerId,
 *   appointmentId,
 *   serviceId,
 *   85.00
 * );
 *
 * if (result.success) {
 *   console.log(`Redeemed $${result.redemptionValue}`);
 *   console.log(`${result.remainingRewards} rewards remaining`);
 * }
 */
export async function redeemRewardForAppointment(
  supabase: AppSupabaseClient,
  customerId: string,
  appointmentId: string,
  serviceId: string,
  servicePrice: number
): Promise<RedemptionResult> {
  try {
    console.log(
      `[Redemption] Processing redemption for appointment ${appointmentId}, service ${serviceId}`
    );

    // 1. Validate redemption is allowed
    const validation = await canRedeemForService(supabase, customerId, serviceId, servicePrice);

    if (!validation.allowed) {
      return {
        success: false,
        redemptionValue: 0,
        remainingRewards: validation.availableRewards || 0,
        message: validation.reason || 'Redemption not allowed',
      };
    }

    // 2. Get customer loyalty record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: loyalty, error: loyaltyError } = await (supabase as any)
      .from('customer_loyalty')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (loyaltyError || !loyalty) {
      throw new Error('Loyalty record not found');
    }

    // 3. Get oldest pending redemption
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: redemptions, error: redemptionError } = await (supabase as any)
      .from('loyalty_redemptions')
      .select('*')
      .eq('customer_loyalty_id', loyalty.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);

    if (redemptionError || !redemptions || redemptions.length === 0) {
      throw new Error('No pending redemptions found');
    }

    const redemptionToUse = redemptions[0];

    // 4. Mark redemption as redeemed and link to appointment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('loyalty_redemptions')
      .update({
        status: 'redeemed',
        appointment_id: appointmentId,
        redeemed_at: new Date().toISOString(),
      })
      .eq('id', redemptionToUse.id);

    if (updateError) throw updateError;

    // 5. Update customer loyalty redeemed count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: loyaltyUpdateError } = await (supabase as any)
      .from('customer_loyalty')
      .update({
        free_washes_redeemed: loyalty.free_washes_redeemed + 1,
      })
      .eq('id', loyalty.id);

    if (loyaltyUpdateError) throw loyaltyUpdateError;

    const remainingRewards = (validation.availableRewards || 1) - 1;
    const redemptionValue = validation.redemptionValue || servicePrice;

    console.log(
      `[Redemption] Successfully redeemed reward. Value: $${redemptionValue}, Remaining: ${remainingRewards}`
    );

    return {
      success: true,
      redemptionId: redemptionToUse.id,
      redemptionValue,
      remainingRewards,
      message: `Successfully redeemed loyalty reward for $${redemptionValue.toFixed(2)}`,
    };
  } catch (error) {
    console.error('[Redemption] Error redeeming reward:', error);
    return {
      success: false,
      redemptionValue: 0,
      remainingRewards: 0,
      message: 'Failed to redeem loyalty reward',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get customer's available (pending) rewards
 *
 * @param supabase - Supabase client instance
 * @param customerId - UUID of customer
 * @returns Promise resolving to array of pending redemption records
 *
 * @example
 * const rewards = await getAvailableRewards(supabase, customerId);
 * console.log(`Customer has ${rewards.length} rewards available`);
 */
export async function getAvailableRewards(
  supabase: AppSupabaseClient,
  customerId: string
): Promise<
  Array<{
    id: string;
    cycle_number: number;
    created_at: string;
    is_expired: boolean;
  }>
> {
  try {
    const settings = await getLoyaltySettings(supabase);

    // Get loyalty record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: loyalty, error: loyaltyError } = await (supabase as any)
      .from('customer_loyalty')
      .select('id')
      .eq('customer_id', customerId)
      .single();

    if (loyaltyError || !loyalty) {
      return [];
    }

    // Get pending redemptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: redemptions, error: redemptionError } = await (supabase as any)
      .from('loyalty_redemptions')
      .select('id, cycle_number, created_at')
      .eq('customer_loyalty_id', loyalty.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (redemptionError) throw redemptionError;

    if (!redemptions || redemptions.length === 0) {
      return [];
    }

    // Check expiration for each reward
    return redemptions.map((r: { id: string; cycle_number: number; created_at: string }) => ({
      id: r.id,
      cycle_number: r.cycle_number,
      created_at: r.created_at,
      is_expired: isRewardExpired(r.created_at, settings.redemption_rules.expiration_days),
    }));
  } catch (error) {
    console.error('[Redemption] Error fetching available rewards:', error);
    return [];
  }
}

/**
 * Mark expired rewards as expired in database
 *
 * Should be run periodically (e.g., daily cron job) to clean up old rewards
 *
 * @param supabase - Supabase client instance
 * @returns Promise resolving to number of rewards marked as expired
 *
 * @example
 * const expiredCount = await markExpiredRewards(supabase);
 * console.log(`Marked ${expiredCount} rewards as expired`);
 */
export async function markExpiredRewards(supabase: AppSupabaseClient): Promise<number> {
  try {
    const settings = await getLoyaltySettings(supabase);

    // If expiration is disabled (0 days), don't mark anything as expired
    if (settings.redemption_rules.expiration_days === 0) {
      console.log('[Redemption] Reward expiration is disabled');
      return 0;
    }

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - settings.redemption_rules.expiration_days);

    // Mark all pending rewards created before expiration date as expired
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('loyalty_redemptions')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('created_at', expirationDate.toISOString())
      .select('id');

    if (error) throw error;

    const count = data?.length || 0;
    console.log(`[Redemption] Marked ${count} rewards as expired`);

    return count;
  } catch (error) {
    console.error('[Redemption] Error marking expired rewards:', error);
    return 0;
  }
}
