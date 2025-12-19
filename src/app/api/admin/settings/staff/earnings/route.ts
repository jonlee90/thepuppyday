/**
 * Admin Staff Earnings Report API Route
 * GET /api/admin/settings/staff/earnings - Generate earnings report
 * Task 0209: Earnings Report API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { Appointment, StaffCommission, User, Payment } from '@/types/database';

interface EarningsReportResponse {
  summary: {
    total_services: number;
    total_revenue: number;
    total_commission: number;
    total_tips: number;
  };
  by_groomer: Array<{
    groomer_id: string;
    groomer_name: string;
    services_count: number;
    revenue: number;
    commission: number;
    tips: number;
  }>;
  timeline: Array<{
    period: string;
    services_count: number;
    revenue: number;
    commission: number;
  }>;
}

/**
 * Calculate commission for a single appointment based on commission settings
 */
function calculateCommission(
  appointment: any,
  commissionSettings: StaffCommission | null
): number {
  if (!commissionSettings) {
    return 0;
  }

  let baseAmount = appointment.total_price;

  // Optionally exclude addons
  if (!commissionSettings.include_addons) {
    // In a real implementation, we would subtract addon prices
    // For now, we use the total_price as is
    baseAmount = appointment.total_price;
  }

  // Check for service-specific override
  if (commissionSettings.service_overrides && commissionSettings.service_overrides.length > 0) {
    const override = commissionSettings.service_overrides.find(
      (so) => so.service_id === appointment.service_id
    );

    if (override) {
      if (commissionSettings.rate_type === 'percentage') {
        return (baseAmount * override.rate) / 100;
      } else {
        return override.rate;
      }
    }
  }

  // Apply default rate
  if (commissionSettings.rate_type === 'percentage') {
    return (baseAmount * commissionSettings.rate) / 100;
  } else {
    // flat_rate
    return commissionSettings.rate;
  }
}

/**
 * Group appointments by period for timeline
 */
