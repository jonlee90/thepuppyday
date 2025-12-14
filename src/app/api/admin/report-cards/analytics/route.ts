/**
 * Report Card Analytics API Route
 * Task 0024: GET /api/admin/report-cards/analytics
 * Returns engagement metrics for report cards
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import {
  getReportCardEngagement,
  getAllReportCardsEngagement,
} from '@/lib/admin/report-card-analytics';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const reportCardId = searchParams.get('reportCardId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // If reportCardId is provided, return single report card engagement
    if (reportCardId) {
      const engagement = await getReportCardEngagement(supabase, reportCardId);

      if (!engagement) {
        return NextResponse.json(
          { error: 'Report card not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        data: engagement,
      });
    }

    // Otherwise, return aggregated stats for date range
    let dateRange: { start: Date; end: Date } | undefined;

    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    const aggregatedStats = await getAllReportCardsEngagement(supabase, dateRange);

    return NextResponse.json({
      data: aggregatedStats,
    });
  } catch (error) {
    console.error('[Admin API] Error in report-cards/analytics route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
