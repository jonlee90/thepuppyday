/**
 * Customer Analytics API Route
 * GET /api/admin/analytics/charts/customers
 * Task 0054: Fetch customer type and retention data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

/**
 * GET /api/admin/analytics/charts/customers
 * Fetch customer analytics including types and retention
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

    // Check if we're in mock mode (return mock data without auth check for development)
    const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

    if (useMocks) {
      // Generate mock customer data
      const mockData = {
        customerTypes: [
          { name: 'New Customers', value: 42 },
          { name: 'Returning Customers', value: 85 },
        ],
        retentionMetrics: {
          retentionData: [
            { period: 'Week 1', rate: 65 },
            { period: 'Week 2', rate: 68 },
            { period: 'Week 3', rate: 72 },
            { period: 'Week 4', rate: 70 },
          ],
          lifetimeValue: 1250,
          churnRate: 15.3,
        },
      };

      return NextResponse.json({ data: mockData });
    }

    // Production implementation - require admin auth
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Fetch all appointments in the period
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: appointments, error: apptError } = await (supabase as any)
      .from('appointments')
      .select('customer_id, scheduled_at, total_price')
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString())
      .in('status', ['completed', 'confirmed']);

    if (apptError) {
      throw new Error('Failed to fetch appointments');
    }

    // Calculate customer types (new vs returning)
    const customerFirstAppointments: Record<string, string> = {};
    const customerCounts: Record<string, number> = {};

    // Get all customers' first appointment ever
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allAppointments } = await (supabase as any)
      .from('appointments')
      .select('customer_id, scheduled_at')
      .in('status', ['completed', 'confirmed'])
      .order('scheduled_at', { ascending: true });

    (allAppointments || []).forEach((apt: any) => {
      if (!customerFirstAppointments[apt.customer_id]) {
        customerFirstAppointments[apt.customer_id] = apt.scheduled_at;
      }
    });

    // Categorize customers in current period
    let newCustomers = 0;
    let returningCustomers = 0;

    (appointments || []).forEach((apt: any) => {
      if (!customerCounts[apt.customer_id]) {
        customerCounts[apt.customer_id] = 0;

        // Check if first appointment was in this period
        const firstAppt = new Date(customerFirstAppointments[apt.customer_id]);
        if (firstAppt >= startDate && firstAppt <= endDate) {
          newCustomers++;
        } else {
          returningCustomers++;
        }
      }
      customerCounts[apt.customer_id]++;
    });

    const customerTypes = [
      { name: 'New Customers', value: newCustomers },
      { name: 'Returning Customers', value: returningCustomers },
    ];

    // Calculate retention metrics
    // Group by week or month
    const periodLength = endDate.getTime() - startDate.getTime();
    const days = Math.ceil(periodLength / (1000 * 60 * 60 * 24));
    const useWeeks = days <= 90;

    const retentionByPeriod: Record<string, { total: number; retained: number }> = {};

    (appointments || []).forEach((apt: any) => {
      const date = new Date(apt.scheduled_at);
      let periodKey: string;

      if (useWeeks) {
        const weekNum = Math.floor(
          (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
        );
        periodKey = `Week ${weekNum + 1}`;
      } else {
        periodKey = date.toLocaleDateString('en-US', { month: 'short' });
      }

      if (!retentionByPeriod[periodKey]) {
        retentionByPeriod[periodKey] = { total: 0, retained: 0 };
      }

      retentionByPeriod[periodKey].total++;
      if (customerCounts[apt.customer_id] >= 2) {
        retentionByPeriod[periodKey].retained++;
      }
    });

    const retentionData = Object.entries(retentionByPeriod).map(([period, data]) => ({
      period,
      rate: data.total > 0 ? (data.retained / data.total) * 100 : 0,
    }));

    // Calculate customer lifetime value
    const totalRevenue = (appointments || []).reduce(
      (sum: number, apt: any) => sum + (apt.total_price || 0),
      0
    );
    const uniqueCustomers = Object.keys(customerCounts).length;
    const lifetimeValue = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;

    // Calculate churn rate (customers who didn't return in this period)
    const totalCustomersEver = Object.keys(customerFirstAppointments).length;
    const activeCustomers = uniqueCustomers;
    const churnRate =
      totalCustomersEver > 0 ? ((totalCustomersEver - activeCustomers) / totalCustomersEver) * 100 : 0;

    const responseData = {
      customerTypes,
      retentionMetrics: {
        retentionData,
        lifetimeValue: Math.round(lifetimeValue),
        churnRate: Math.round(churnRate * 10) / 10,
      },
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