function groupByPeriod(
  appointments: any[],
  groupBy: 'day' | 'week' | 'month',
  commissionsMap: Map<string, StaffCommission>
): Array<{ period: string; services_count: number; revenue: number; commission: number }> {
  const periodMap = new Map<string, { services_count: number; revenue: number; commission: number }>();

  for (const apt of appointments) {
    const date = new Date(apt.scheduled_at);
    let periodKey: string;

    if (groupBy === 'day') {
      periodKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (groupBy === 'week') {
      // Get week start (Sunday)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      periodKey = weekStart.toISOString().split('T')[0];
    } else {
      // month
      periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    const commission = calculateCommission(apt, commissionsMap.get(apt.groomer_id) || null);

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        services_count: 0,
        revenue: 0,
        commission: 0,
      });
    }

    const period = periodMap.get(periodKey)!;
    period.services_count++;
    period.revenue += apt.total_price;
    period.commission += commission;
  }

  // Convert to array and sort by period
  return Array.from(periodMap.entries())
    .map(([period, stats]) => ({ period, ...stats }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const groomerId = searchParams.get('groomer_id') || null;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const groupBy = (searchParams.get('group_by') || 'day') as 'day' | 'week' | 'month';

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    console.log('[Earnings API] GET - Filters:', {
      groomerId,
      startDate,
      endDate,
      groupBy,
    });

    // In mock mode, query from mock store
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();

      // Get all appointments in date range
      let appointments = store.select('appointments', {}) as any[];

      // Filter by date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      appointments = appointments.filter((apt: any) => {
        const aptDate = new Date(apt.scheduled_at);
        return aptDate >= start && aptDate <= end && apt.status === 'completed';
      });

      // Filter by groomer if specified
      if (groomerId) {
        appointments = appointments.filter((apt: any) => apt.groomer_id === groomerId);
      }

      console.log('[Earnings API] Found', appointments.length, 'appointments in range');

      // Get all commission settings
      const commissions = store.select('staff_commissions', {}) as unknown as StaffCommission[];
      const commissionsMap = new Map<string, StaffCommission>();
      commissions.forEach((c) => {
        commissionsMap.set(c.groomer_id, c);
      });

      // Get all payments for tips
      const payments = store.select('payments', {}) as unknown as Payment[];
      const appointmentTips = new Map<string, number>();
      payments.forEach((p) => {
        if (p.appointment_id) {
          appointmentTips.set(p.appointment_id, p.tip_amount || 0);
        }
      });

      // Calculate summary
      let total_services = appointments.length;
      let total_revenue = 0;
      let total_commission = 0;
      let total_tips = 0;

      const groomerStats = new Map<string, {
        groomer_id: string;
        groomer_name: string;
        services_count: number;
        revenue: number;
        commission: number;
        tips: number;
      }>();

      for (const apt of appointments) {
        const revenue = apt.total_price;
        const commission = calculateCommission(apt, commissionsMap.get(apt.groomer_id) || null);
        const tips = appointmentTips.get(apt.id) || 0;

        total_revenue += revenue;
        total_commission += commission;
        total_tips += tips;

        // Group by groomer
        if (apt.groomer_id) {
          if (!groomerStats.has(apt.groomer_id)) {
            const groomer = store.selectById('users', apt.groomer_id) as User | null;
            groomerStats.set(apt.groomer_id, {
              groomer_id: apt.groomer_id,
              groomer_name: groomer ? `${groomer.first_name} ${groomer.last_name}` : 'Unknown',
              services_count: 0,
              revenue: 0,
              commission: 0,
              tips: 0,
            });
          }

          const stats = groomerStats.get(apt.groomer_id)!;
          stats.services_count++;
          stats.revenue += revenue;
          stats.commission += commission;
          stats.tips += tips;
        }
      }

      // Generate timeline
      const timeline = groupByPeriod(appointments, groupBy, commissionsMap);

      const response: EarningsReportResponse = {
        summary: {
          total_services,
          total_revenue: Math.round(total_revenue * 100) / 100,
          total_commission: Math.round(total_commission * 100) / 100,
          total_tips: Math.round(total_tips * 100) / 100,
        },
        by_groomer: Array.from(groomerStats.values()).map((stats) => ({
          ...stats,
          revenue: Math.round(stats.revenue * 100) / 100,
          commission: Math.round(stats.commission * 100) / 100,
          tips: Math.round(stats.tips * 100) / 100,
        })),
        timeline: timeline.map((t) => ({
          ...t,
          revenue: Math.round(t.revenue * 100) / 100,
          commission: Math.round(t.commission * 100) / 100,
        })),
      };

      console.log('[Earnings API] Returning earnings report:', {
        total_services,
        total_revenue: response.summary.total_revenue,
        total_commission: response.summary.total_commission,
        groomers: response.by_groomer.length,
        timeline_periods: response.timeline.length,
      });

      return NextResponse.json({ data: response });
    }

    // Production Supabase query
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build query for appointments
    let query = (supabase as any)
      .from('appointments')
      .select(`
        *,
        groomer:users!groomer_id(id, first_name, last_name)
      `)
      .eq('status', 'completed')
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString());

    if (groomerId) {
      query = query.eq('groomer_id', groomerId);
    }

    const { data: appointments, error: appointmentsError } = await query;

    if (appointmentsError) {
      console.error('[Earnings API] Error fetching appointments:', appointmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    console.log('[Earnings API] Found', appointments?.length || 0, 'appointments in range');

    // Get all commission settings
    const { data: commissions } = await (supabase as any)
      .from('staff_commissions')
      .select('*');

    const commissionsMap = new Map<string, StaffCommission>();
    (commissions || []).forEach((c: StaffCommission) => {
      commissionsMap.set(c.groomer_id, c);
    });

    // Get all payments for tips
    const appointmentIds = (appointments || []).map((apt: any) => apt.id);
    const { data: payments } = await (supabase as any)
      .from('payments')
      .select('appointment_id, tip_amount')
      .in('appointment_id', appointmentIds);

    const appointmentTips = new Map<string, number>();
    (payments || []).forEach((p: any) => {
      if (p.appointment_id) {
        appointmentTips.set(p.appointment_id, p.tip_amount || 0);
      }
    });

    // Calculate summary
    let total_services = appointments?.length || 0;
    let total_revenue = 0;
    let total_commission = 0;
    let total_tips = 0;

    const groomerStats = new Map<string, {
      groomer_id: string;
      groomer_name: string;
      services_count: number;
      revenue: number;
      commission: number;
      tips: number;
    }>();

    for (const apt of appointments || []) {
      const revenue = apt.total_price;
      const commission = calculateCommission(apt, commissionsMap.get(apt.groomer_id) || null);
      const tips = appointmentTips.get(apt.id) || 0;

      total_revenue += revenue;
      total_commission += commission;
      total_tips += tips;

      // Group by groomer
      if (apt.groomer_id && apt.groomer) {
        if (!groomerStats.has(apt.groomer_id)) {
          groomerStats.set(apt.groomer_id, {
            groomer_id: apt.groomer_id,
            groomer_name: `${apt.groomer.first_name} ${apt.groomer.last_name}`,
            services_count: 0,
            revenue: 0,
            commission: 0,
            tips: 0,
          });
        }

        const stats = groomerStats.get(apt.groomer_id)!;
        stats.services_count++;
        stats.revenue += revenue;
        stats.commission += commission;
        stats.tips += tips;
      }
    }

    // Generate timeline
    const timeline = groupByPeriod(appointments || [], groupBy, commissionsMap);

    const response: EarningsReportResponse = {
      summary: {
        total_services,
        total_revenue: Math.round(total_revenue * 100) / 100,
        total_commission: Math.round(total_commission * 100) / 100,
        total_tips: Math.round(total_tips * 100) / 100,
      },
      by_groomer: Array.from(groomerStats.values()).map((stats) => ({
        ...stats,
        revenue: Math.round(stats.revenue * 100) / 100,
        commission: Math.round(stats.commission * 100) / 100,
        tips: Math.round(stats.tips * 100) / 100,
      })),
      timeline: timeline.map((t) => ({
        ...t,
        revenue: Math.round(t.revenue * 100) / 100,
        commission: Math.round(t.commission * 100) / 100,
      })),
    };

    console.log('[Earnings API] Returning earnings report:', {
      total_services,
      total_revenue: response.summary.total_revenue,
      total_commission: response.summary.total_commission,
      groomers: response.by_groomer.length,
      timeline_periods: response.timeline.length,
    });

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('[Earnings API] Error in GET route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
