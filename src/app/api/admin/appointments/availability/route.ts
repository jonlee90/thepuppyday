/**
 * Admin Availability Check API
 * GET /api/admin/appointments/availability
 *
 * Checks time slot availability for a specific date and duration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import {
  getAvailableSlots,
  DEFAULT_BUSINESS_HOURS,
  getDayName,
  type TimeSlot,
} from '@/lib/booking/availability';
import type { Appointment } from '@/types/database';

export const dynamic = 'force-dynamic';

/**
 * GET handler for checking appointment availability
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const durationMinutes = searchParams.get('duration_minutes');

    // Validate required parameters
    if (!date) {
      return NextResponse.json(
        { error: 'Missing required parameter: date (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (!durationMinutes) {
      return NextResponse.json(
        { error: 'Missing required parameter: duration_minutes' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate duration
    const duration = parseInt(durationMinutes, 10);
    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json(
        { error: 'Invalid duration_minutes. Must be a positive number' },
        { status: 400 }
      );
    }

    // Parse date and check day of week
    const dateObj = new Date(date + 'T00:00:00');
    const dayName = getDayName(dateObj);
    const dayHours = DEFAULT_BUSINESS_HOURS[dayName];

    // Check if business is closed (Sunday)
    if (!dayHours.is_open) {
      return NextResponse.json({
        date,
        is_closed: true,
        business_hours: {
          start: dayHours.open,
          end: dayHours.close,
        },
        time_slots: [],
      });
    }

    // Fetch existing appointments for the date
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, scheduled_at, duration_minutes, status')
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .in('status', ['pending', 'confirmed', 'checked_in', 'in_progress']);

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    // Get available time slots
    const slots = getAvailableSlots(
      date,
      duration,
      appointments as Appointment[],
      DEFAULT_BUSINESS_HOURS
    );

    // Count existing appointments per slot for additional info
    const slotsWithCounts = slots.map((slot: TimeSlot) => {
      const slotTime = new Date(`${date}T${slot.time}:00`);
      const slotEndTime = new Date(slotTime.getTime() + duration * 60000);

      const existingCount = (appointments || []).filter((apt: Appointment) => {
        const aptStart = new Date(apt.scheduled_at);
        const aptEnd = new Date(aptStart.getTime() + apt.duration_minutes * 60000);

        // Check for overlap
        return aptStart < slotEndTime && aptEnd > slotTime;
      }).length;

      return {
        time: slot.time,
        available: slot.available,
        booked_count: existingCount,
        max_concurrent: 3, // Configurable - could come from settings
      };
    });

    return NextResponse.json({
      date,
      is_closed: false,
      business_hours: {
        start: dayHours.open,
        end: dayHours.close,
      },
      time_slots: slotsWithCounts,
    });
  } catch (error) {
    console.error('Error in availability API:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
