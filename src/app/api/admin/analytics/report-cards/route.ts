/**
 * Report Cards Analytics API Route
 * GET /api/admin/analytics/report-cards
 * Task 0052: Fetch report card engagement metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { ReportCard } from '@/types/database';

export const dynamic = 'force-dynamic';

interface ReportCardAnalyticsResponse {
  sent: number;
  opened: number;
  openRate: number;
  avgTimeToOpen: number;
  reviewed: number;
  reviewRate: number;
  avgRating: number;
  publicReviews: number;
  publicReviewRate: number;
  funnelData: Array<{
    stage: string;
    count: number;
    rate: number;
  }>;
}

/**
 * Calculate average time difference in hours between two dates
 */
function calculateAvgTimeToOpen(reportCards: ReportCard[]): number {
  const openedCards = reportCards.filter(
    (card) => card.sent_at && card.last_viewed_at
  );

  if (openedCards.length === 0) return 0;

  const totalHours = openedCards.reduce((sum, card) => {
    const sentAt = new Date(card.sent_at!).getTime();
    const openedAt = new Date(card.last_viewed_at!).getTime();
    const hours = (openedAt - sentAt) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);

  return Math.round((totalHours / openedCards.length) * 10) / 10;
}

/**
 * GET /api/admin/analytics/report-cards
 * Fetch report card engagement and review metrics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

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

    // Check if we're in mock mode
    const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

    if (useMocks) {
      // Generate mock report card analytics
      const mockData: ReportCardAnalyticsResponse = {
        sent: 156,
        opened: 124,
        openRate: 79.5,
        avgTimeToOpen: 4.2,
        reviewed: 89,
        reviewRate: 71.8,
        avgRating: 4.7,
        publicReviews: 67,
        publicReviewRate: 75.3,
        funnelData: [
          { stage: 'Sent', count: 156, rate: 100 },
          { stage: 'Opened', count: 124, rate: 79.5 },
          { stage: 'Reviewed', count: 89, rate: 71.8 },
          { stage: 'Public', count: 67, rate: 75.3 },
        ],
      };

      return NextResponse.json({ data: mockData });
    }

    // Production implementation
    // Fetch report cards within date range
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reportCards, error } = (await (supabase as any)
      .from('report_cards')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('is_draft', false)) as {
      data: ReportCard[] | null;
      error: Error | null;
    };

    if (error) {
      console.error('Error fetching report cards:', error);
      throw new Error('Failed to fetch report cards');
    }

    const cards = reportCards || [];

    // Calculate metrics
    const sent = cards.filter((card) => card.sent_at !== null).length;
    const opened = cards.filter((card) => card.last_viewed_at !== null).length;
    const openRate = sent > 0 ? Math.round((opened / sent) * 1000) / 10 : 0;

    const avgTimeToOpen = calculateAvgTimeToOpen(cards);

    const reviewed = cards.filter((card) => card.rating !== null).length;
    const reviewRate = opened > 0 ? Math.round((reviewed / opened) * 1000) / 10 : 0;

    const ratingsSum = cards.reduce(
      (sum, card) => sum + (card.rating || 0),
      0
    );
    const avgRating =
      reviewed > 0 ? Math.round((ratingsSum / reviewed) * 10) / 10 : 0;

    // Note: Assuming public reviews are those with rating >= 4
    // In production, you might have a separate field or join to a reviews table
    const publicReviews = cards.filter(
      (card) => card.rating !== null && card.rating >= 4
    ).length;
    const publicReviewRate =
      reviewed > 0 ? Math.round((publicReviews / reviewed) * 1000) / 10 : 0;

    // Build funnel data
    const funnelData = [
      { stage: 'Sent', count: sent, rate: 100 },
      { stage: 'Opened', count: opened, rate: openRate },
      { stage: 'Reviewed', count: reviewed, rate: reviewRate },
      { stage: 'Public', count: publicReviews, rate: publicReviewRate },
    ];

    const responseData: ReportCardAnalyticsResponse = {
      sent,
      opened,
      openRate,
      avgTimeToOpen,
      reviewed,
      reviewRate,
      avgRating,
      publicReviews,
      publicReviewRate,
      funnelData,
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('Error in report cards analytics:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
