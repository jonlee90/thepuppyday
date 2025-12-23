/**
 * Waitlist Analytics API Route
 * GET /api/admin/analytics/waitlist
 * Task 0053: Fetch waitlist performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { WaitlistEntry } from '@/types/database';

export const dynamic = 'force-dynamic';

interface WaitlistAnalyticsResponse {
  activeCount: number;
  totalRequests: number;
  filled: number;
  fillRate: number;
  responded: number;
  responseRate: number;
  avgWaitTime: number;
  converted: number;
  conversionRate: number;
  trendData: Array<{
    date: string;
    active: number;
    filled: number;
    converted: number;
  }>;
  insights: Array<{
    metric: string;
    value: string;
    change: string;
  }>;
}

/**
 * Calculate average wait time in hours
 */
function calculateAvgWaitTime(waitlistEntries: WaitlistEntry[]): number {
  const filledEntries = waitlistEntries.filter(
    (entry) => entry.status === 'booked' && entry.notified_at
  );

  if (filledEntries.length === 0) return 0;

  const totalHours = filledEntries.reduce((sum, entry) => {
    const createdAt = new Date(entry.created_at).getTime();
    const notifiedAt = new Date(entry.notified_at!).getTime();
    const hours = (notifiedAt - createdAt) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);

  return Math.round((totalHours / filledEntries.length) * 10) / 10;
}

/**
 * Group waitlist entries by date
 */
function generateTrendData(
  waitlistEntries: WaitlistEntry[],
  startDate: Date,
  endDate: Date
): Array<{ date: string; active: number; filled: number; converted: number }> {
  const trendMap = new Map<
    string,
    { active: number; filled: number; converted: number }
  >();

  // Initialize dates in range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    trendMap.set(dateKey, { active: 0, filled: 0, converted: 0 });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Populate trend data
  waitlistEntries.forEach((entry) => {
    const dateKey = new Date(entry.created_at).toISOString().split('T')[0];
    const existing = trendMap.get(dateKey);

    if (existing) {
      if (entry.status === 'active') {
        existing.active += 1;
      } else if (entry.status === 'booked') {
        existing.filled += 1;
        existing.converted += 1;
      } else if (entry.status === 'notified') {
        existing.filled += 1;
      }
    }
  });

  return Array.from(trendMap.entries())
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * GET /api/admin/analytics/waitlist
 * Fetch waitlist performance and conversion metrics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json(
        { error: 'Start and end dates required' },
        { status: 400 }
      );
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO date strings.' },
        { status: 400 }
      );
    }

    // Check if we're in mock mode (return mock data without auth check for development)
    const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

    if (useMocks) {
      // Generate mock waitlist analytics
      const mockTrendData = [];
      const days = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      for (let i = 0; i < Math.min(days, 14); i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        mockTrendData.push({
          date: date.toISOString().split('T')[0],
          active: Math.floor(Math.random() * 5) + 2,
          filled: Math.floor(Math.random() * 3) + 1,
          converted: Math.floor(Math.random() * 2) + 1,
        });
      }

      const mockData: WaitlistAnalyticsResponse = {
        activeCount: 12,
        totalRequests: 45,
        filled: 28,
        fillRate: 62.2,
        responded: 24,
        responseRate: 85.7,
        avgWaitTime: 18.5,
        converted: 21,
        conversionRate: 75.0,
        trendData: mockTrendData,
        insights: [
          {
            metric: 'Fill Rate',
            value: '62.2%',
            change: '+8.3%',
          },
          {
            metric: 'Avg Wait Time',
            value: '18.5 hrs',
            change: '-3.2 hrs',
          },
          {
            metric: 'Conversion Rate',
            value: '75.0%',
            change: '+5.1%',
          },
        ],
      };

      return NextResponse.json({ data: mockData });
    }

    // Production implementation - require admin auth
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Fetch waitlist entries within date range
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: waitlistEntries, error } = (await (supabase as any)
      .from('waitlist')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())) as {
      data: WaitlistEntry[] | null;
      error: Error | null;
    };

    if (error) {
      console.error('Error fetching waitlist entries:', error);
      throw new Error('Failed to fetch waitlist entries');
    }

    const entries = waitlistEntries || [];

    // Calculate metrics
    const activeCount = entries.filter((entry) => entry.status === 'active').length;
    const totalRequests = entries.length;
    const filled = entries.filter((entry) =>
      ['booked', 'notified'].includes(entry.status)
    ).length;
    const fillRate = totalRequests > 0 ? Math.round((filled / totalRequests) * 1000) / 10 : 0;

    const responded = entries.filter((entry) => entry.notified_at !== null).length;
    const responseRate = filled > 0 ? Math.round((responded / filled) * 1000) / 10 : 0;

    const avgWaitTime = calculateAvgWaitTime(entries);

    const converted = entries.filter((entry) => entry.status === 'booked').length;
    const conversionRate = filled > 0 ? Math.round((converted / filled) * 1000) / 10 : 0;

    // Generate trend data
    const trendData = generateTrendData(entries, startDate, endDate);

    // Calculate insights (comparing to overall averages)
    const insights = [
      {
        metric: 'Fill Rate',
        value: `${fillRate}%`,
        change: fillRate > 60 ? '+Good' : 'Low',
      },
      {
        metric: 'Avg Wait Time',
        value: `${avgWaitTime} hrs`,
        change: avgWaitTime < 24 ? 'Fast' : 'Slow',
      },
      {
        metric: 'Conversion Rate',
        value: `${conversionRate}%`,
        change: conversionRate > 70 ? '+Good' : 'Low',
      },
    ];

    const responseData: WaitlistAnalyticsResponse = {
      activeCount,
      totalRequests,
      filled,
      fillRate,
      responded,
      responseRate,
      avgWaitTime,
      converted,
      conversionRate,
      trendData,
      insights,
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('Error in waitlist analytics:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
