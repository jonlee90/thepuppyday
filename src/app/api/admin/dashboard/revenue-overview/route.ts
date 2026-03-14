/**
 * Admin Dashboard Revenue Overview API Route
 * Returns multi-period revenue data: today, this week, this month
 * with percentage change vs prior periods.
 *
 * Auth pattern: createServerSupabaseClient() + requireAdmin() for auth,
 * createServiceRoleClient() for data queries (bypasses RLS).
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { BUSINESS_TIMEZONE, getTodayInBusinessTimezone } from '@/lib/utils/timezone';

export interface RevenueOverviewResponse {
  today: {
    completed: number;   // Sum of total_price where status = 'completed'
    pending: number;     // Sum of total_price where status in ('pending','confirmed','in_progress')
    total: number;       // completed + pending
    changePercent: number | null; // % change vs yesterday's total, null if no yesterday data
  };
  thisWeek: {
    total: number;       // Sum of total_price for current Mon-Sat
    changePercent: number | null; // % change vs last week's total
  };
  thisMonth: {
    total: number;       // Sum of total_price for current calendar month
    changePercent: number | null; // % change vs last month's total
  };
}

// Static mock data for development/mock mode
const MOCK_RESPONSE: RevenueOverviewResponse = {
  today: { completed: 220, pending: 100, total: 320, changePercent: 12 },
  thisWeek: { total: 1840, changePercent: 8 },
  thisMonth: { total: 6200, changePercent: 5 },
};

/**
 * Compute the change percent between current and previous totals.
 * Returns null when previous total is 0 (no comparison data).
 */
function computeChangePercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

/**
 * Sum total_price for appointments in the given date range,
 * optionally filtering by status list.
 */
async function sumRevenue(
  serviceClient: ReturnType<typeof createServiceRoleClient>,
  rangeStart: string,
  rangeEnd: string,
  statuses?: string[]
): Promise<number> {
  let query = (serviceClient as any)
    .from('appointments')
    .select('total_price')
    .gte('scheduled_at', rangeStart)
    .lt('scheduled_at', rangeEnd)
    .not('status', 'in', '(cancelled,no_show)');

  if (statuses && statuses.length > 0) {
    query = query.in('status', statuses);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Revenue Overview] sumRevenue error:', error);
    return 0;
  }

  return (data || []).reduce(
    (sum: number, row: { total_price: number | null }) => sum + (row.total_price ?? 0),
    0
  );
}

export async function GET() {
  try {
    // Step 1: Authenticate with server client + requireAdmin
    const authClient = await createServerSupabaseClient();
    await requireAdmin(authClient);

    // Step 2: Mock mode — return static data immediately
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      return NextResponse.json(MOCK_RESPONSE);
    }

    // Step 3: Use service role client for data queries (bypasses RLS)
    const serviceClient = createServiceRoleClient();

    const now = new Date();
    const nowInBizTZ = toZonedTime(now, BUSINESS_TIMEZONE);

    // --- TODAY boundaries ---
    const { todayStart, todayEnd } = getTodayInBusinessTimezone();

    // --- YESTERDAY boundaries ---
    const yesterdayMidnight = new Date(
      nowInBizTZ.getFullYear(),
      nowInBizTZ.getMonth(),
      nowInBizTZ.getDate() - 1,
      0, 0, 0, 0
    );
    const yesterdayStart = fromZonedTime(yesterdayMidnight, BUSINESS_TIMEZONE).toISOString();
    const yesterdayEnd = todayStart; // yesterday ends where today begins

    // --- THIS WEEK boundaries (Monday 00:00 to now) ---
    const dayOfWeek = nowInBizTZ.getDay(); // 0=Sun, 1=Mon, ...
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisWeekMonday = new Date(
      nowInBizTZ.getFullYear(),
      nowInBizTZ.getMonth(),
      nowInBizTZ.getDate() - daysFromMonday,
      0, 0, 0, 0
    );
    const thisWeekStart = fromZonedTime(thisWeekMonday, BUSINESS_TIMEZONE).toISOString();
    const thisWeekEnd = now.toISOString();

    // --- LAST WEEK same range (Monday - same day last week) ---
    const lastWeekMonday = new Date(thisWeekMonday);
    lastWeekMonday.setDate(lastWeekMonday.getDate() - 7);
    const lastWeekStart = fromZonedTime(lastWeekMonday, BUSINESS_TIMEZONE).toISOString();
    const lastWeekEndDate = new Date(nowInBizTZ);
    lastWeekEndDate.setDate(lastWeekEndDate.getDate() - 7);
    const lastWeekEnd = fromZonedTime(
      new Date(
        lastWeekEndDate.getFullYear(),
        lastWeekEndDate.getMonth(),
        lastWeekEndDate.getDate(),
        lastWeekEndDate.getHours(),
        lastWeekEndDate.getMinutes(),
        lastWeekEndDate.getSeconds()
      ),
      BUSINESS_TIMEZONE
    ).toISOString();

    // --- THIS MONTH boundaries (1st of month 00:00 to now) ---
    const thisMonthFirst = new Date(
      nowInBizTZ.getFullYear(),
      nowInBizTZ.getMonth(),
      1,
      0, 0, 0, 0
    );
    const thisMonthStart = fromZonedTime(thisMonthFirst, BUSINESS_TIMEZONE).toISOString();
    const thisMonthEnd = now.toISOString();

    // --- LAST MONTH same day range ---
    const lastMonthFirst = new Date(
      nowInBizTZ.getFullYear(),
      nowInBizTZ.getMonth() - 1,
      1,
      0, 0, 0, 0
    );
    const lastMonthStart = fromZonedTime(lastMonthFirst, BUSINESS_TIMEZONE).toISOString();
    const lastMonthEndDate = new Date(
      nowInBizTZ.getFullYear(),
      nowInBizTZ.getMonth() - 1,
      nowInBizTZ.getDate(),
      nowInBizTZ.getHours(),
      nowInBizTZ.getMinutes(),
      nowInBizTZ.getSeconds()
    );
    const lastMonthEnd = fromZonedTime(lastMonthEndDate, BUSINESS_TIMEZONE).toISOString();

    // --- Parallel queries ---
    const [
      todayCompleted,
      todayPending,
      yesterdayTotal,
      thisWeekTotal,
      lastWeekTotal,
      thisMonthTotal,
      lastMonthTotal,
    ] = await Promise.all([
      sumRevenue(serviceClient, todayStart, todayEnd, ['completed']),
      sumRevenue(serviceClient, todayStart, todayEnd, ['pending', 'confirmed', 'in_progress']),
      sumRevenue(serviceClient, yesterdayStart, yesterdayEnd),
      sumRevenue(serviceClient, thisWeekStart, thisWeekEnd),
      sumRevenue(serviceClient, lastWeekStart, lastWeekEnd),
      sumRevenue(serviceClient, thisMonthStart, thisMonthEnd),
      sumRevenue(serviceClient, lastMonthStart, lastMonthEnd),
    ]);

    const response: RevenueOverviewResponse = {
      today: {
        completed: todayCompleted,
        pending: todayPending,
        total: todayCompleted + todayPending,
        changePercent: computeChangePercent(todayCompleted + todayPending, yesterdayTotal),
      },
      thisWeek: {
        total: thisWeekTotal,
        changePercent: computeChangePercent(thisWeekTotal, lastWeekTotal),
      },
      thisMonth: {
        total: thisMonthTotal,
        changePercent: computeChangePercent(thisMonthTotal, lastMonthTotal),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Revenue Overview] Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch revenue overview' },
      { status: 500 }
    );
  }
}
