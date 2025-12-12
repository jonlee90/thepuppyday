/**
 * GET /api/availability - Calculate available time slots for a specific date and service
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getAvailableSlots,
  DEFAULT_BUSINESS_HOURS,
  timeToMinutes,
  type BusinessHours,
  type TimeSlot,
} from '@/lib/booking';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const serviceId = searchParams.get('service_id');

    // Validate parameters
    if (!date || !serviceId) {
      return NextResponse.json(
        { error: 'Missing required parameters: date and service_id' },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate date is not in the past
    const requestedDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return NextResponse.json(
        { error: 'Cannot query availability for past dates' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get service to check duration
    const { data: service, error: serviceError } = await (supabase as any)
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Get business hours from settings
    const { data: settingsData } = await (supabase as any)
      .from('settings')
      .select('value')
      .eq('key', 'business_hours')
      .single();

    const businessHours = (settingsData?.value as BusinessHours) || DEFAULT_BUSINESS_HOURS;

    // Get appointments for the requested date
    const dateStart = new Date(date + 'T00:00:00').toISOString();
    const dateEnd = new Date(date + 'T23:59:59').toISOString();

    const { data: appointments, error: apptError } = await (supabase as any)
      .from('appointments')
      .select('*')
      .gte('scheduled_at', dateStart)
      .lte('scheduled_at', dateEnd);

    if (apptError) {
      console.error('Error fetching appointments:', apptError);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    // Generate available slots using utility function
    const slots = getAvailableSlots(
      date,
      service.duration_minutes,
      appointments || [],
      businessHours
    );

    // Get waitlist counts for unavailable slots
    const { data: waitlistEntries } = await (supabase as any)
      .from('waitlist')
      .select('*')
      .eq('requested_date', date)
      .eq('status', 'active');

    // Helper function to check if a time slot matches a time preference
    const matchesTimePreference = (slotTime: string, preference: 'morning' | 'afternoon' | 'any'): boolean => {
      if (preference === 'any') {
        return true;
      }

      const slotMinutes = timeToMinutes(slotTime);
      const noonMinutes = 12 * 60; // 720 minutes

      if (preference === 'morning') {
        return slotMinutes < noonMinutes;
      } else {
        // afternoon
        return slotMinutes >= noonMinutes;
      }
    };

    // Map waitlist counts to slots
    const slotsWithWaitlist: TimeSlot[] = slots.map((slot) => {
      if (slot.available) {
        return slot;
      }

      // Count waitlist entries that match this slot's time preference
      const waitlistCount = (waitlistEntries || []).filter((entry: any) =>
        matchesTimePreference(slot.time, entry.time_preference)
      ).length;

      return {
        ...slot,
        waitlistCount,
      };
    });

    return NextResponse.json({ date, slots: slotsWithWaitlist });
  } catch (error) {
    console.error('Error calculating availability:', error);
    return NextResponse.json(
      { error: 'Failed to calculate availability' },
      { status: 500 }
    );
  }
}
