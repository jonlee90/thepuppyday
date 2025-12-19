/**
 * Referral Program Integration
 * Handles referral code generation, validation, and bonus awarding
 * Task 0201: Loyalty system integration
 */

import type { AppSupabaseClient } from '@/lib/supabase/server';
import { getLoyaltySettings } from '@/lib/admin/loyalty-settings';
import { generateReferralCode, isValidReferralCodeFormat } from './referral-codes';

/**
 * Result of referral code generation
 */
export interface ReferralCodeGenerationResult {
  success: boolean;
  code?: string;
  referralCodeId?: string;
  message: string;
  error?: string;
}

/**
 * Result of referral code application
 */
export interface ReferralApplicationResult {
  success: boolean;
  referralId?: string;
  referrerId?: string;
  referrerName?: string;
  message: string;
  error?: string;
}

/**
 * Result of referral bonus awarding
 */
export interface ReferralBonusResult {
  success: boolean;
  referrerBonusAwarded: number;
  refereeBonusAwarded: number;
  message: string;
  error?: string;
}

/**
 * Generate a unique referral code for a customer
 *
 * Checks if referral program is enabled before generating code.
 * Uses existing generateReferralCode utility from referral-codes.ts.
 *
 * @param supabase - Supabase client instance
 * @param customerId - UUID of customer to generate code for
 * @returns Promise resolving to generation result
 *
 * @example
 * const result = await generateReferralCodeForCustomer(supabase, customerId);
 * if (result.success) {
 *   console.log(`Your referral code: ${result.code}`);
 * }
 */
