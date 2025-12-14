/**
 * Service Popularity Analytics API Route
 * GET /api/admin/analytics/charts/services
 * Task 0053: Fetch service popularity data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

/**
 * GET /api/admin/analytics/charts/services
 * Fetch service popularity data with counts and revenue
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

    // Check if we're in mock mode
    const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

    if (useMocks) {
      // Generate mock service data
      const mockServices = [
        { name: 'Basic Grooming', count: 45, revenue: 2700, avgPrice: 60 },
        { name: 'Premium Grooming', count: 32, revenue: 3200, avgPrice: 100 },
        { name: 'Puppy Package', count: 18, revenue: 1260, avgPrice: 70 },
        { name: 'Senior Care', count: 12, revenue: 960, avgPrice: 80 },
        { name: 'Spa Treatment', count: 8, revenue: 960, avgPrice: 120 },
      ];

      return NextResponse.json({ data: mockServices });
    }

    // Production implementation
    // Fetch all completed appointments with service details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: appointments, error: apptError } = await (supabase as any)
      .from('appointments')
      .select(
        `
        service_id,
        total_price,
        service:services(name)
      `
      )
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString())
      .eq('status', 'completed');

    if (apptError) {
      throw new Error('Failed to fetch appointments');
    }

    // Group by service
    const serviceMap: Record<
      string,
      {
        name: string;
        count: number;
        revenue: number;
      }
    > = {};

    (appointments || []).forEach((apt: any) => {
      const serviceId = apt.service_id;
      const serviceName = apt.service?.name || 'Unknown Service';

      if (!serviceMap[serviceId]) {
        serviceMap[serviceId] = {
          name: serviceName,
          count: 0,
          revenue: 0,
        };
      }

      serviceMap[serviceId].count += 1;
      serviceMap[serviceId].revenue += apt.total_price || 0;
    });

    // Convert to array and calculate averages
    const serviceData = Object.values(serviceMap).map((service) => ({
      name: service.name,
      count: service.count,
      revenue: Math.round(service.revenue),
      avgPrice: service.count > 0 ? Math.round(service.revenue / service.count) : 0,
    }));

    // Sort by count (descending)
    serviceData.sort((a, b) => b.count - a.count);

    return NextResponse.json({ data: serviceData });
  } catch (error) {
    console.error('Error fetching service popularity:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
