/**
 * Admin Business Hours Settings API
 * Update business hours configuration
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { toSettingsBusinessHours, type BusinessHours } from '@/lib/booking/availability';
import { BookingSettingsSchema } from '@/types/settings';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();
    await requireAdmin(supabase);

    const body = await request.json();
    const { businessHours } = body as { businessHours: BusinessHours };

    if (!businessHours) {
      return NextResponse.json(
        { error: 'Business hours data is required' },
        { status: 400 }
      );
    }

    // Validate business hours structure
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of daysOfWeek) {
      const schedule = businessHours[day as keyof BusinessHours];
      if (!schedule || typeof schedule.is_open !== 'boolean') {
        return NextResponse.json(
          { error: `Invalid schedule for ${day}` },
          { status: 400 }
        );
      }
      if (schedule.is_open) {
        if (!schedule.open || !schedule.close) {
          return NextResponse.json(
            { error: `Missing open/close times for ${day}` },
            { status: 400 }
          );
        }
      }
    }

    // Update or insert business hours setting
    const { data: existingSetting } = (await (serviceClient as any)
      .from('settings')
      .select('id')
      .eq('key', 'business_hours')
      .single()) as { data: any; error: Error | null };

    if (existingSetting) {
      // Update existing setting
      const { error: updateError } = (await (serviceClient as any)
        .from('settings')
        .update({
          value: businessHours,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'business_hours')) as { error: Error | null };

      if (updateError) {
        console.error('[Business Hours API] Update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update business hours' },
          { status: 500 }
        );
      }
    } else {
      // Insert new setting
      const { error: insertError } = (await (serviceClient as any)
        .from('settings')
        .insert({
          key: 'business_hours',
          value: businessHours,
        })) as { error: Error | null };

      if (insertError) {
        console.error('[Business Hours API] Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create business hours setting' },
          { status: 500 }
        );
      }
    }

    // The booking flow reads hours from booking_settings.business_hours (in { isOpen, ranges }
    // form), so mirror the change there — otherwise the calendar keeps the old schedule.
    const { data: bookingSettingsRow } = (await (serviceClient as any)
      .from('settings')
      .select('value')
      .eq('key', 'booking_settings')
      .single()) as { data: { value: Record<string, unknown> } | null };

    if (bookingSettingsRow?.value) {
      const merged = {
        ...bookingSettingsRow.value,
        business_hours: toSettingsBusinessHours(businessHours),
      };

      // Both booking-settings readers safeParse this row and fall back to defaults on a
      // miss, so a malformed write here would silently drop blocked dates and the
      // booking window. Validate before touching the row.
      const parsed = BookingSettingsSchema.safeParse(merged);

      if (!parsed.success) {
        console.error('[Business Hours API] Refusing invalid booking settings sync:', parsed.error);
      } else {
        const { error: syncError } = (await (serviceClient as any)
          .from('settings')
          .update({
            value: parsed.data,
            updated_at: new Date().toISOString(),
          })
          .eq('key', 'booking_settings')) as { error: Error | null };

        if (syncError) {
          console.error('[Business Hours API] Booking settings sync error:', syncError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Business hours updated successfully',
    });
  } catch (error) {
    console.error('[Business Hours API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
