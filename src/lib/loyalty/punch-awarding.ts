/**
 * Loyalty Punch Awarding Logic
 * Handles awarding loyalty punches based on configured rules
 * Task 0201: Loyalty system integration
 */

import type { AppSupabaseClient } from '@/lib/supabase/server';
import {
  getLoyaltySettings,
  doesServiceQualify,
  meetsMinimumSpend,
} from '@/lib/admin/loyalty-settings';

/**
 * Result of punch awarding operation
 */
export interface PunchAwardResult {
  success: boolean;
  punchesAwarded: number;
  currentPunches: number;
  threshold: number;
  rewardEarned: boolean;
  cycleNumber: number;
  message: string;
  error?: string;
}

/**
 * Award loyalty punch(es) for a completed appointment
 *
 * This function:
 * 1. Checks if loyalty program is enabled
 * 2. Validates service qualifies for earning
 * 3. Checks minimum spend threshold
 * 4. Awards first visit bonus for new customers
 * 5. Creates loyalty punch record(s)
 * 6. Updates customer loyalty totals
 * 7. Creates pending redemption if threshold reached
 *
 * @param supabase - Supabase client instance
 * @param customerId - UUID of customer
 * @param appointmentId - UUID of completed appointment
 * @param serviceId - UUID of service performed
 * @param appointmentTotal - Total amount of appointment
 * @returns Promise resolving to punch award result
 *
 * @example
 * const result = await awardPunchForAppointment(
 *   supabase,
 *   customerId,
 *   appointmentId,
 *   serviceId,
 *   75.00
 * );
 *
 * if (result.success && result.rewardEarned) {
 *   console.log('Customer earned a free service!');
 * }
 */
