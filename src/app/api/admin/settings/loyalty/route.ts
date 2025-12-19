/**
 * API Route: GET/PUT /api/admin/settings/loyalty
 * Manages loyalty program configuration settings
 *
 * Task 0192: Loyalty settings API routes
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';
import type {
  LoyaltyEarningRules,
  LoyaltyRedemptionRules,
  ReferralProgram,
} from '@/types/settings';

/**
 * Full loyalty program settings interface
 */
export interface LoyaltySettings {
  is_enabled: boolean;
  punch_threshold: number; // 5-20, default 9
  earning_rules: LoyaltyEarningRules;
  redemption_rules: LoyaltyRedemptionRules;
  referral_program: ReferralProgram;
}

/**
 * Loyalty program statistics
 */
export interface LoyaltyStats {
  active_customers: number; // Count from customer_loyalty table
  total_rewards_redeemed: number; // Sum of redeemed rewards
  pending_rewards: number; // Count where punch_count >= threshold
}

/**
 * Full loyalty settings response
 */
export interface LoyaltySettingsResponse extends LoyaltySettings {
  stats: LoyaltyStats;
}

/**
 * Validation schema for base loyalty settings update
 */
const UpdateLoyaltySettingsSchema = z.object({
  is_enabled: z.boolean(),
  punch_threshold: z.number().int().min(5).max(20),
});

/**
 * Default loyalty program settings
 * Applied when no settings exist in database
 */
const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  is_enabled: true,
  punch_threshold: 9, // Buy 9, get 10th free
  earning_rules: {
    qualifying_services: [], // Empty = all services qualify
    minimum_spend: 0,
    first_visit_bonus: 1,
  },
  redemption_rules: {
    eligible_services: [], // Must be populated with actual service IDs
    expiration_days: 365,
    max_value: null,
  },
  referral_program: {
    is_enabled: false,
    referrer_bonus_punches: 1,
    referee_bonus_punches: 0,
  },
};

