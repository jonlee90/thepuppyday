/**
 * Booking Sources Analytics API Route
 * GET /api/admin/analytics/charts/booking-sources
 * Fetch appointment source breakdown (online, walk-in, admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Generate mock trend data for booking sources
 */
function generateMockTrends(startDate: Date, endDate: Date) {
  const trends = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    trends.push({
      date: current.toISOString().split('T')[0],
      online: Math.floor(Math.random() * 8) + 3,
      walk_in: Math.floor(Math.random() * 5) + 1,
      admin: Math.floor(Math.random() * 3) + 1,
    });
    current.setDate(current.getDate() + 7);
  }
  return trends;
}

/**
 * GET /api/admin/analytics/charts/booking-sources
 * Fetch booking source distribution
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json({ error: 'Start and end dates required' }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Mock mode
    if (config.useMocks) {
      const mockData = {
        sources: [
          { source: 'online', count: 145, percentage: 59.2 },
          { source: 'walk_in', count: 67, percentage: 27.3 },
          { source: 'admin', count: 33, percentage: 13.5 },
        ],
        trends: generateMockTrends(startDate, endDate),
      };

      return NextResponse.json({ data: mockData });
    }

    // Production - require admin auth
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // The appointments table does not have a 'source' column.
    // Infer source from status: walk-ins start as 'in_progress' (checked_in),
    // while online/admin bookings start as 'pending' or 'confirmed'.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: appointments, error: apptError } = await (supabase as any)
      .from('appointments')
      .select('status, scheduled_at, booking_reference')
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString());

    if (apptError) {
      console.error('[Booking Sources API] Query error:', apptError);
      throw new Error('Failed to fetch appointments');
    }

    // Infer booking source from available data:
    // - Walk-ins: created with status 'in_progress' (immediate check-in)
    // - Admin: has booking_reference starting with 'APT-' (manual admin creation)
    // - Online: everything else (default booking flow)
    const sourceCounts: Record<string, number> = { online: 0, walk_in: 0, admin: 0 };
    const weeklyData: Record<string, Record<string, number>> = {};

    (appointments || []).forEach((apt: { status: string; scheduled_at: string; booking_reference: string | null }) => {
      let source = 'online';
      if (apt.status === 'in_progress' || apt.status === 'checked_in') {
        source = 'walk_in';
      } else if (apt.booking_reference?.startsWith('APT-')) {
        source = 'admin';
      }

      sourceCounts[source] = (sourceCounts[source] || 0) + 1;

      // Weekly trend
      const date = new Date(apt.scheduled_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) weeklyData[weekKey] = {};
      weeklyData[weekKey][source] = (weeklyData[weekKey][source] || 0) + 1;
    });

    const total = Object.values(sourceCounts).reduce((sum, c) => sum + c, 0);

    const sources = Object.entries(sourceCounts)
      .filter(([, count]) => count > 0)
      .map(([source, count]) => ({
        source,
        count,
        percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
      }));

    // Sort by count descending
    sources.sort((a, b) => b.count - a.count);

    const trends = Object.entries(weeklyData)
      .map(([date, data]) => ({
        date,
        online: data['online'] || 0,
        walk_in: data['walk_in'] || 0,
        admin: data['admin'] || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      data: { sources, trends },
    });
  } catch (error) {
    console.error('[Booking Sources API] Error:', error);

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