export async function awardPunchForAppointment(
  supabase: AppSupabaseClient,
  customerId: string,
  appointmentId: string,
  serviceId: string,
  appointmentTotal: number
): Promise<PunchAwardResult> {
  try {
    console.log(`[Punch Award] Processing award for appointment ${appointmentId}`);

    // 1. Fetch loyalty settings
    const settings = await getLoyaltySettings(supabase);

    // Check if loyalty program is enabled
    if (!settings.program.is_enabled) {
      console.log('[Punch Award] Loyalty program is disabled');
      return {
        success: false,
        punchesAwarded: 0,
        currentPunches: 0,
        threshold: settings.program.punch_threshold,
        rewardEarned: false,
        cycleNumber: 0,
        message: 'Loyalty program is not enabled',
      };
    }

    // 2. Check if service qualifies
    if (!doesServiceQualify(serviceId, settings.earning_rules.qualifying_services)) {
      console.log(`[Punch Award] Service ${serviceId} does not qualify for punches`);
      return {
        success: false,
        punchesAwarded: 0,
        currentPunches: 0,
        threshold: settings.program.punch_threshold,
        rewardEarned: false,
        cycleNumber: 0,
        message: 'Service does not qualify for loyalty punches',
      };
    }

    // 3. Check minimum spend threshold
    if (!meetsMinimumSpend(appointmentTotal, settings.earning_rules.minimum_spend)) {
      console.log(
        `[Punch Award] Total $${appointmentTotal} does not meet minimum spend $${settings.earning_rules.minimum_spend}`
      );
      return {
        success: false,
        punchesAwarded: 0,
        currentPunches: 0,
        threshold: settings.program.punch_threshold,
        rewardEarned: false,
        cycleNumber: 0,
        message: `Minimum spend of $${settings.earning_rules.minimum_spend} required`,
      };
    }

    // 4. Get or create customer loyalty record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: loyalty, error: loyaltyError } = await (supabase as any)
      .from('customer_loyalty')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    const isFirstVisit = !loyalty;

    if (loyaltyError && loyaltyError.code !== 'PGRST116') {
      // PGRST116 = not found (expected for new customers)
      throw loyaltyError;
    }

    if (!loyalty) {
      // Create new loyalty record for first-time customer
      console.log(`[Punch Award] Creating new loyalty record for customer ${customerId}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newLoyalty, error: createError } = await (supabase as any)
        .from('customer_loyalty')
        .insert({
          customer_id: customerId,
          current_punches: 0,
          total_visits: 0,
          free_washes_earned: 0,
          free_washes_redeemed: 0,
        })
        .select()
        .single();

      if (createError) throw createError;
      loyalty = newLoyalty;
    }

    // 5. Calculate punches to award (1 base + first visit bonus if applicable)
    let punchesToAward = 1;
    if (isFirstVisit && settings.earning_rules.first_visit_bonus > 0) {
      punchesToAward += settings.earning_rules.first_visit_bonus;
      console.log(
        `[Punch Award] First visit bonus: +${settings.earning_rules.first_visit_bonus} punches`
      );
    }

    // Get effective threshold (customer override or default)
    const threshold = loyalty.threshold_override || settings.program.punch_threshold;

    // Calculate current cycle number
    const cycleNumber = Math.floor(loyalty.total_visits / threshold) + 1;

    // 6. Create punch record(s)
    const punchRecords = [];
    for (let i = 0; i < punchesToAward; i++) {
      const punchNumber = loyalty.current_punches + i + 1;
      punchRecords.push({
        customer_id: customerId,
        customer_loyalty_id: loyalty.id,
        appointment_id: appointmentId,
        cycle_number: cycleNumber,
        punch_number: punchNumber,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: punchError } = await (supabase as any)
      .from('loyalty_punches')
      .insert(punchRecords);

    if (punchError) throw punchError;

    // 7. Update customer loyalty totals
    const newPunchCount = loyalty.current_punches + punchesToAward;
    const rewardEarned = newPunchCount >= threshold;

    const updateData: {
      current_punches: number;
      total_visits: number;
      free_washes_earned?: number;
    } = {
      current_punches: rewardEarned ? 0 : newPunchCount, // Reset to 0 if threshold reached
      total_visits: loyalty.total_visits + 1,
    };

    if (rewardEarned) {
      updateData.free_washes_earned = loyalty.free_washes_earned + 1;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('customer_loyalty')
      .update(updateData)
      .eq('id', loyalty.id);

    if (updateError) throw updateError;

    // 8. Create pending redemption if threshold reached
    if (rewardEarned) {
      console.log(
        `[Punch Award] Customer reached threshold! Creating pending redemption for cycle ${cycleNumber}`
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: redemptionError } = await (supabase as any)
        .from('loyalty_redemptions')
        .insert({
          customer_loyalty_id: loyalty.id,
          cycle_number: cycleNumber,
          status: 'pending',
        });

      if (redemptionError) throw redemptionError;
    }

    console.log(
      `[Punch Award] Successfully awarded ${punchesToAward} punch(es). Current: ${newPunchCount}/${threshold}`
    );

    return {
      success: true,
      punchesAwarded: punchesToAward,
      currentPunches: rewardEarned ? 0 : newPunchCount,
      threshold,
      rewardEarned,
      cycleNumber,
      message: rewardEarned
        ? `Earned ${punchesToAward} punch(es) and completed a reward cycle! Free service available.`
        : `Earned ${punchesToAward} punch(es). ${threshold - newPunchCount} more until free service.`,
    };
  } catch (error) {
    console.error('[Punch Award] Error awarding punches:', error);
    return {
      success: false,
      punchesAwarded: 0,
      currentPunches: 0,
      threshold: 0,
      rewardEarned: false,
      cycleNumber: 0,
      message: 'Failed to award loyalty punches',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if customer is eligible for first visit bonus
 *
 * @param supabase - Supabase client instance
 * @param customerId - UUID of customer
 * @returns Promise resolving to true if customer has no loyalty record (first visit)
 *
 * @example
 * const isFirstTime = await isFirstVisitCustomer(supabase, customerId);
 * if (isFirstTime) {
 *   console.log('Customer eligible for first visit bonus!');
 * }
 */
export async function isFirstVisitCustomer(
  supabase: AppSupabaseClient,
  customerId: string
): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('customer_loyalty')
      .select('id')
      .eq('customer_id', customerId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !data; // No record = first visit
  } catch (error) {
    console.error('[Punch Award] Error checking first visit status:', error);
    return false;
  }
}

/**
 * Get customer's current loyalty status
 *
 * @param supabase - Supabase client instance
 * @param customerId - UUID of customer
 * @returns Promise resolving to customer's loyalty status or null
 *
 * @example
 * const status = await getCustomerLoyaltyStatus(supabase, customerId);
 * if (status) {
 *   console.log(`Customer has ${status.current_punches} punches`);
 * }
 */
export async function getCustomerLoyaltyStatus(
  supabase: AppSupabaseClient,
  customerId: string
): Promise<{
  current_punches: number;
  threshold: number;
  free_washes_available: number;
  total_visits: number;
} | null> {
  try {
    const settings = await getLoyaltySettings(supabase);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: loyalty, error } = await (supabase as any)
      .from('customer_loyalty')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!loyalty) {
      return null; // No loyalty record yet
    }

    // Count pending redemptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: pendingCount } = await (supabase as any)
      .from('loyalty_redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('customer_loyalty_id', loyalty.id)
      .eq('status', 'pending');

    return {
      current_punches: loyalty.current_punches,
      threshold: loyalty.threshold_override || settings.program.punch_threshold,
      free_washes_available: pendingCount || 0,
      total_visits: loyalty.total_visits,
    };
  } catch (error) {
    console.error('[Punch Award] Error fetching loyalty status:', error);
    return null;
  }
}
