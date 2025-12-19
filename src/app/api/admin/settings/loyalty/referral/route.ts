/**
 * Admin API - Referral Program Settings
 * Task 0199: Referral codes API and utility
 *
 * GET /api/admin/settings/loyalty/referral - Fetch referral program settings with stats
 * PUT /api/admin/settings/loyalty/referral - Update referral program settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';
import { ReferralProgramSchema, type ReferralProgram } from '@/types/settings';

/**
 * GET /api/admin/settings/loyalty/referral
 * Fetch referral program settings from settings table and calculate statistics
 *
 * Returns:
 * {
 *   is_enabled: boolean;
 *   referrer_bonus_punches: number;
 *   referee_bonus_punches: number;
 *   stats: {
 *     total_referrals: number;
 *     successful_conversions: number;
 *     bonuses_awarded: number;
 *   }
 * }
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Fetch referral program settings from settings table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settingsData, error: settingsError } = await (supabase as any)
      .from('settings')
      .select('value')
      .eq('key', 'referral_program')
      .single();

    // Default settings if not found
    const defaultSettings: ReferralProgram = {
      is_enabled: false,
      referrer_bonus_punches: 1,
      referee_bonus_punches: 0,
    };

    const settings: ReferralProgram = settingsData?.value
      ? (settingsData.value as ReferralProgram)
      : defaultSettings;

    // Calculate statistics from referrals table
    // Total referrals count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: totalReferrals, error: totalError } = await (supabase as any)
      .from('referrals')
      .select('id', { count: 'exact', head: true });

    if (totalError) {
      console.error('[Referral API] Error counting total referrals:', totalError);
    }

    // Successful conversions (completed status)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: successfulConversions, error: conversionsError } = await (supabase as any)
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed');

    if (conversionsError) {
      console.error('[Referral API] Error counting successful conversions:', conversionsError);
    }

    // Bonuses awarded (either referrer or referee bonus)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: bonusesAwarded, error: bonusesError } = await (supabase as any)
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .or('referrer_bonus_awarded.eq.true,referee_bonus_awarded.eq.true');

    if (bonusesError) {
      console.error('[Referral API] Error counting bonuses awarded:', bonusesError);
    }

    const stats = {
      total_referrals: totalReferrals || 0,
      successful_conversions: successfulConversions || 0,
      bonuses_awarded: bonusesAwarded || 0,
    };

    return NextResponse.json({
      ...settings,
      stats,
    });
  } catch (error) {
    console.error('[Referral API] Error fetching referral program settings:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch referral program settings';

    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/settings/loyalty/referral
 * Update referral program settings
 *
 * Request body:
 * {
 *   is_enabled: boolean;
 *   referrer_bonus_punches: number; // 0-10
 *   referee_bonus_punches: number; // 0-10
 * }
 *
 * Returns updated settings and fresh stats
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireAdmin(supabase);

    // Parse and validate request body
    const body = await request.json();
    const validation = ReferralProgramSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid referral program settings',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const newSettings = validation.data;

    // Fetch old settings for audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: oldSettingsData } = await (supabase as any)
      .from('settings')
      .select('value')
      .eq('key', 'referral_program')
      .single();

    const oldSettings = oldSettingsData?.value || null;

    // Update settings table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('settings')
      .upsert(
        {
          key: 'referral_program',
          value: newSettings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'key',
        }
      );

    if (updateError) {
      throw updateError;
    }

    // Log the change (fire-and-forget)
    await logSettingsChange(
      supabase,
      user.id,
      'referral',
      'referral_program',
      oldSettings,
      newSettings
    );

    // Calculate fresh statistics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: totalReferrals } = await (supabase as any)
      .from('referrals')
      .select('id', { count: 'exact', head: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: successfulConversions } = await (supabase as any)
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: bonusesAwarded } = await (supabase as any)
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .or('referrer_bonus_awarded.eq.true,referee_bonus_awarded.eq.true');

    const stats = {
      total_referrals: totalReferrals || 0,
      successful_conversions: successfulConversions || 0,
      bonuses_awarded: bonusesAwarded || 0,
    };

    const statusMessage = newSettings.is_enabled
      ? 'Referral program enabled'
      : 'Referral program disabled';
    const message = `Referral program settings updated successfully. ${statusMessage}. Note: Disabling stops new codes but honors existing pending referrals.`;

    return NextResponse.json({
      referral_program: newSettings,
      stats,
      message,
    });
  } catch (error) {
    console.error('[Referral API] Error updating referral program settings:', error);
    const message = error instanceof Error ? error.message : 'Failed to update referral program settings';

    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
