/**
 * Appointment Trend Analytics API Route
 * GET /api/admin/analytics/charts/appointments-trend
 * Task 0051: Fetch appointment trend data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

/**
 * Determine granularity based on date range
 * - Less than 14 days: daily
 * - Less than 90 days: weekly
 * - 90+ days: monthly
 */
function determineGranularity(start: Date, end: Date): 'daily' | 'weekly' | 'monthly' {
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (days <= 14) return 'daily';
  if (days <= 90) return 'weekly';
  return 'monthly';
}

/**
 * Format date based on granularity
 */
function formatDate(date: Date, granularity: 'daily' | 'weekly' | 'monthly'): string {
  if (granularity === 'daily') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (granularity === 'weekly') {
    return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}

/**
 * Group appointments by date based on granularity
 */
function groupAppointments(
  appointments: any[],
  granularity: 'daily' | 'weekly' | 'monthly'
): Record<string, number> {
  const grouped: Record<string, number> = {};

  appointments.forEach((apt) => {
    const date = new Date(apt.scheduled_at);
    let key: string;

    if (granularity === 'daily') {
      key = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (granularity === 'weekly') {
      // Get week start (Sunday)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      // Monthly
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    }

    grouped[key] = (grouped[key] || 0) + 1;
  });

  return grouped;
}

/**
 * GET /api/admin/analytics/charts/appointments-trend
 * Fetch appointment trend data with previous period comparison
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

    // Determine granularity
    const granularity = determineGranularity(startDate, endDate);

    // Calculate previous period
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate.getTime());

    // Check if we're in mock mode (return mock data without auth check for development)
    const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

    if (useMocks) {
      // Generate mock trend data
      const mockData = [];
      const days = Math.ceil(periodLength / (1000 * 60 * 60 * 24));
      const points = granularity === 'daily' ? Math.min(days, 30) : granularity === 'weekly' ? 8 : 6;

      for (let i = 0; i < points; i++) {
        const date = new Date(startDate.getTime() + (periodLength / points) * i);
        mockData.push({
          date: formatDate(date, granularity),
          current: Math.floor(Math.random() * 20) + 10,
          previous: Math.floor(Math.random() * 18) + 8,
        });
      }

      return NextResponse.json({
        data: {
          data: mockData,
          granularity,
          trend: 'up',
          change: 12.5,
        },
      });
    }

    // Production implementation - require admin auth
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Fetch current period appointments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentAppointments, error: currentError } = await (supabase as any)
      .from('appointments')
      .select('scheduled_at')
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString())
      .in('status', ['completed', 'confirmed', 'pending']);

    if (currentError) {
      throw new Error('Failed to fetch current appointments');
    }

    // Fetch previous period appointments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prevAppointments, error: prevError } = await (supabase as any)
      .from('appointments')
      .select('scheduled_at')
      .gte('scheduled_at', prevStartDate.toISOString())
      .lte('scheduled_at', prevEndDate.toISOString())
      .in('status', ['completed', 'confirmed', 'pending']);

    if (prevError) {
      throw new Error('Failed to fetch previous appointments');
    }

    // Group by date
    const currentGrouped = groupAppointments(currentAppointments || [], granularity);
    const prevGrouped = groupAppointments(prevAppointments || [], granularity);

    // Create chart data points
    const allDates = new Set([...Object.keys(currentGrouped), ...Object.keys(prevGrouped)]);
    const sortedDates = Array.from(allDates).sort();

    const chartData = sortedDates.map((dateKey) => ({
      date: formatDate(new Date(dateKey), granularity),
      current: currentGrouped[dateKey] || 0,
      previous: prevGrouped[dateKey] || 0,
    }));

    // Calculate trend
    const currentTotal = Object.values(currentGrouped).reduce((sum, count) => sum + count, 0);
    const prevTotal = Object.values(prevGrouped).reduce((sum, count) => sum + count, 0);
    const change = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
    const trend = change > 5 ? 'up' : change < -5 ? 'down' : 'flat';

    return NextResponse.json({
      data: {
        data: chartData,
        granularity,
        trend,
        change,
      },
    });
  } catch (error) {
    console.error('Error fetching appointment trend:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
