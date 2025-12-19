/**
 * API Route: GET/PUT /api/admin/settings/loyalty/earning-rules
 * Manages loyalty earning rules configuration
 *
 * Task 0195: Earning rules API routes
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';
import {
  LoyaltyEarningRulesSchema,
  type LoyaltyEarningRules,
} from '@/types/settings';

/**
 * Default earning rules when none are configured
 */
const DEFAULT_EARNING_RULES: LoyaltyEarningRules = {
  qualifying_services: [], // Empty = all services qualify
  minimum_spend: 0,
  first_visit_bonus: 1,
};

/**
 * GET /api/admin/settings/loyalty/earning-rules
 * Fetch loyalty earning rules
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access
    await requireAdmin(supabase);

    // Fetch earning rules from settings table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settingRecord, error: settingsError } = (await (supabase as any)
      .from('settings')
      .select('value, updated_at')
      .eq('key', 'loyalty_earning_rules')
      .single()) as {
      data: { value: unknown; updated_at: string } | null;
      error: { message: string } | null;
    };

    // If not found, return defaults
    if (settingsError?.message === 'No rows found' || !settingRecord?.value) {
      console.log('[Earning Rules API] No settings found, returning defaults');
      return NextResponse.json({
        data: DEFAULT_EARNING_RULES,
        last_updated: null,
      });
    }

    if (settingsError) {
      console.error('[Earning Rules API] Error fetching settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch earning rules' },
        { status: 500 }
      );
    }

    // Parse and validate stored earning rules
    const earningRules = settingRecord.value as LoyaltyEarningRules;

    return NextResponse.json({
      data: earningRules,
      last_updated: settingRecord.updated_at,
    });
  } catch (error) {
    console.error('[Earning Rules API] Unexpected error in GET:', error);

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
 * PUT /api/admin/settings/loyalty/earning-rules
 * Update loyalty earning rules
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access and get admin user
    const { user: admin } = await requireAdmin(supabase);

    // Parse request body
    const body = await request.json();

    // Validate request body with Zod schema
    const parseResult = LoyaltyEarningRulesSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(
        '[Earning Rules API] Validation error:',
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

    const { qualifying_services, minimum_spend, first_visit_bonus } = parseResult.data;

    // Validate service IDs exist if provided
    if (qualifying_services.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: services, error: servicesError } = (await (supabase as any)
        .from('services')
        .select('id')
        .in('id', qualifying_services)) as {
        data: { id: string }[] | null;
        error: Error | null;
      };

      if (servicesError) {
        console.error('[Earning Rules API] Error validating service IDs:', servicesError);
        return NextResponse.json(
          { error: 'Failed to validate service IDs' },
          { status: 500 }
        );
      }

      // Check if all service IDs were found
      const foundIds = services?.map((s) => s.id) || [];
      const invalidIds = qualifying_services.filter((id) => !foundIds.includes(id));

      if (invalidIds.length > 0) {
        console.error('[Earning Rules API] Invalid service IDs:', invalidIds);
        return NextResponse.json(
          {
            error: 'Invalid service IDs',
            details: [
              {
                field: 'qualifying_services',
                message: `Service IDs not found: ${invalidIds.join(', ')}`,
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Calculate affected customers (informational)
    // Count customers with upcoming appointments matching new rules
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: affectedCustomers, error: countError } = (await (supabase as any)
      .from('appointments')
      .select('customer_id', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed'])
      .gte('appointment_date', new Date().toISOString().split('T')[0])) as {
      count: number | null;
      error: Error | null;
    };

    if (countError) {
      console.error('[Earning Rules API] Error counting affected customers:', countError);
      // Don't fail the request, just log it
    }

    const affectedCount = affectedCustomers ?? 0;

    // Fetch existing settings for audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: oldSettingRecord } = (await (supabase as any)
      .from('settings')
      .select('value')
      .eq('key', 'loyalty_earning_rules')
      .single()) as { data: { value: unknown } | null; error: Error | null };

    const oldValue = oldSettingRecord?.value || null;

    // Prepare new earning rules
    const newEarningRules: LoyaltyEarningRules = {
      qualifying_services,
      minimum_spend,
      first_visit_bonus,
    };

    // Update or insert earning rules
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingSetting } = (await (supabase as any)
      .from('settings')
      .select('id')
      .eq('key', 'loyalty_earning_rules')
      .single()) as { data: { id: string } | null; error: Error | null };

    if (existingSetting) {
      // Update existing setting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = (await (supabase as any)
        .from('settings')
        .update({
          value: newEarningRules,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'loyalty_earning_rules')) as { error: Error | null };

      if (updateError) {
        console.error('[Earning Rules API] Update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update earning rules' },
          { status: 500 }
        );
      }
    } else {
      // Insert new setting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = (await (supabase as any)
        .from('settings')
        .insert({
          key: 'loyalty_earning_rules',
          value: newEarningRules,
        })) as { error: Error | null };

      if (insertError) {
        console.error('[Earning Rules API] Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create earning rules' },
          { status: 500 }
        );
      }
    }

    // Log settings change to audit log (fire-and-forget)
    await logSettingsChange(
      supabase,
      admin.id,
      'loyalty',
      'loyalty_earning_rules',
      oldValue,
      newEarningRules
    );

    console.log(
      `[Earning Rules API] Earning rules updated by admin ${admin.id}:`,
      `qualifying_services=${qualifying_services.length > 0 ? qualifying_services.join(',') : 'all'}, `,
      `minimum_spend=${minimum_spend}, first_visit_bonus=${first_visit_bonus}`
    );

    // Build descriptive message
    let message = 'Loyalty earning rules updated successfully. ';
    if (qualifying_services.length === 0) {
      message += 'All services now qualify for earning punches.';
    } else {
      message += `${qualifying_services.length} specific service(s) qualify for earning punches.`;
    }

    if (affectedCount > 0) {
      message += ` This may affect ${affectedCount} customer(s) with upcoming appointments.`;
    }

    return NextResponse.json({
      earning_rules: newEarningRules,
      affected_customers: affectedCount,
      message,
    });
  } catch (error) {
    console.error('[Earning Rules API] Unexpected error in PUT:', error);

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
