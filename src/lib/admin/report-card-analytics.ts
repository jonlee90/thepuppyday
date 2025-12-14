/**
 * Report Card Analytics & Engagement Tracking
 * Task 0024: Track customer engagement with report cards
 */

import type { AppSupabaseClient } from '@/lib/supabase/server';
import type { ReportCard } from '@/types/database';

export interface ReportCardEngagement {
  report_card_id: string;
  link_clicks: number;
  rating_submitted: boolean;
  public_review_generated: boolean;
  time_to_open_minutes: number | null;
  time_to_review_minutes: number | null;
  last_viewed_at: string | null;
  sent_at: string | null;
}

export interface AggregatedReportCardEngagement {
  total_report_cards: number;
  total_sent: number;
  total_viewed: number;
  total_rated: number;
  total_public_reviews: number;
  open_rate_percentage: number;
  review_rate_percentage: number;
  public_review_rate_percentage: number;
  avg_time_to_open_minutes: number | null;
  avg_time_to_review_minutes: number | null;
  date_range: {
    start: string;
    end: string;
  };
}

/**
 * Get engagement metrics for a single report card
 */
export async function getReportCardEngagement(
  supabase: AppSupabaseClient,
  reportCardId: string
): Promise<ReportCardEngagement | null> {
  try {
    // Get report card data
    const reportCardResult = await (supabase as any)
      .from('report_cards')
      .select('*')
      .eq('id', reportCardId)
      .single();

    if (reportCardResult.error || !reportCardResult.data) {
      console.error('[Analytics] Report card not found:', reportCardId);
      return null;
    }

    const reportCard: ReportCard = reportCardResult.data;

    // Get associated review if exists
    const reviewResult = await (supabase as any)
      .from('reviews')
      .select('rating, destination, created_at')
      .eq('report_card_id', reportCardId)
      .maybeSingle();

    const review = reviewResult.data;

    // Calculate time to open (in minutes)
    let timeToOpenMinutes: number | null = null;
    if (reportCard.sent_at && reportCard.last_viewed_at) {
      const sentTime = new Date(reportCard.sent_at).getTime();
      const viewedTime = new Date(reportCard.last_viewed_at).getTime();
      timeToOpenMinutes = Math.round((viewedTime - sentTime) / (1000 * 60));
    }

    // Calculate time to review (in minutes)
    let timeToReviewMinutes: number | null = null;
    if (reportCard.sent_at && review?.created_at) {
      const sentTime = new Date(reportCard.sent_at).getTime();
      const reviewTime = new Date(review.created_at).getTime();
      timeToReviewMinutes = Math.round((reviewTime - sentTime) / (1000 * 60));
    }

    return {
      report_card_id: reportCardId,
      link_clicks: reportCard.view_count || 0,
      rating_submitted: !!review,
      public_review_generated: review?.destination === 'google',
      time_to_open_minutes: timeToOpenMinutes,
      time_to_review_minutes: timeToReviewMinutes,
      last_viewed_at: reportCard.last_viewed_at,
      sent_at: reportCard.sent_at,
    };
  } catch (error) {
    console.error('[Analytics] Error getting report card engagement:', error);
    return null;
  }
}

/**
 * Get aggregated engagement statistics for all report cards in a date range
 */
export async function getAllReportCardsEngagement(
  supabase: AppSupabaseClient,
  dateRange?: { start: Date; end: Date }
): Promise<AggregatedReportCardEngagement> {
  try {
    const startDate = dateRange?.start || new Date('2020-01-01');
    const endDate = dateRange?.end || new Date();

    // Get all report cards in date range
    let query = (supabase as any)
      .from('report_cards')
      .select(`
        id,
        sent_at,
        last_viewed_at,
        view_count,
        created_at
      `);

    if (dateRange) {
      query = query
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
    }

    const reportCardsResult = await query;

    if (reportCardsResult.error) {
      throw reportCardsResult.error;
    }

    const reportCards: ReportCard[] = reportCardsResult.data || [];

    // Get all reviews in the same date range
    let reviewQuery = (supabase as any)
      .from('reviews')
      .select('report_card_id, destination, created_at');

    if (dateRange) {
      reviewQuery = reviewQuery
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
    }

    const reviewsResult = await reviewQuery;
    const reviews = reviewsResult.data || [];

    // Create a map of report_card_id -> review
    const reviewsByReportCard = new Map();
    reviews.forEach((review: any) => {
      reviewsByReportCard.set(review.report_card_id, review);
    });

    // Calculate metrics
    const totalReportCards = reportCards.length;
    const totalSent = reportCards.filter((rc) => rc.sent_at).length;
    const totalViewed = reportCards.filter((rc) => rc.last_viewed_at).length;
    const totalRated = reviews.length;
    const totalPublicReviews = reviews.filter((r: any) => r.destination === 'google').length;

    // Calculate rates
    const openRatePercentage = totalSent > 0 ? (totalViewed / totalSent) * 100 : 0;
    const reviewRatePercentage = totalSent > 0 ? (totalRated / totalSent) * 100 : 0;
    const publicReviewRatePercentage = totalSent > 0 ? (totalPublicReviews / totalSent) * 100 : 0;

    // Calculate average time to open
    const timesToOpen: number[] = [];
    reportCards.forEach((rc) => {
      if (rc.sent_at && rc.last_viewed_at) {
        const sentTime = new Date(rc.sent_at).getTime();
        const viewedTime = new Date(rc.last_viewed_at).getTime();
        const minutes = Math.round((viewedTime - sentTime) / (1000 * 60));
        if (minutes >= 0) {
          timesToOpen.push(minutes);
        }
      }
    });

    const avgTimeToOpenMinutes =
      timesToOpen.length > 0
        ? Math.round(timesToOpen.reduce((sum, t) => sum + t, 0) / timesToOpen.length)
        : null;

    // Calculate average time to review
    const timesToReview: number[] = [];
    reportCards.forEach((rc) => {
      const review = reviewsByReportCard.get(rc.id);
      if (rc.sent_at && review?.created_at) {
        const sentTime = new Date(rc.sent_at).getTime();
        const reviewTime = new Date(review.created_at).getTime();
        const minutes = Math.round((reviewTime - sentTime) / (1000 * 60));
        if (minutes >= 0) {
          timesToReview.push(minutes);
        }
      }
    });

    const avgTimeToReviewMinutes =
      timesToReview.length > 0
        ? Math.round(timesToReview.reduce((sum, t) => sum + t, 0) / timesToReview.length)
        : null;

    return {
      total_report_cards: totalReportCards,
      total_sent: totalSent,
      total_viewed: totalViewed,
      total_rated: totalRated,
      total_public_reviews: totalPublicReviews,
      open_rate_percentage: Math.round(openRatePercentage * 100) / 100,
      review_rate_percentage: Math.round(reviewRatePercentage * 100) / 100,
      public_review_rate_percentage: Math.round(publicReviewRatePercentage * 100) / 100,
      avg_time_to_open_minutes: avgTimeToOpenMinutes,
      avg_time_to_review_minutes: avgTimeToReviewMinutes,
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  } catch (error) {
    console.error('[Analytics] Error getting aggregated engagement:', error);

    // Return empty stats on error
    return {
      total_report_cards: 0,
      total_sent: 0,
      total_viewed: 0,
      total_rated: 0,
      total_public_reviews: 0,
      open_rate_percentage: 0,
      review_rate_percentage: 0,
      public_review_rate_percentage: 0,
      avg_time_to_open_minutes: null,
      avg_time_to_review_minutes: null,
      date_range: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
    };
  }
}
