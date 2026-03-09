/**
 * Peak Hours Analytics API Route
 * GET /api/admin/analytics/charts/peak-hours
 * Fetch appointment heatmap and peak hour data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * GET /api/admin/analytics/charts/peak-hours
 * Fetch peak hours heatmap and summary data
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
      const heatmap: { day: number; hour: number; count: number }[] = [];
      let maxCount = 0;

      // Generate realistic heatmap data (busier on weekends, mornings)
      for (let day = 0; day < 7; day++) {
        for (let hour = 8; hour <= 18; hour++) {
          const isWeekend = day === 0 || day === 6;
          const isMorning = hour >= 9 && hour <= 12;
          const isAfternoon = hour >= 13 && hour <= 16;

          let base = 2;
          if (isWeekend) base += 4;
          if (isMorning) base += 3;
          if (isAfternoon) base += 1;
          if (day === 6 && isMorning) base += 5; // Saturday mornings peak

          const count = Math.max(0, base + Math.floor(Math.random() * 4) - 1);
          if (count > maxCount) maxCount = count;
          heatmap.push({ day, hour, count });
        }
      }

      // Aggregate by hour
      const byHourMap: Record<number, number> = {};
      heatmap.forEach(({ hour, count }) => {
        byHourMap[hour] = (byHourMap[hour] || 0) + count;
      });
      const byHour = Object.entries(byHourMap).map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
      }));

      // Find busiest day and hour
      const byDayMap: Record<number, number> = {};
      heatmap.forEach(({ day, count }) => {
        byDayMap[day] = (byDayMap[day] || 0) + count;
      });
      const busiestDayNum = Object.entries(byDayMap).sort((a, b) => b[1] - a[1])[0][0];
      const busiestHour = byHour.sort((a, b) => b.count - a.count)[0].hour;
      const totalAppointments = heatmap.reduce((sum, h) => sum + h.count, 0);

      // Re-sort byHour by hour
      byHour.sort((a, b) => a.hour - b.hour);

      return NextResponse.json({
        data: {
          heatmap,
          byHour,
          busiestDay: DAY_NAMES[parseInt(busiestDayNum)],
          busiestHour,
          totalAppointments,
        },
      });
    }

    // Production - require admin auth
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();
    await requireAdmin(supabase);

    // Fetch completed appointments in date range
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: appointments, error: apptError } = await (serviceClient as any)
      .from('appointments')
      .select('scheduled_at')
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString())
      .eq('status', 'completed');

    if (apptError) {
      console.error('[Peak Hours API] Query error:', apptError);
      throw new Error('Failed to fetch appointments');
    }

    // Build heatmap from appointment data
    const heatmapMap: Record<string, number> = {};
    const byHourMap: Record<number, number> = {};
    const byDayMap: Record<number, number> = {};

    (appointments || []).forEach((apt: { scheduled_at: string }) => {
      const date = new Date(apt.scheduled_at);
      const day = date.getDay();
      const hour = date.getHours();

      // Only count business hours (8-18)
      if (hour < 8 || hour > 18) return;

      const key = `${day}-${hour}`;
      heatmapMap[key] = (heatmapMap[key] || 0) + 1;
      byHourMap[hour] = (byHourMap[hour] || 0) + 1;
      byDayMap[day] = (byDayMap[day] || 0) + 1;
    });

    // Build heatmap array
    const heatmap: { day: number; hour: number; count: number }[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 8; hour <= 18; hour++) {
        heatmap.push({
          day,
          hour,
          count: heatmapMap[`${day}-${hour}`] || 0,
        });
      }
    }

    // Build by-hour array
    const byHour = [];
    for (let hour = 8; hour <= 18; hour++) {
      byHour.push({ hour, count: byHourMap[hour] || 0 });
    }

    // Find busiest day and hour
    const busiestDayEntry = Object.entries(byDayMap).sort((a, b) => b[1] - a[1])[0];
    const busiestHourEntry = Object.entries(byHourMap).sort((a, b) => b[1] - a[1])[0];

    const totalAppointments = (appointments || []).length;

    return NextResponse.json({
      data: {
        heatmap,
        byHour,
        busiestDay: busiestDayEntry ? DAY_NAMES[parseInt(busiestDayEntry[0])] : 'N/A',
        busiestHour: busiestHourEntry ? parseInt(busiestHourEntry[0]) : 0,
        totalAppointments,
      },
    });
  } catch (error) {
    console.error('[Peak Hours API] Error:', error);

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
