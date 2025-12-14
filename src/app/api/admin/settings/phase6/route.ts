/**
 * API Route: GET/PUT /api/admin/settings/phase6
 * Manages Phase 6 settings (Report Cards, Waitlist, Marketing)
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { Setting } from '@/types/database';
import type {
  Phase6Settings,
  UpdatePhase6SettingsRequest,
} from '@/types/settings';
import { DEFAULT_PHASE6_SETTINGS } from '@/types/settings';

/**
 * GET /api/admin/settings/phase6
 * Fetch Phase 6 settings
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access
    await requireAdmin(supabase);

    // Fetch all Phase 6 settings
    const settingKeys = [
      'report_card_auto_send_delay',
      'report_card_expiration_days',
      'google_review_url',
      'waitlist_response_window',
      'waitlist_default_discount',
      'retention_reminder_days',
    ];

    const { data: settings, error } = (await (supabase as any)
      .from('settings')
      .select('*')
      .in('key', settingKeys)) as { data: Setting[] | null; error: Error | null };

    if (error) {
      console.error('[Phase6 Settings API] Error fetching settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    // Map settings to structured response
    const phase6Settings: Phase6Settings = {
      report_card: {
        auto_send_delay_minutes:
          settings?.find((s) => s.key === 'report_card_auto_send_delay')?.value as number ??
          DEFAULT_PHASE6_SETTINGS.report_card.auto_send_delay_minutes,
        expiration_days:
          settings?.find((s) => s.key === 'report_card_expiration_days')?.value as number ??
          DEFAULT_PHASE6_SETTINGS.report_card.expiration_days,
        google_review_url:
          settings?.find((s) => s.key === 'google_review_url')?.value as string ??
          DEFAULT_PHASE6_SETTINGS.report_card.google_review_url,
      },
      waitlist: {
        response_window_hours:
          settings?.find((s) => s.key === 'waitlist_response_window')?.value as number ??
          DEFAULT_PHASE6_SETTINGS.waitlist.response_window_hours,
        default_discount_percent:
          settings?.find((s) => s.key === 'waitlist_default_discount')?.value as number ??
          DEFAULT_PHASE6_SETTINGS.waitlist.default_discount_percent,
      },
      marketing: {
        retention_reminder_advance_days:
          settings?.find((s) => s.key === 'retention_reminder_days')?.value as number ??
          DEFAULT_PHASE6_SETTINGS.marketing.retention_reminder_advance_days,
      },
    };

    return NextResponse.json({ data: phase6Settings });
  } catch (error) {
    console.error('[Phase6 Settings API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/phase6
 * Update Phase 6 settings
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access
    await requireAdmin(supabase);

    // Parse request body
    const body: UpdatePhase6SettingsRequest = await request.json();

    // Build updates array
    const updates: Array<{ key: string; value: unknown }> = [];

    if (body.report_card) {
      if (body.report_card.auto_send_delay_minutes !== undefined) {
        updates.push({
          key: 'report_card_auto_send_delay',
          value: body.report_card.auto_send_delay_minutes,
        });
      }
      if (body.report_card.expiration_days !== undefined) {
        updates.push({
          key: 'report_card_expiration_days',
          value: body.report_card.expiration_days,
        });
      }
      if (body.report_card.google_review_url !== undefined) {
        updates.push({
          key: 'google_review_url',
          value: body.report_card.google_review_url,
        });
      }
    }

    if (body.waitlist) {
      if (body.waitlist.response_window_hours !== undefined) {
        updates.push({
          key: 'waitlist_response_window',
          value: body.waitlist.response_window_hours,
        });
      }
      if (body.waitlist.default_discount_percent !== undefined) {
        updates.push({
          key: 'waitlist_default_discount',
          value: body.waitlist.default_discount_percent,
        });
      }
    }

    if (body.marketing) {
      if (body.marketing.retention_reminder_advance_days !== undefined) {
        updates.push({
          key: 'retention_reminder_days',
          value: body.marketing.retention_reminder_advance_days,
        });
      }
    }

    // Update each setting
    for (const update of updates) {
      const { error } = await (supabase as any)
        .from('settings')
        .update({
          value: update.value,
          updated_at: new Date().toISOString(),
        })
        .eq('key', update.key);

      if (error) {
        console.error(
          `[Phase6 Settings API] Error updating ${update.key}:`,
          error
        );
        return NextResponse.json(
          { error: `Failed to update ${update.key}` },
          { status: 500 }
        );
      }
    }

    // Fetch and return updated settings
    const { data: updatedSettings } = (await (supabase as any)
      .from('settings')
      .select('*')
      .in('key', [
        'report_card_auto_send_delay',
        'report_card_expiration_days',
        'google_review_url',
        'waitlist_response_window',
        'waitlist_default_discount',
        'retention_reminder_days',
      ])) as { data: Setting[] | null };

    const phase6Settings: Phase6Settings = {
      report_card: {
        auto_send_delay_minutes:
          updatedSettings?.find((s) => s.key === 'report_card_auto_send_delay')?.value as number ??
          DEFAULT_PHASE6_SETTINGS.report_card.auto_send_delay_minutes,
        expiration_days:
          updatedSettings?.find((s) => s.key === 'report_card_expiration_days')?.value as number ??
          DEFAULT_PHASE6_SETTINGS.report_card.expiration_days,
        google_review_url:
          updatedSettings?.find((s) => s.key === 'google_review_url')?.value as string ??
          DEFAULT_PHASE6_SETTINGS.report_card.google_review_url,
      },
      waitlist: {
        response_window_hours:
          updatedSettings?.find((s) => s.key === 'waitlist_response_window')?.value as number ??
          DEFAULT_PHASE6_SETTINGS.waitlist.response_window_hours,
        default_discount_percent:
          updatedSettings?.find((s) => s.key === 'waitlist_default_discount')?.value as number ??
          DEFAULT_PHASE6_SETTINGS.waitlist.default_discount_percent,
      },
      marketing: {
        retention_reminder_advance_days:
          updatedSettings?.find((s) => s.key === 'retention_reminder_days')?.value as number ??
          DEFAULT_PHASE6_SETTINGS.marketing.retention_reminder_advance_days,
      },
    };

    return NextResponse.json({
      data: phase6Settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('[Phase6 Settings API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