export async function generateReferralCodeForCustomer(
  supabase: AppSupabaseClient,
  customerId: string
): Promise<ReferralCodeGenerationResult> {
  try {
    console.log(`[Referrals] Generating referral code for customer ${customerId}`);

    // 1. Check if referral program is enabled
    const settings = await getLoyaltySettings(supabase);
    if (!settings.referral.is_enabled) {
      console.log('[Referrals] Referral program is disabled');
      return {
        success: false,
        message: 'Referral program is not enabled',
      };
    }

    // 2. Check if customer already has a code
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingCode, error: checkError } = await (supabase as any)
      .from('referral_codes')
      .select('id, code')
      .eq('customer_id', customerId)
      .eq('is_active', true)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = not found (expected)
      throw checkError;
    }

    if (existingCode) {
      console.log(`[Referrals] Customer already has code: ${existingCode.code}`);
      return {
        success: true,
        code: existingCode.code,
        referralCodeId: existingCode.id,
        message: 'Referral code already exists',
      };
    }

    // 3. Generate unique code
    const code = await generateReferralCode(supabase);

    // 4. Store in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: referralCode, error: insertError } = await (supabase as any)
      .from('referral_codes')
      .insert({
        customer_id: customerId,
        code,
        is_active: true,
      })
      .select('id, code')
      .single();

    if (insertError) throw insertError;

    console.log(`[Referrals] Successfully generated code: ${referralCode.code}`);

    return {
      success: true,
      code: referralCode.code,
      referralCodeId: referralCode.id,
      message: `Referral code ${referralCode.code} created successfully`,
    };
  } catch (error) {
    console.error('[Referrals] Error generating referral code:', error);
    return {
      success: false,
      message: 'Failed to generate referral code',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Apply a referral code to a new customer during registration
 *
 * Creates a referral relationship linking the referrer and referee.
 * Validates that:
 * - Referral program is enabled
 * - Code exists and is active
 * - New customer hasn't already been referred
 *
 * @param supabase - Supabase client instance
 * @param newCustomerId - UUID of new customer being referred
 * @param referralCode - Referral code provided by new customer
 * @returns Promise resolving to application result
 *
 * @example
 * const result = await applyReferralCode(supabase, newCustomerId, "ABC123");
 * if (result.success) {
 *   console.log(`Referred by: ${result.referrerName}`);
 * }
 */
export async function applyReferralCode(
  supabase: AppSupabaseClient,
  newCustomerId: string,
  referralCode: string
): Promise<ReferralApplicationResult> {
  try {
    console.log(`[Referrals] Applying referral code ${referralCode} for customer ${newCustomerId}`);

    // 1. Validate code format
    if (!isValidReferralCodeFormat(referralCode)) {
      console.log('[Referrals] Invalid code format');
      return {
        success: false,
        message: 'Invalid referral code format',
      };
    }

    // 2. Check if referral program is enabled
    const settings = await getLoyaltySettings(supabase);
    if (!settings.referral.is_enabled) {
      console.log('[Referrals] Referral program is disabled');
      return {
        success: false,
        message: 'Referral program is not enabled',
      };
    }

    // 3. Check if customer has already been referred
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingReferral, error: checkError } = await (supabase as any)
      .from('referrals')
      .select('id')
      .eq('referee_id', newCustomerId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingReferral) {
      console.log('[Referrals] Customer has already been referred');
      return {
        success: false,
        message: 'You have already used a referral code',
      };
    }

    // 4. Find referral code and validate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: codeData, error: codeError } = await (supabase as any)
      .from('referral_codes')
      .select(
        `
        id,
        customer_id,
        is_active,
        max_uses,
        uses_count,
        users:customer_id (
          first_name,
          last_name
        )
      `
      )
      .eq('code', referralCode.toUpperCase())
      .single();

    if (codeError || !codeData) {
      console.log('[Referrals] Referral code not found');
      return {
        success: false,
        message: 'Invalid referral code',
      };
    }

    // 5. Validate code is active
    if (!codeData.is_active) {
      console.log('[Referrals] Referral code is inactive');
      return {
        success: false,
        message: 'Referral code is no longer active',
      };
    }

    // 6. Check max uses limit
    if (codeData.max_uses !== null && codeData.uses_count >= codeData.max_uses) {
      console.log('[Referrals] Referral code has reached max uses');
      return {
        success: false,
        message: 'Referral code has reached its usage limit',
      };
    }

    // 7. Prevent self-referral
    if (codeData.customer_id === newCustomerId) {
      console.log('[Referrals] Cannot refer yourself');
      return {
        success: false,
        message: 'You cannot use your own referral code',
      };
    }

    // 8. Create referral record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: referral, error: referralError } = await (supabase as any)
      .from('referrals')
      .insert({
        referrer_id: codeData.customer_id,
        referee_id: newCustomerId,
        referral_code_id: codeData.id,
        status: 'pending',
      })
      .select('id')
      .single();

    if (referralError) throw referralError;

    // 9. Increment uses_count on referral code
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('referral_codes')
      .update({ uses_count: codeData.uses_count + 1 })
      .eq('id', codeData.id);

    if (updateError) throw updateError;

    const referrerName = `${codeData.users.first_name} ${codeData.users.last_name}`;
    console.log(`[Referrals] Successfully created referral from ${referrerName}`);

    return {
      success: true,
      referralId: referral.id,
      referrerId: codeData.customer_id,
      referrerName,
      message: `Successfully applied referral code from ${referrerName}`,
    };
  } catch (error) {
    console.error('[Referrals] Error applying referral code:', error);
    return {
      success: false,
      message: 'Failed to apply referral code',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Award referral bonuses when referred customer completes first appointment
 *
 * Awards configured bonus punches to both referrer and referee.
 * Only awards bonuses once per referral (prevents duplicate bonuses).
 *
 * @param supabase - Supabase client instance
 * @param referredCustomerId - UUID of customer who was referred (referee)
 * @param firstAppointmentId - UUID of referee's first completed appointment
 * @returns Promise resolving to bonus award result
 *
 * @example
 * const result = await awardReferralBonuses(
 *   supabase,
 *   referredCustomerId,
 *   appointmentId
 * );
 *
 * if (result.success) {
 *   console.log(`Awarded ${result.referrerBonusAwarded} punches to referrer`);
 *   console.log(`Awarded ${result.refereeBonusAwarded} punches to referee`);
 * }
 */
export async function awardReferralBonuses(
  supabase: AppSupabaseClient,
  referredCustomerId: string,
  firstAppointmentId: string
): Promise<ReferralBonusResult> {
  try {
    console.log(
      `[Referrals] Awarding bonuses for referee ${referredCustomerId}, appointment ${firstAppointmentId}`
    );

    // 1. Check if referral program is enabled
    const settings = await getLoyaltySettings(supabase);
    if (!settings.referral.is_enabled) {
      console.log('[Referrals] Referral program is disabled');
      return {
        success: false,
        referrerBonusAwarded: 0,
        refereeBonusAwarded: 0,
        message: 'Referral program is not enabled',
      };
    }

    // 2. Find referral record for this customer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: referral, error: referralError } = await (supabase as any)
      .from('referrals')
      .select('*')
      .eq('referee_id', referredCustomerId)
      .eq('status', 'pending')
      .single();

    if (referralError || !referral) {
      console.log('[Referrals] No pending referral found for customer');
      return {
        success: false,
        referrerBonusAwarded: 0,
        refereeBonusAwarded: 0,
        message: 'No pending referral found',
      };
    }

    // 3. Get loyalty records for both referrer and referee
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: referrerLoyalty, error: referrerError } = await (supabase as any)
      .from('customer_loyalty')
      .select('*')
      .eq('customer_id', referral.referrer_id)
      .single();

    if (referrerError && referrerError.code !== 'PGRST116') {
      throw referrerError;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: refereeLoyalty, error: refereeError } = await (supabase as any)
      .from('customer_loyalty')
      .select('*')
      .eq('customer_id', referral.referee_id)
      .single();

    if (refereeError && refereeError.code !== 'PGRST116') {
      throw refereeError;
    }

    // 4. Award bonus punches to referrer
    // TRANSACTION SAFETY: This multi-step operation should use the PostgreSQL stored procedure
    // 'award_referral_bonuses' (see migration 20250119000001) for ACID guarantees.
    // Current implementation risks data inconsistency if any step fails.
    // TODO: Replace with: supabase.rpc('award_referral_bonuses', { ... })
    let referrerBonusAwarded = 0;
    if (settings.referral.referrer_bonus_punches > 0 && referrerLoyalty) {
      const newReferrerPunches =
        referrerLoyalty.current_punches + settings.referral.referrer_bonus_punches;
      const threshold =
        referrerLoyalty.threshold_override || settings.program.punch_threshold;

      // Check if bonus completes a cycle
      const earnedReward = newReferrerPunches >= threshold;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('customer_loyalty')
        .update({
          current_punches: earnedReward ? newReferrerPunches - threshold : newReferrerPunches,
          free_washes_earned: earnedReward
            ? referrerLoyalty.free_washes_earned + 1
            : referrerLoyalty.free_washes_earned,
        })
        .eq('id', referrerLoyalty.id);

      if (updateError) throw updateError;

      // Create punch records for referrer
      const cycleNumber = Math.floor(referrerLoyalty.total_visits / threshold) + 1;
      const punchRecords = [];
      for (let i = 0; i < settings.referral.referrer_bonus_punches; i++) {
        punchRecords.push({
          customer_id: referral.referrer_id,
          customer_loyalty_id: referrerLoyalty.id,
          appointment_id: firstAppointmentId,
          cycle_number: cycleNumber,
          punch_number: referrerLoyalty.current_punches + i + 1,
          service_name: 'Referral Bonus',
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('loyalty_punches').insert(punchRecords);

      // Create pending redemption if threshold reached
      if (earnedReward) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('loyalty_redemptions')
          .insert({
            customer_loyalty_id: referrerLoyalty.id,
            cycle_number: cycleNumber,
            status: 'pending',
          });
      }

      referrerBonusAwarded = settings.referral.referrer_bonus_punches;
      console.log(`[Referrals] Awarded ${referrerBonusAwarded} punches to referrer`);
    }

    // 5. Award bonus punches to referee
    let refereeBonusAwarded = 0;
    if (settings.referral.referee_bonus_punches > 0 && refereeLoyalty) {
      const newRefereePunches =
        refereeLoyalty.current_punches + settings.referral.referee_bonus_punches;
      const threshold =
        refereeLoyalty.threshold_override || settings.program.punch_threshold;

      const earnedReward = newRefereePunches >= threshold;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('customer_loyalty')
        .update({
          current_punches: earnedReward ? newRefereePunches - threshold : newRefereePunches,
          free_washes_earned: earnedReward
            ? refereeLoyalty.free_washes_earned + 1
            : refereeLoyalty.free_washes_earned,
        })
        .eq('id', refereeLoyalty.id);

      if (updateError) throw updateError;

      // Create punch records for referee
      const cycleNumber = Math.floor(refereeLoyalty.total_visits / threshold) + 1;
      const punchRecords = [];
      for (let i = 0; i < settings.referral.referee_bonus_punches; i++) {
        punchRecords.push({
          customer_id: referral.referee_id,
          customer_loyalty_id: refereeLoyalty.id,
          appointment_id: firstAppointmentId,
          cycle_number: cycleNumber,
          punch_number: refereeLoyalty.current_punches + i + 1,
          service_name: 'Referral Bonus',
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('loyalty_punches').insert(punchRecords);

      if (earnedReward) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('loyalty_redemptions')
          .insert({
            customer_loyalty_id: refereeLoyalty.id,
            cycle_number: cycleNumber,
            status: 'pending',
          });
      }

      refereeBonusAwarded = settings.referral.referee_bonus_punches;
      console.log(`[Referrals] Awarded ${refereeBonusAwarded} punches to referee`);
    }

    // 6. Mark referral as completed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: completeError } = await (supabase as any)
      .from('referrals')
      .update({
        status: 'completed',
        referrer_bonus_awarded: referrerBonusAwarded > 0,
        referee_bonus_awarded: refereeBonusAwarded > 0,
        completed_at: new Date().toISOString(),
      })
      .eq('id', referral.id);

    if (completeError) throw completeError;

    console.log('[Referrals] Successfully awarded referral bonuses and marked referral complete');

    return {
      success: true,
      referrerBonusAwarded,
      refereeBonusAwarded,
      message: `Awarded ${referrerBonusAwarded} punches to referrer and ${refereeBonusAwarded} punches to referee`,
    };
  } catch (error) {
    console.error('[Referrals] Error awarding referral bonuses:', error);
    return {
      success: false,
      referrerBonusAwarded: 0,
      refereeBonusAwarded: 0,
      message: 'Failed to award referral bonuses',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get customer's referral statistics
 *
 * @param supabase - Supabase client instance
 * @param customerId - UUID of customer
 * @returns Promise resolving to referral stats
 *
 * @example
 * const stats = await getCustomerReferralStats(supabase, customerId);
 * console.log(`Total referrals: ${stats.totalReferrals}`);
 * console.log(`Completed referrals: ${stats.completedReferrals}`);
 */
export async function getCustomerReferralStats(
  supabase: AppSupabaseClient,
  customerId: string
): Promise<{
  referralCode: string | null;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
}> {
  try {
    // Get referral code
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: codeData } = await (supabase as any)
      .from('referral_codes')
      .select('code')
      .eq('customer_id', customerId)
      .eq('is_active', true)
      .single();

    // Get referral counts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: totalCount } = await (supabase as any)
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', customerId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: completedCount } = await (supabase as any)
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', customerId)
      .eq('status', 'completed');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: pendingCount } = await (supabase as any)
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', customerId)
      .eq('status', 'pending');

    return {
      referralCode: codeData?.code || null,
      totalReferrals: totalCount || 0,
      completedReferrals: completedCount || 0,
      pendingReferrals: pendingCount || 0,
    };
  } catch (error) {
    console.error('[Referrals] Error fetching referral stats:', error);
    return {
      referralCode: null,
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
    };
  }
}
