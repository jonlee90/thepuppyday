/**
 * API Route: GET/PUT /api/admin/settings/loyalty/redemption-rules
 * Manages loyalty redemption rules configuration
 *
 * Task 0197: Redemption rules API routes
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';
import {
  LoyaltyRedemptionRulesSchema,
  type LoyaltyRedemptionRules,
} from '@/types/settings';

/**
 * GET /api/admin/settings/loyalty/redemption-rules
 * Fetch loyalty redemption rules
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access
    await requireAdmin(supabase);

    // Fetch redemption rules from settings table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settingRecord, error: settingsError } = (await (supabase as any)
      .from('settings')
      .select('value, updated_at')
      .eq('key', 'loyalty_redemption_rules')
      .single()) as {
      data: { value: unknown; updated_at: string } | null;
      error: { message: string } | null;
    };

    // If not found, fetch all service IDs and return defaults
    if (settingsError?.message === 'No rows found' || !settingRecord?.value) {
      console.log('[Redemption Rules API] No settings found, fetching defaults');

      // Fetch all service IDs from database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: services, error: servicesError } = (await (supabase as any)
        .from('services')
        .select('id')
        .eq('is_active', true)) as {
        data: { id: string }[] | null;
        error: Error | null;
      };

      if (servicesError) {
        console.error('[Redemption Rules API] Error fetching services:', servicesError);
        return NextResponse.json(
          { error: 'Failed to fetch services for defaults' },
          { status: 500 }
        );
      }

      const allServiceIds = services?.map((s) => s.id) || [];

      const defaultRules: LoyaltyRedemptionRules = {
        eligible_services: allServiceIds,
        expiration_days: 365,
        max_value: null,
      };

      return NextResponse.json({
        data: defaultRules,
        last_updated: null,
      });
    }

    if (settingsError) {
      console.error('[Redemption Rules API] Error fetching settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch redemption rules' },
        { status: 500 }
      );
    }

    // Parse and validate stored redemption rules
    const redemptionRules = settingRecord.value as LoyaltyRedemptionRules;

    return NextResponse.json({
      data: redemptionRules,
      last_updated: settingRecord.updated_at,
    });
  } catch (error) {
    console.error('[Redemption Rules API] Unexpected error in GET:', error);

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
 * PUT /api/admin/settings/loyalty/redemption-rules
 * Update loyalty redemption rules
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access and get admin user
    const { user: admin } = await requireAdmin(supabase);

    // Parse request body
    const body = await request.json();

    // Validate request body with Zod schema
    const parseResult = LoyaltyRedemptionRulesSchema.safeParse(body);

    if (!parseResult.success) {
      // Format validation errors for user-friendly response
      const errors = parseResult.error?.errors?.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })) ?? [];

      console.error(
        '[Redemption Rules API] Validation error:',
        errors
      );

      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 }
      );
    }

    const { eligible_services, expiration_days, max_value } = parseResult.data;

    // Additional validation: eligible_services must not be empty
    if (eligible_services.length === 0) {
      console.error('[Redemption Rules API] Empty eligible_services array');
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: [
            {
              field: 'eligible_services',
              message: 'At least one service must be eligible for redemption',
            },
          ],
        },
        { status: 400 }
      );
    }

    // INPUT SANITIZATION: Validate UUID format before database query
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invalidFormatIds = eligible_services.filter(id => !UUID_REGEX.test(id));

    if (invalidFormatIds.length > 0) {
      console.error('[Redemption Rules API] Invalid UUID format:', invalidFormatIds);
      return NextResponse.json(
        {
          error: 'Invalid service ID format',
          details: invalidFormatIds.map(id => ({
            field: 'eligible_services',
            message: `Invalid UUID format: ${id}`,
          })),
        },
        { status: 400 }
      );
    }

    // Validate all service IDs exist in the database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: services, error: servicesError } = (await (supabase as any)
      .from('services')
      .select('id')
      .in('id', eligible_services)) as {
      data: { id: string }[] | null;
      error: Error | null;
    };

    if (servicesError) {
      console.error('[Redemption Rules API] Error validating service IDs:', servicesError);
      return NextResponse.json(
        { error: 'Failed to validate service IDs' },
        { status: 500 }
      );
    }

    // Check if all service IDs were found
    const foundIds = services?.map((s) => s.id) || [];
    const invalidIds = eligible_services.filter((id) => !foundIds.includes(id));

    if (invalidIds.length > 0) {
      console.error('[Redemption Rules API] Invalid service IDs:', invalidIds);
      return NextResponse.json(
        {
          error: 'Invalid service IDs',
          details: [
            {
              field: 'eligible_services',
              message: `Service IDs not found: ${invalidIds.join(', ')}`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // Fetch existing settings for audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: oldSettingRecord } = (await (supabase as any)
      .from('settings')
      .select('value')
      .eq('key', 'loyalty_redemption_rules')
      .single()) as { data: { value: unknown } | null; error: Error | null };

    const oldValue = oldSettingRecord?.value || null;

    // Prepare new redemption rules
    const newRedemptionRules: LoyaltyRedemptionRules = {
      eligible_services,
      expiration_days,
      max_value,
    };

    // Update or insert redemption rules
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingSetting } = (await (supabase as any)
      .from('settings')
      .select('id')
      .eq('key', 'loyalty_redemption_rules')
      .single()) as { data: { id: string } | null; error: Error | null };

    if (existingSetting) {
      // Update existing setting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = (await (supabase as any)
        .from('settings')
        .update({
          value: newRedemptionRules,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'loyalty_redemption_rules')) as { error: Error | null };

      if (updateError) {
        console.error('[Redemption Rules API] Update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update redemption rules' },
          { status: 500 }
        );
      }
    } else {
      // Insert new setting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = (await (supabase as any)
        .from('settings')
        .insert({
          key: 'loyalty_redemption_rules',
          value: newRedemptionRules,
        })) as { error: Error | null };

      if (insertError) {
        console.error('[Redemption Rules API] Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create redemption rules' },
          { status: 500 }
        );
      }
    }

    // Log settings change to audit log (fire-and-forget)
    await logSettingsChange(
      supabase,
      admin.id,
      'loyalty',
      'loyalty_redemption_rules',
      oldValue,
      newRedemptionRules
    );

    console.log(
      `[Redemption Rules API] Redemption rules updated by admin ${admin.id}:`,
      `eligible_services=${eligible_services.length}, `,
      `expiration_days=${expiration_days}, max_value=${max_value ?? 'unlimited'}`
    );

    // Build descriptive message
    let message = 'Loyalty redemption rules updated successfully. ';
    message += `${eligible_services.length} service(s) are eligible for free service redemption.`;

    if (expiration_days === 0) {
      message += ' Rewards never expire.';
    } else {
      message += ` Rewards expire after ${expiration_days} days.`;
    }

    if (max_value !== null) {
      message += ` Maximum redemption value is $${max_value.toFixed(2)}.`;
    } else {
      message += ' No maximum redemption value limit.';
    }

    return NextResponse.json({
      redemption_rules: newRedemptionRules,
      message,
    });
  } catch (error) {
    console.error('[Redemption Rules API] Unexpected error in PUT:', error);

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
