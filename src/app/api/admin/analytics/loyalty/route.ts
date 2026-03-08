/**
 * Loyalty Analytics API Route
 * GET /api/admin/analytics/loyalty
 * Fetch loyalty program metrics and punch card data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Generate mock trend data for the given date range
 */
function generateMockTrends(startDate: Date, endDate: Date) {
  const trends = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    trends.push({
      date: current.toISOString().split('T')[0],
      punches: Math.floor(Math.random() * 12) + 3,
      redemptions: Math.floor(Math.random() * 3),
    });
    current.setDate(current.getDate() + 7);
  }
  return trends;
}

/**
 * GET /api/admin/analytics/loyalty
 * Fetch loyalty program analytics
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

    // Mock mode - return sample data for development
    if (config.useMocks) {
      const mockData = {
        activePrograms: 23,
        totalPunchesEarned: 187,
        totalRedemptions: 12,
        redemptionRate: 6.4,
        punchDistribution: [
          { punches: 1, count: 15 },
          { punches: 2, count: 12 },
          { punches: 3, count: 9 },
          { punches: 4, count: 8 },
          { punches: 5, count: 7 },
          { punches: 6, count: 5 },
          { punches: 7, count: 4 },
          { punches: 8, count: 3 },
          { punches: 9, count: 2 },
          { punches: 10, count: 1 },
        ],
        trends: generateMockTrends(startDate, endDate),
        topCustomers: [
          { name: 'Sarah Johnson', punches: 18, redemptions: 2 },
          { name: 'Mike Chen', punches: 15, redemptions: 1 },
          { name: 'Emily Davis', punches: 12, redemptions: 1 },
          { name: 'Carlos Rodriguez', punches: 10, redemptions: 1 },
          { name: 'Lisa Kim', punches: 9, redemptions: 0 },
        ],
      };

      return NextResponse.json({ data: mockData });
    }

    // Production - require admin auth
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();
    await requireAdmin(supabase);

    // Actual tables: loyalty_points (customer_id, points_balance, lifetime_points)
    //                loyalty_transactions (customer_id, points, type, reference_type, created_at)

    // Fetch all loyalty accounts (active programs)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: loyaltyAccounts, error: accountsError } = await (serviceClient as any)
      .from('loyalty_points')
      .select('customer_id, points_balance, lifetime_points');

    if (accountsError) {
      console.error('[Loyalty API] Accounts query error:', accountsError);
      throw new Error('Failed to fetch loyalty accounts');
    }

    // Fetch transactions in date range
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: transactions, error: txError } = await (serviceClient as any)
      .from('loyalty_transactions')
      .select('id, customer_id, points, type, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (txError) {
      console.error('[Loyalty API] Transactions query error:', txError);
      throw new Error('Failed to fetch loyalty transactions');
    }

    // Separate earned (positive points) vs redeemed (negative points or type='redeem')
    const earned = (transactions || []).filter((t: { points: number; type: string | null }) =>
      t.points > 0 || t.type === 'earn'
    );
    const redeemed = (transactions || []).filter((t: { points: number; type: string | null }) =>
      t.points < 0 || t.type === 'redeem' || t.type === 'redemption'
    );

    const totalPunchesEarned = earned.length;
    const totalRedemptions = redeemed.length;
    const activePrograms = (loyaltyAccounts || []).filter(
      (a: { points_balance: number | null }) => (a.points_balance ?? 0) > 0
    ).length;
    const redemptionRate = totalPunchesEarned > 0
      ? parseFloat(((totalRedemptions / totalPunchesEarned) * 100).toFixed(1))
      : 0;

    // Punch distribution - count how many customers have X points balance
    const punchCounts: Record<number, number> = {};
    (loyaltyAccounts || []).forEach((acct: { points_balance: number | null }) => {
      const p = Math.min(acct.points_balance ?? 0, 10);
      if (p > 0) punchCounts[p] = (punchCounts[p] || 0) + 1;
    });

    const punchDistribution = [];
    for (let i = 1; i <= 10; i++) {
      punchDistribution.push({ punches: i, count: punchCounts[i] || 0 });
    }

    // Trends - group earned and redeemed by week
    const trendMap: Record<string, { punches: number; redemptions: number }> = {};

    earned.forEach((t: { created_at: string }) => {
      const date = new Date(t.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().split('T')[0];
      if (!trendMap[key]) trendMap[key] = { punches: 0, redemptions: 0 };
      trendMap[key].punches++;
    });

    redeemed.forEach((t: { created_at: string }) => {
      const date = new Date(t.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().split('T')[0];
      if (!trendMap[key]) trendMap[key] = { punches: 0, redemptions: 0 };
      trendMap[key].redemptions++;
    });

    const trends = Object.entries(trendMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top customers - aggregate by customer_id
    const customerMap: Record<string, { punches: number; redemptions: number }> = {};

    earned.forEach((t: { customer_id: string }) => {
      if (!customerMap[t.customer_id]) customerMap[t.customer_id] = { punches: 0, redemptions: 0 };
      customerMap[t.customer_id].punches++;
    });

    redeemed.forEach((t: { customer_id: string }) => {
      if (!customerMap[t.customer_id]) customerMap[t.customer_id] = { punches: 0, redemptions: 0 };
      customerMap[t.customer_id].redemptions++;
    });

    // Get top 5 by punches
    const topCustomerIds = Object.entries(customerMap)
      .sort((a, b) => b[1].punches - a[1].punches)
      .slice(0, 5)
      .map(([customerId]) => customerId);

    // Fetch user names
    let topCustomers: { name: string; punches: number; redemptions: number }[] = [];
    if (topCustomerIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: users } = await (serviceClient as any)
        .from('users')
        .select('id, full_name')
        .in('id', topCustomerIds);

      const nameMap: Record<string, string> = {};
      (users || []).forEach((u: { id: string; full_name: string }) => {
        nameMap[u.id] = u.full_name || 'Unknown';
      });

      topCustomers = topCustomerIds.map((customerId) => ({
        name: nameMap[customerId] || 'Unknown',
        punches: customerMap[customerId].punches,
        redemptions: customerMap[customerId].redemptions,
      }));
    }

    return NextResponse.json({
      data: {
        activePrograms,
        totalPunchesEarned,
        totalRedemptions,
        redemptionRate,
        punchDistribution,
        trends,
        topCustomers,
      },
    });
  } catch (error) {
    console.error('[Loyalty API] Error:', error);

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
