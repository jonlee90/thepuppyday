/**
 * API Route: POST /api/admin/settings/templates/reset
 * Reset notification templates to defaults
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { Setting } from '@/types/database';
import type {
  NotificationTemplates,
  NotificationTemplateType,
  ResetTemplatesRequest,
} from '@/types/settings';
import { DEFAULT_NOTIFICATION_TEMPLATES } from '@/types/settings';

/**
 * POST /api/admin/settings/templates/reset
 * Reset specific templates (or all) to defaults
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access
    await requireAdmin(supabase);

    // Parse request body
    const body: ResetTemplatesRequest = await request.json();

    // If no types specified, reset all
    const typesToReset: NotificationTemplateType[] = body.types ?? [
      'report_card',
      'waitlist_offer',
      'breed_reminder',
      'appointment_confirmation',
      'appointment_reminder',
    ];

    // Fetch current templates
    const { data: currentSetting } = (await (supabase as any)
      .from('settings')
      .select('*')
      .eq('key', 'templates')
      .single()) as { data: Setting | null };

    const currentTemplates = (currentSetting?.value as NotificationTemplates) ?? DEFAULT_NOTIFICATION_TEMPLATES;

    // Reset specified templates to defaults
    const updatedTemplates: NotificationTemplates = { ...currentTemplates };

    for (const type of typesToReset) {
      if (DEFAULT_NOTIFICATION_TEMPLATES[type]) {
        updatedTemplates[type] = { ...DEFAULT_NOTIFICATION_TEMPLATES[type] };
      }
    }

    // Update templates setting
    const { error } = await (supabase as any)
      .from('settings')
      .update({
        value: updatedTemplates,
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'templates');

    if (error) {
      console.error('[Templates Reset API] Error resetting templates:', error);
      return NextResponse.json(
        { error: 'Failed to reset templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: updatedTemplates,
      message: `Successfully reset ${typesToReset.length} template(s) to defaults`,
    });
  } catch (error) {
    console.error('[Templates Reset API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