/**
 * GET /api/admin/settings/loyalty
 * Fetch all loyalty program settings and statistics
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access
    await requireAdmin(supabase);

    // Fetch loyalty settings from settings table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settingRecord, error: settingsError } = (await (supabase as any)
      .from('settings')
      .select('value, updated_at')
      .eq('key', 'loyalty_program')
      .single()) as {
      data: { value: unknown; updated_at: string } | null;
      error: Error | null;
    };

    if (settingsError && settingsError.message !== 'No rows found') {
      console.error('[Loyalty Settings API] Error fetching settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch loyalty settings' },
        { status: 500 }
      );
    }

    // Use default settings if none found
    let settings: LoyaltySettings = DEFAULT_LOYALTY_SETTINGS;

    if (settingRecord?.value) {
      // Merge database settings with defaults (in case of partial data)
      const dbSettings = settingRecord.value as Partial<LoyaltySettings>;
      settings = {
        is_enabled: dbSettings.is_enabled ?? DEFAULT_LOYALTY_SETTINGS.is_enabled,
        punch_threshold: dbSettings.punch_threshold ?? DEFAULT_LOYALTY_SETTINGS.punch_threshold,
        earning_rules: dbSettings.earning_rules ?? DEFAULT_LOYALTY_SETTINGS.earning_rules,
        redemption_rules: dbSettings.redemption_rules ?? DEFAULT_LOYALTY_SETTINGS.redemption_rules,
        referral_program: dbSettings.referral_program ?? DEFAULT_LOYALTY_SETTINGS.referral_program,
      };
    } else {
      console.log('[Loyalty Settings API] No settings found, using defaults');
    }

    // Calculate statistics
    const stats = await calculateLoyaltyStats(supabase, settings.punch_threshold);

    const response: LoyaltySettingsResponse = {
      ...settings,
      stats,
    };

    return NextResponse.json({
      data: response,
      last_updated: settingRecord?.updated_at || null,
    });
  } catch (error) {
    console.error('[Loyalty Settings API] Unexpected error in GET:', error);

    // Check for authentication error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/loyalty
 * Update base loyalty program settings (is_enabled, punch_threshold)
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access and get admin user
    const { user: admin } = await requireAdmin(supabase);

    // Parse request body
    const body = await request.json();

    // Validate request body with Zod schema
    const parseResult = UpdateLoyaltySettingsSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(
        '[Loyalty Settings API] Validation error:',
        parseResult.error?.errors
      );

      // Format validation errors for user-friendly response
      const errors = parseResult.error?.errors?.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })) || [];

      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 }
      );
    }

    const { is_enabled, punch_threshold } = parseResult.data;

    // Fetch existing settings for merging
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: oldSettingRecord } = (await (supabase as any)
      .from('settings')
      .select('value')
      .eq('key', 'loyalty_program')
      .single()) as { data: { value: unknown } | null; error: Error | null };

    const oldSettings = oldSettingRecord?.value || null;

    // Merge with existing settings (preserve earning_rules, redemption_rules, referral if not provided)
    const existingSettings = (oldSettings as LoyaltySettings | null) || DEFAULT_LOYALTY_SETTINGS;
    const newSettings: LoyaltySettings = {
      is_enabled,
      punch_threshold,
      earning_rules: existingSettings.earning_rules,
      redemption_rules: existingSettings.redemption_rules,
      referral_program: existingSettings.referral_program,
    };

    // Update or insert loyalty settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingSetting } = (await (supabase as any)
      .from('settings')
      .select('id')
      .eq('key', 'loyalty_program')
      .single()) as { data: { id: string } | null; error: Error | null };

    if (existingSetting) {
      // Update existing setting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = (await (supabase as any)
        .from('settings')
        .update({
          value: newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'loyalty_program')) as { error: Error | null };

      if (updateError) {
        console.error('[Loyalty Settings API] Update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update loyalty settings' },
          { status: 500 }
        );
      }
    } else {
      // Insert new setting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = (await (supabase as any)
        .from('settings')
        .insert({
          key: 'loyalty_program',
          value: newSettings,
        })) as { error: Error | null };

      if (insertError) {
        console.error('[Loyalty Settings API] Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create loyalty settings' },
          { status: 500 }
        );
      }
    }

    // Log settings change to audit log (fire-and-forget)
    await logSettingsChange(
      supabase,
      admin.id,
      'loyalty',
      'loyalty_program',
      oldSettings,
      newSettings
    );

    // Calculate fresh statistics
    const stats = await calculateLoyaltyStats(supabase, punch_threshold);

    const response: LoyaltySettingsResponse = {
      ...newSettings,
      stats,
    };

    console.log(
      `[Loyalty Settings API] Settings updated by admin ${admin.id}:`,
      `is_enabled=${is_enabled}, punch_threshold=${punch_threshold}`
    );

    // Note about disabling: Disabling program preserves existing punch data
    const message = is_enabled
      ? 'Loyalty program settings updated successfully'
      : 'Loyalty program disabled. Existing punch data has been preserved.';

    return NextResponse.json({
      data: response,
      message,
    });
  } catch (error) {
    console.error('[Loyalty Settings API] Unexpected error in PUT:', error);

    // Check for authentication error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate loyalty program statistics
 * @param supabase - Supabase client
 * @param punchThreshold - Current punch threshold for pending rewards calculation
 * @returns Loyalty statistics
 */
async function calculateLoyaltyStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  punchThreshold: number
): Promise<LoyaltyStats> {
  try {
    // Count active customers (customers with loyalty records)
    const { count: activeCustomersCount, error: customersError } = await supabase
      .from('customer_loyalty')
      .select('customer_id', { count: 'exact', head: true });

    if (customersError) {
      console.error('[Loyalty Stats] Error counting active customers:', customersError);
    }

    // Count total rewards redeemed (from loyalty_redemptions table)
    const { count: redemptionsCount, error: redemptionsError } = await supabase
      .from('loyalty_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'redeemed');

    if (redemptionsError) {
      console.error('[Loyalty Stats] Error counting redemptions:', redemptionsError);
    }

    // Count pending rewards (customers with punch_count >= threshold)
    const { count: pendingCount, error: pendingError } = await supabase
      .from('customer_loyalty')
      .select('id', { count: 'exact', head: true })
      .gte('current_punches', punchThreshold);

    if (pendingError) {
      console.error('[Loyalty Stats] Error counting pending rewards:', pendingError);
    }

    const stats: LoyaltyStats = {
      active_customers: activeCustomersCount ?? 0,
      total_rewards_redeemed: redemptionsCount ?? 0,
      pending_rewards: pendingCount ?? 0,
    };

    console.log('[Loyalty Stats] Calculated stats:', stats);

    return stats;
  } catch (error) {
    console.error('[Loyalty Stats] Error calculating statistics:', error);

    // Return zero stats on error
    return {
      active_customers: 0,
      total_rewards_redeemed: 0,
      pending_rewards: 0,
    };
  }
}
