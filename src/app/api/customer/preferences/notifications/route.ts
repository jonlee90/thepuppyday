/**
 * Phase 8: Customer Notification Preferences API
 * GET /api/customer/preferences/notifications - Get current preferences
 * PUT /api/customer/preferences/notifications - Update preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/notifications/preferences';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for updating notification preferences
 * All fields are optional booleans
 */
const updatePreferencesSchema = z.object({
  marketing_enabled: z.boolean().optional(),
  email_appointment_reminders: z.boolean().optional(),
  sms_appointment_reminders: z.boolean().optional(),
  email_retention_reminders: z.boolean().optional(),
  sms_retention_reminders: z.boolean().optional(),
}).strict();

// ============================================================================
// GET - Get current notification preferences
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // Authenticate user with session client
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get preferences using service role client (bypasses RLS)
    const serviceClient = createServiceRoleClient();
    const preferences = await getNotificationPreferences(serviceClient, user.id);

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('[Preferences API] Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update notification preferences
// ============================================================================

export async function PUT(req: NextRequest) {
  try {
    // Authenticate user with session client
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = updatePreferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // Update preferences using service role client (bypasses RLS)
    const serviceClient = createServiceRoleClient();
    const result = await updateNotificationPreferences(
      serviceClient,
      user.id,
      validation.data
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update preferences' },
        { status: 500 }
      );
    }

    // Get updated preferences to return
    const updatedPreferences = await getNotificationPreferences(serviceClient, user.id);

    return NextResponse.json({
      success: true,
      preferences: updatedPreferences,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Preferences API] Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
