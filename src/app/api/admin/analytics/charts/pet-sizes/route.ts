/**
 * Pet Sizes Analytics API Route
 * GET /api/admin/analytics/charts/pet-sizes
 * Fetch appointment distribution and revenue by pet size category
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics/charts/pet-sizes
 * Fetch pet size distribution with revenue
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
      const mockData = {
        sizes: [
          { size: 'Small (0-18 lbs)', count: 89, percentage: 36.3, revenue: 3560 },
          { size: 'Medium (19-35 lbs)', count: 78, percentage: 31.8, revenue: 4680 },
          { size: 'Large (36-65 lbs)', count: 52, percentage: 21.2, revenue: 4160 },
          { size: 'X-Large (66+ lbs)', count: 26, percentage: 10.6, revenue: 2860 },
        ],
      };

      return NextResponse.json({ data: mockData });
    }

    // Production - require admin auth
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Fetch appointments joined with pets to get size from the pet record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: appointments, error: apptError } = await (supabase as any)
      .from('appointments')
      .select('id, total_price, pets!inner(size)')
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString())
      .in('status', ['completed', 'confirmed', 'checked_in']);

    if (apptError) {
      console.error('[Pet Sizes API] Query error:', apptError);
      throw new Error('Failed to fetch appointments');
    }

    const sizeMap: Record<string, { count: number; revenue: number }> = {};
    const SIZE_LABELS: Record<string, string> = {
      small: 'Small (0-18 lbs)',
      medium: 'Medium (19-35 lbs)',
      large: 'Large (36-65 lbs)',
      xlarge: 'X-Large (66+ lbs)',
    };

    (appointments || []).forEach((apt: { pets: { size: string }; total_price: number }) => {
      const category = apt.pets?.size || 'medium';
      const label = SIZE_LABELS[category] || category;

      if (!sizeMap[label]) sizeMap[label] = { count: 0, revenue: 0 };
      sizeMap[label].count++;
      sizeMap[label].revenue += apt.total_price || 0;
    });

    const total = Object.values(sizeMap).reduce((sum, s) => sum + s.count, 0);

    // Build sizes array in order
    const orderedLabels = [
      'Small (0-18 lbs)',
      'Medium (19-35 lbs)',
      'Large (36-65 lbs)',
      'X-Large (66+ lbs)',
    ];

    const sizes = orderedLabels
      .filter((label) => sizeMap[label])
      .map((label) => ({
        size: label,
        count: sizeMap[label].count,
        percentage: total > 0 ? parseFloat(((sizeMap[label].count / total) * 100).toFixed(1)) : 0,
        revenue: Math.round(sizeMap[label].revenue),
      }));

    return NextResponse.json({
      data: { sizes },
    });
  } catch (error) {
    console.error('[Pet Sizes API] Error:', error);

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
