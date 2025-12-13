/**
 * Admin Business Hours Settings API
 * Update business hours configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

interface DaySchedule {
  is_open: boolean;
  open: string;
  close: string;
}

interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
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
    const { data: existingSetting } = (await (supabase as any)
      .from('settings')
      .select('id')
      .eq('key', 'business_hours')
      .single()) as { data: any; error: Error | null };

    if (existingSetting) {
      // Update existing setting
      const { error: updateError } = (await (supabase as any)
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
      const { error: insertError } = (await (supabase as any)
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
