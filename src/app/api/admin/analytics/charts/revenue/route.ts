/**
 * Revenue Analytics API Route
 * GET /api/admin/analytics/charts/revenue
 * Task 0052: Fetch revenue breakdown data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { config } from '@/lib/config';

/**
 * Determine period format based on date range
 */
function determinePeriodFormat(start: Date, end: Date): 'monthly' | 'quarterly' {
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return days > 180 ? 'quarterly' : 'monthly';
}

/**
 * Format period label
 */
function formatPeriod(date: Date, format: 'monthly' | 'quarterly'): string {
  if (format === 'monthly') {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } else {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${date.getFullYear()}`;
  }
}

/**
 * GET /api/admin/analytics/charts/revenue
 * Fetch revenue data with breakdown by category
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
    const periodFormat = determinePeriodFormat(startDate, endDate);

    // In mock mode, return mock data without auth check (for development)
    if (config.useMocks) {
      // Generate mock revenue data
      const mockData = [];
      const months = periodFormat === 'monthly' ? 6 : 4;

      for (let i = 0; i < months; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);

        const services = Math.floor(Math.random() * 15000) + 10000;
        const addons = Math.floor(Math.random() * 3000) + 1000;
        const memberships = Math.floor(Math.random() * 2000) + 500;
        const total = services + addons + memberships;
        const appointments = Math.floor(Math.random() * 50) + 30;

        mockData.push({
          period: formatPeriod(date, periodFormat),
          services,
          addons,
          memberships,
          avgBookingValue: Math.floor(total / appointments),
        });
      }

      return NextResponse.json({ data: mockData });
    }

    // Production implementation - require admin auth
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Fetch all completed appointments with basic data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: appointments, error: apptError } = await (supabase as any)
      .from('appointments')
      .select('id, scheduled_at, total_price, service_id')
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString())
      .eq('status', 'completed');

    if (apptError) {
      console.error('[Revenue API] Appointments query error:', apptError);
      throw new Error('Failed to fetch appointments');
    }

    // Fetch service prices for calculating breakdown
    const serviceIds = [...new Set((appointments || []).map((a: { service_id: string }) => a.service_id).filter(Boolean))];
    let servicesMap: Record<string, number> = {};

    if (serviceIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: services } = await (supabase as any)
        .from('services')
        .select('id, base_price')
        .in('id', serviceIds);

      servicesMap = (services || []).reduce((acc: Record<string, number>, s: { id: string; base_price: number }) => {
        acc[s.id] = s.base_price || 0;
        return acc;
      }, {});
    }

    // Fetch add-on totals for each appointment
    const appointmentIds = (appointments || []).map((a: { id: string }) => a.id);
    let addonsMap: Record<string, number> = {};

    if (appointmentIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: appointmentAddons } = await (supabase as any)
        .from('appointment_addons')
        .select('appointment_id, price')
        .in('appointment_id', appointmentIds);

      // Sum add-on prices per appointment
      (appointmentAddons || []).forEach((aa: { appointment_id: string; price: number }) => {
        addonsMap[aa.appointment_id] = (addonsMap[aa.appointment_id] || 0) + (aa.price || 0);
      });
    }

    // Group by period
    const periodData: Record<
      string,
      {
        services: number;
        addons: number;
        memberships: number;
        totalRevenue: number;
        appointmentCount: number;
      }
    > = {};

    (appointments || []).forEach((apt: { id: string; scheduled_at: string; total_price: number; service_id: string }) => {
      const date = new Date(apt.scheduled_at);
      const period = formatPeriod(date, periodFormat);

      if (!periodData[period]) {
        periodData[period] = {
          services: 0,
          addons: 0,
          memberships: 0,
          totalRevenue: 0,
          appointmentCount: 0,
        };
      }

      // Service revenue (base service price from our map)
      const servicePrice = servicesMap[apt.service_id] || 0;
      periodData[period].services += servicePrice;

      // Add-on revenue from our map
      const addonRevenue = addonsMap[apt.id] || 0;
      periodData[period].addons += addonRevenue;

      // Membership revenue (total - services - addons, assuming remainder is membership)
      const membershipRevenue = (apt.total_price || 0) - servicePrice - addonRevenue;
      if (membershipRevenue > 0) {
        periodData[period].memberships += membershipRevenue;
      }

      periodData[period].totalRevenue += apt.total_price || 0;
      periodData[period].appointmentCount += 1;
    });

    // Convert to chart data
    const chartData = Object.entries(periodData).map(([period, data]) => ({
      period,
      services: Math.round(data.services),
      addons: Math.round(data.addons),
      memberships: Math.round(data.memberships),
      avgBookingValue:
        data.appointmentCount > 0 ? Math.round(data.totalRevenue / data.appointmentCount) : 0,
    }));

    // Sort by period
    chartData.sort((a, b) => {
      const dateA = new Date(a.period);
      const dateB = new Date(b.period);
      return dateA.getTime() - dateB.getTime();
    });

    return NextResponse.json({ data: chartData });
  } catch (error) {
    console.error('[Revenue API] Error:', error);
    console.error('[Revenue API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
