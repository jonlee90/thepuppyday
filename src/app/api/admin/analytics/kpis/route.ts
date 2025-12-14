/**
 * KPI Analytics API Route
 * GET /api/admin/analytics/kpis
 * Task 0050: Fetch key performance indicators
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

/**
 * GET /api/admin/analytics/kpis
 * Fetch KPI metrics for date range
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json({ error: 'Start and end dates required' }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate.getTime());

    // Check if we're in mock mode
    const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

    if (useMocks) {
      // Return mock KPI data
      const mockData = {
        total_revenue: {
          label: 'Total Revenue',
          value: 45280,
          change: 12.5,
          previous: 40249,
          format: 'currency',
        },
        total_appointments: {
          label: 'Total Appointments',
          value: 127,
          change: 8.2,
          previous: 117,
          format: 'number',
        },
        avg_booking_value: {
          label: 'Avg Booking Value',
          value: 356,
          change: 3.8,
          previous: 343,
          format: 'currency',
        },
        retention_rate: {
          label: 'Retention Rate',
          value: 68.5,
          change: 5.1,
          previous: 65.2,
          format: 'percentage',
        },
        review_generation_rate: {
          label: 'Review Generation',
          value: 42.3,
          change: -2.4,
          previous: 43.4,
          format: 'percentage',
        },
        waitlist_fill_rate: {
          label: 'Waitlist Fill Rate',
          value: 85.7,
          change: 7.8,
          previous: 79.5,
          format: 'percentage',
        },
      };

      return NextResponse.json({ data: mockData });
    }

    // Production implementation
    // Calculate total revenue for current and previous periods
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentRevenue } = await (supabase as any)
      .from('appointments')
      .select('total_price')
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString())
      .in('status', ['completed', 'confirmed']);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prevRevenue } = await (supabase as any)
      .from('appointments')
      .select('total_price')
      .gte('scheduled_at', prevStartDate.toISOString())
      .lte('scheduled_at', prevEndDate.toISOString())
      .in('status', ['completed', 'confirmed']);

    const totalRevenueCurrent = currentRevenue?.reduce(
      (sum: number, apt: any) => sum + (apt.total_price || 0),
      0
    ) || 0;
    const totalRevenuePrev = prevRevenue?.reduce(
      (sum: number, apt: any) => sum + (apt.total_price || 0),
      0
    ) || 0;
    const revenueChange =
      totalRevenuePrev > 0 ? ((totalRevenueCurrent - totalRevenuePrev) / totalRevenuePrev) * 100 : 0;

    // Calculate total appointments
    const totalAppointmentsCurrent = currentRevenue?.length || 0;
    const totalAppointmentsPrev = prevRevenue?.length || 0;
    const appointmentsChange =
      totalAppointmentsPrev > 0
        ? ((totalAppointmentsCurrent - totalAppointmentsPrev) / totalAppointmentsPrev) * 100
        : 0;

    // Calculate average booking value
    const avgBookingCurrent = totalAppointmentsCurrent > 0 ? totalRevenueCurrent / totalAppointmentsCurrent : 0;
    const avgBookingPrev = totalAppointmentsPrev > 0 ? totalRevenuePrev / totalAppointmentsPrev : 0;
    const avgBookingChange =
      avgBookingPrev > 0 ? ((avgBookingCurrent - avgBookingPrev) / avgBookingPrev) * 100 : 0;

    // Calculate retention rate (customers with 2+ appointments)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: customers } = await (supabase as any)
      .from('appointments')
      .select('customer_id')
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString())
      .in('status', ['completed', 'confirmed']);

    const customerCounts = customers?.reduce((acc: Record<string, number>, apt: any) => {
      acc[apt.customer_id] = (acc[apt.customer_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const returningCustomers = (Object.values(customerCounts) as number[]).filter(count => count >= 2).length;
    const totalCustomers = Object.keys(customerCounts).length;
    const retentionRateCurrent = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    // Similar calculation for previous period
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prevCustomers } = await (supabase as any)
      .from('appointments')
      .select('customer_id')
      .gte('scheduled_at', prevStartDate.toISOString())
      .lte('scheduled_at', prevEndDate.toISOString())
      .in('status', ['completed', 'confirmed']);

    const prevCustomerCounts = prevCustomers?.reduce((acc: Record<string, number>, apt: any) => {
      acc[apt.customer_id] = (acc[apt.customer_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const prevReturningCustomers = (Object.values(prevCustomerCounts) as number[]).filter(count => count >= 2).length;
    const prevTotalCustomers = Object.keys(prevCustomerCounts).length;
    const retentionRatePrev = prevTotalCustomers > 0 ? (prevReturningCustomers / prevTotalCustomers) * 100 : 0;
    const retentionChange =
      retentionRatePrev > 0 ? ((retentionRateCurrent - retentionRatePrev) / retentionRatePrev) * 100 : 0;

    // Review generation rate (appointments with review_submitted)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reviewAppointments } = await (supabase as any)
      .from('appointments')
      .select('review_submitted')
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString())
      .eq('status', 'completed');

    const reviewCount = reviewAppointments?.filter((apt: any) => apt.review_submitted).length || 0;
    const reviewGenRateCurrent = reviewAppointments?.length > 0 ? (reviewCount / reviewAppointments.length) * 100 : 0;

    // Similar for previous period
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prevReviewAppointments } = await (supabase as any)
      .from('appointments')
      .select('review_submitted')
      .gte('scheduled_at', prevStartDate.toISOString())
      .lte('scheduled_at', prevEndDate.toISOString())
      .eq('status', 'completed');

    const prevReviewCount = prevReviewAppointments?.filter((apt: any) => apt.review_submitted).length || 0;
    const reviewGenRatePrev =
      prevReviewAppointments?.length > 0 ? (prevReviewCount / prevReviewAppointments.length) * 100 : 0;
    const reviewGenChange =
      reviewGenRatePrev > 0 ? ((reviewGenRateCurrent - reviewGenRatePrev) / reviewGenRatePrev) * 100 : 0;

    // Waitlist fill rate (waitlist entries converted to appointments)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: waitlistEntries } = await (supabase as any)
      .from('waitlist')
      .select('appointment_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const waitlistFilled = waitlistEntries?.filter((entry: any) => entry.appointment_id !== null).length || 0;
    const waitlistTotal = waitlistEntries?.length || 0;
    const waitlistFillRateCurrent = waitlistTotal > 0 ? (waitlistFilled / waitlistTotal) * 100 : 0;

    // Similar for previous period
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prevWaitlistEntries } = await (supabase as any)
      .from('waitlist')
      .select('appointment_id')
      .gte('created_at', prevStartDate.toISOString())
      .lte('created_at', prevEndDate.toISOString());

    const prevWaitlistFilled = prevWaitlistEntries?.filter((entry: any) => entry.appointment_id !== null).length || 0;
    const prevWaitlistTotal = prevWaitlistEntries?.length || 0;
    const waitlistFillRatePrev = prevWaitlistTotal > 0 ? (prevWaitlistFilled / prevWaitlistTotal) * 100 : 0;
    const waitlistFillChange =
      waitlistFillRatePrev > 0
        ? ((waitlistFillRateCurrent - waitlistFillRatePrev) / waitlistFillRatePrev) * 100
        : 0;

    const kpiData = {
      total_revenue: {
        label: 'Total Revenue',
        value: totalRevenueCurrent,
        change: revenueChange,
        previous: totalRevenuePrev,
        format: 'currency',
      },
      total_appointments: {
        label: 'Total Appointments',
        value: totalAppointmentsCurrent,
        change: appointmentsChange,
        previous: totalAppointmentsPrev,
        format: 'number',
      },
      avg_booking_value: {
        label: 'Avg Booking Value',
        value: avgBookingCurrent,
        change: avgBookingChange,
        previous: avgBookingPrev,
        format: 'currency',
      },
      retention_rate: {
        label: 'Retention Rate',
        value: retentionRateCurrent,
        change: retentionChange,
        previous: retentionRatePrev,
        format: 'percentage',
      },
      review_generation_rate: {
        label: 'Review Generation',
        value: reviewGenRateCurrent,
        change: reviewGenChange,
        previous: reviewGenRatePrev,
        format: 'percentage',
      },
      waitlist_fill_rate: {
        label: 'Waitlist Fill Rate',
        value: waitlistFillRateCurrent,
        change: waitlistFillChange,
        previous: waitlistFillRatePrev,
        format: 'percentage',
      },
    };

    return NextResponse.json({ data: kpiData });
  } catch (error) {
    console.error('Error fetching KPI analytics:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
