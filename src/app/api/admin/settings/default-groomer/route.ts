/**
 * API Route: GET/PUT /api/admin/settings/default-groomer
 * Manages the default groomer assignment for new appointments
 */

import { NextResponse, after } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';
import { DefaultGroomerSettingSchema } from '@/types/settings';

const SETTINGS_KEY = 'default_groomer';

/**
 * GET /api/admin/settings/default-groomer
 * Fetch the default groomer setting
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();

    await requireAdmin(supabase);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settingRecord, error } = (await (serviceClient as any)
      .from('settings')
      .select('value, updated_at')
      .eq('key', SETTINGS_KEY)
      .single()) as {
      data: { value: unknown; updated_at: string } | null;
      error: Error | null;
    };

    if (error && error.message !== 'No rows found') {
      console.error('[Default Groomer API] Error fetching setting:', error);
      return NextResponse.json(
        { error: 'Failed to fetch default groomer setting' },
        { status: 500 }
      );
    }

    const defaultValue = { groomer_id: null };

    if (!settingRecord) {
      return NextResponse.json({
        data: defaultValue,
        last_updated: null,
      });
    }

    const parseResult = DefaultGroomerSettingSchema.safeParse(settingRecord.value);

    if (!parseResult.success) {
      return NextResponse.json({
        data: defaultValue,
        last_updated: settingRecord.updated_at,
      });
    }

    return NextResponse.json({
      data: parseResult.data,
      last_updated: settingRecord.updated_at,
    });
  } catch (error) {
    console.error('[Default Groomer API] Unexpected error in GET:', error);

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
 * PUT /api/admin/settings/default-groomer
 * Update the default groomer setting
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();

    const { user: admin } = await requireAdmin(supabase);

    const body = await request.json();

    const parseResult = DefaultGroomerSettingSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const newValue = parseResult.data;

    // Fetch old value for audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: oldRecord } = (await (serviceClient as any)
      .from('settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single()) as { data: { value: unknown } | null; error: Error | null };

    const oldValue = oldRecord?.value || null;

    // Upsert the setting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = (await (serviceClient as any)
      .from('settings')
      .upsert(
        {
          key: SETTINGS_KEY,
          value: newValue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )) as { error: Error | null };

    if (upsertError) {
      console.error('[Default Groomer API] Upsert error:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update default groomer setting' },
        { status: 500 }
      );
    }

    after(() => logSettingsChange(
      supabase,
      admin.id,
      'booking',
      SETTINGS_KEY,
      oldValue,
      newValue
    ));

    return NextResponse.json({
      data: newValue,
      message: 'Default groomer setting updated successfully',
    });
  } catch (error) {
    console.error('[Default Groomer API] Unexpected error in PUT:', error);

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
