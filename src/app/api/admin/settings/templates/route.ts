/**
 * API Route: GET/PUT /api/admin/settings/templates
 * Manages notification templates (SMS & Email)
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { Setting } from '@/types/database';
import type {
  NotificationTemplates,
  UpdateTemplatesRequest,
} from '@/types/settings';
import { DEFAULT_NOTIFICATION_TEMPLATES } from '@/types/settings';

/**
 * GET /api/admin/settings/templates
 * Fetch notification templates
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access
    await requireAdmin(supabase);

    // Fetch templates setting
    const { data: settings, error } = (await (supabase as any)
      .from('settings')
      .select('*')
      .eq('key', 'templates')
      .single()) as { data: Setting | null; error: Error | null };

    if (error) {
      console.error('[Templates API] Error fetching templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    const templates = (settings?.value as NotificationTemplates) ?? DEFAULT_NOTIFICATION_TEMPLATES;

    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error('[Templates API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/templates
 * Update notification templates
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access
    await requireAdmin(supabase);

    // Parse request body
    const body: UpdateTemplatesRequest = await request.json();

    // Fetch current templates
    const { data: currentSetting } = (await (supabase as any)
      .from('settings')
      .select('*')
      .eq('key', 'templates')
      .single()) as { data: Setting | null };

    const currentTemplates = (currentSetting?.value as NotificationTemplates) ?? DEFAULT_NOTIFICATION_TEMPLATES;

    // Merge with updates (deep merge)
    const updatedTemplates: NotificationTemplates = {
      report_card: {
        ...currentTemplates.report_card,
        ...body.templates.report_card,
      },
      waitlist_offer: {
        ...currentTemplates.waitlist_offer,
        ...body.templates.waitlist_offer,
      },
      breed_reminder: {
        ...currentTemplates.breed_reminder,
        ...body.templates.breed_reminder,
      },
      appointment_confirmation: {
        ...currentTemplates.appointment_confirmation,
        ...body.templates.appointment_confirmation,
      },
      appointment_reminder: {
        ...currentTemplates.appointment_reminder,
        ...body.templates.appointment_reminder,
      },
    };

    // Update templates setting
    const { error } = await (supabase as any)
      .from('settings')
      .update({
        value: updatedTemplates,
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'templates');

    if (error) {
      console.error('[Templates API] Error updating templates:', error);
      return NextResponse.json(
        { error: 'Failed to update templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: updatedTemplates,
      message: 'Templates updated successfully',
    });
  } catch (error) {
    console.error('[Templates API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
