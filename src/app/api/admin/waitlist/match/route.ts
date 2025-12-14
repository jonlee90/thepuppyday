/**
 * Admin Waitlist Matching API Route
 * POST /api/admin/waitlist/match
 *
 * Finds matching waitlist entries for an open appointment slot.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { findMatchingWaitlistEntries } from '@/lib/admin/waitlist-matcher';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/waitlist/match
 *
 * Request Body:
 * - service_id: string (required)
 * - appointment_date: string (required, YYYY-MM-DD)
 * - appointment_time: string (required, HH:MM)
 * - limit: number (optional, default: 10)
 *
 * Response:
 * - matches: Array of matching waitlist entries with joined data
 * - total: Total count of matches
 *
 * Status Codes:
 * - 200: Success
 * - 400: Bad request (missing required fields)
 * - 403: Unauthorized (not admin)
 * - 500: Server error
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check admin authorization
    const admin = await requireAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { service_id, appointment_date, appointment_time, limit = 10 } = body;

    // Validate required fields
    if (!service_id || !appointment_date || !appointment_time) {
      return NextResponse.json(
        {
          error: 'Missing required fields: service_id, appointment_date, appointment_time',
        },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(appointment_time)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM' },
        { status: 400 }
      );
    }

    // Find matching entries
    const result = await findMatchingWaitlistEntries(
      supabase,
      {
        serviceId: service_id,
        appointmentDate: appointment_date,
        appointmentTime: appointment_time,
      },
      limit
    );

    return NextResponse.json(
      {
        matches: result.matches,
        total: result.total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in waitlist match API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
