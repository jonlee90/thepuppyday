/**
 * Admin Notifications Dashboard API Route
 * GET /api/admin/notifications/dashboard
 *
 * Provides comprehensive analytics for notification performance including:
 * - Summary metrics (total sent, delivered, failed, delivery rate, click rate)
 * - Channel breakdown (email vs SMS)
 * - Type breakdown (by notification type)
 * - Timeline data (daily aggregations for charts)
 * - Failure reasons (grouped error messages)
 * - Trend comparisons (vs previous period)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { NotificationLogRow } from '@/lib/notifications/database-types';

// ============================================================================
// TYPES
// ============================================================================

interface PeriodDates {
  start: string;
  end: string;
  label: string;
}

interface SummaryMetrics {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  delivery_rate: number;
  click_rate: number;
  sms_cost_cents: number;
  trends: {
    sent_change_percent: number;
    delivery_rate_change_percent: number;
  };
}

interface ChannelMetrics {
  sent: number;
  delivered: number;
  failed: number;
  delivery_rate: number;
}

interface TypeMetrics {
  type: string;
  sent: number;
  delivered: number;
  failed: number;
  success_rate: number;
}

interface TimelineEntry {
  date: string;
  sent: number;
  delivered: number;
  failed: number;
}

interface FailureReason {
  reason: string;
  count: number;
  percentage: number;
}

interface RecentFailure {
  id: string;
  type: string;
  channel: string;
  recipient: string;
  error_message: string;
  created_at: string;
}

interface DashboardResponse {
  period: PeriodDates;
  summary: SummaryMetrics;
  by_channel: {
    email: ChannelMetrics;
    sms: ChannelMetrics;
  };
  by_type: TypeMetrics[];
  timeline: TimelineEntry[];
  failure_reasons: FailureReason[];
  recent_failures: RecentFailure[];
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30d';
    const customStartDate = searchParams.get('start_date');
    const customEndDate = searchParams.get('end_date');

    // Calculate period dates
    const currentPeriod = calculatePeriodDates(period, customStartDate, customEndDate);
    const previousPeriod = calculatePreviousPeriod(currentPeriod);

    console.log('[Dashboard API] Current period:', currentPeriod);
    console.log('[Dashboard API] Previous period:', previousPeriod);

    // In mock mode, query from mock store
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();

      // Get all notifications (excluding test notifications)
      const allNotifications = (store.select('notifications_log', {}) as unknown as NotificationLogRow[])
        .filter((n) => !n.is_test);

      // Filter for current period
      const currentNotifications = filterByPeriod(allNotifications, currentPeriod);
      const previousNotifications = filterByPeriod(allNotifications, previousPeriod);

      // Calculate all metrics
      const summary = calculateSummaryMetrics(currentNotifications, previousNotifications);
      const byChannel = calculateChannelMetrics(currentNotifications);
      const byType = calculateTypeMetrics(currentNotifications);
      const timeline = calculateTimeline(currentNotifications, currentPeriod);
      const failureReasons = calculateFailureReasons(currentNotifications);
      const recentFailures = calculateRecentFailures(currentNotifications);

      const response: DashboardResponse = {
        period: currentPeriod,
        summary,
        by_channel: byChannel,
        by_type: byType,
        timeline,
        failure_reasons: failureReasons,
        recent_failures: recentFailures,
      };

      return NextResponse.json(response);
    }

    // Production Supabase query
    // Get notifications for current period
    const { data: currentData, error: currentError } = await (supabase as any)
      .from('notifications_log')
      .select('*')
      .eq('is_test', false)
      .gte('created_at', currentPeriod.start)
      .lte('created_at', currentPeriod.end);

    if (currentError) {
      console.error('[Dashboard API] Error fetching current period data:', currentError);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard data' },
        { status: 500 }
      );
    }

    // Get notifications for previous period
    const { data: previousData, error: previousError } = await (supabase as any)
      .from('notifications_log')
      .select('*')
      .eq('is_test', false)
      .gte('created_at', previousPeriod.start)
      .lte('created_at', previousPeriod.end);

    if (previousError) {
      console.error('[Dashboard API] Error fetching previous period data:', previousError);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard data' },
        { status: 500 }
      );
    }

    // Calculate all metrics
    const summary = calculateSummaryMetrics(
      currentData || [],
      previousData || []
    );
    const byChannel = calculateChannelMetrics(currentData || []);
    const byType = calculateTypeMetrics(currentData || []);
    const timeline = calculateTimeline(currentData || [], currentPeriod);
    const failureReasons = calculateFailureReasons(currentData || []);
    const recentFailures = calculateRecentFailures(currentData || []);

    const response: DashboardResponse = {
      period: currentPeriod,
      summary,
      by_channel: byChannel,
      by_type: byType,
      timeline,
      failure_reasons: failureReasons,
      recent_failures: recentFailures,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Dashboard API] Error in dashboard route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate period dates based on period parameter or custom dates
 */
function calculatePeriodDates(
  period: string,
  customStartDate?: string | null,
  customEndDate?: string | null
): PeriodDates {
  // Use custom dates if provided
  if (customStartDate && customEndDate) {
    return {
      start: new Date(customStartDate).toISOString(),
      end: new Date(customEndDate + 'T23:59:59.999Z').toISOString(),
      label: 'custom range',
    };
  }

  // Calculate from period parameter
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  let days = 30;
  let label = '30 days';

  if (period === '7d') {
    days = 7;
    label = '7 days';
  } else if (period === '90d') {
    days = 90;
    label = '90 days';
  }

  start.setDate(start.getDate() - days + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label,
  };
}

/**
 * Calculate previous period dates for trend comparison
 */
function calculatePreviousPeriod(currentPeriod: PeriodDates): PeriodDates {
  const currentStart = new Date(currentPeriod.start);
  const currentEnd = new Date(currentPeriod.end);

  const durationMs = currentEnd.getTime() - currentStart.getTime();

  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);

  return {
    start: previousStart.toISOString(),
    end: previousEnd.toISOString(),
    label: `previous ${currentPeriod.label}`,
  };
}

/**
 * Filter notifications by period
 */
function filterByPeriod(
  notifications: NotificationLogRow[],
  period: PeriodDates
): NotificationLogRow[] {
  const startDate = new Date(period.start);
  const endDate = new Date(period.end);

  return notifications.filter((n) => {
    const createdAt = new Date(n.created_at);
    return createdAt >= startDate && createdAt <= endDate;
  });
}

/**
 * Calculate summary metrics with trends
 */
function calculateSummaryMetrics(
  currentNotifications: NotificationLogRow[],
  previousNotifications: NotificationLogRow[]
): SummaryMetrics {
  // Current period metrics
  const currentSent = currentNotifications.filter((n) => n.status === 'sent' || n.delivered_at).length;
  const currentDelivered = currentNotifications.filter((n) => n.delivered_at).length;
  const currentFailed = currentNotifications.filter((n) => n.status === 'failed').length;
  const currentClicked = currentNotifications.filter((n) => n.clicked_at).length;

  const currentDeliveryRate = currentSent > 0
    ? (currentDelivered / currentSent) * 100
    : 0;
  const currentClickRate = currentDelivered > 0
    ? (currentClicked / currentDelivered) * 100
    : 0;

  // Previous period metrics
  const previousSent = previousNotifications.filter((n) => n.status === 'sent' || n.delivered_at).length;
  const previousDelivered = previousNotifications.filter((n) => n.delivered_at).length;

  const previousDeliveryRate = previousSent > 0
    ? (previousDelivered / previousSent) * 100
    : 0;

  // Calculate SMS cost
  const smsCostCents = currentNotifications
    .filter((n) => n.channel === 'sms' && n.cost_cents)
    .reduce((sum, n) => sum + (n.cost_cents || 0), 0);

  // Calculate trends
  const sentChangePercent = previousSent > 0
    ? ((currentSent - previousSent) / previousSent) * 100
    : 0;

  const deliveryRateChangePercent = previousDeliveryRate > 0
    ? currentDeliveryRate - previousDeliveryRate
    : 0;

  return {
    total_sent: currentSent,
    total_delivered: currentDelivered,
    total_failed: currentFailed,
    delivery_rate: Math.round(currentDeliveryRate * 100) / 100,
    click_rate: Math.round(currentClickRate * 100) / 100,
    sms_cost_cents: smsCostCents,
    trends: {
      sent_change_percent: Math.round(sentChangePercent * 100) / 100,
      delivery_rate_change_percent: Math.round(deliveryRateChangePercent * 100) / 100,
    },
  };
}

/**
 * Calculate channel breakdown metrics
 */
function calculateChannelMetrics(notifications: NotificationLogRow[]): {
  email: ChannelMetrics;
  sms: ChannelMetrics;
} {
  const emailNotifications = notifications.filter((n) => n.channel === 'email');
  const smsNotifications = notifications.filter((n) => n.channel === 'sms');

  const calculateMetrics = (channelNotifications: NotificationLogRow[]): ChannelMetrics => {
    const sent = channelNotifications.filter((n) => n.status === 'sent' || n.delivered_at).length;
    const delivered = channelNotifications.filter((n) => n.delivered_at).length;
    const failed = channelNotifications.filter((n) => n.status === 'failed').length;
    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;

    return {
      sent,
      delivered,
      failed,
      delivery_rate: Math.round(deliveryRate * 100) / 100,
    };
  };

  return {
    email: calculateMetrics(emailNotifications),
    sms: calculateMetrics(smsNotifications),
  };
}

/**
 * Calculate type breakdown metrics
 */
function calculateTypeMetrics(notifications: NotificationLogRow[]): TypeMetrics[] {
  // Group by type
  const typeGroups = notifications.reduce((acc, n) => {
    if (!acc[n.type]) {
      acc[n.type] = [];
    }
    acc[n.type].push(n);
    return acc;
  }, {} as Record<string, NotificationLogRow[]>);

  // Calculate metrics for each type
  return Object.entries(typeGroups)
    .map(([type, typeNotifications]) => {
      const sent = typeNotifications.filter((n) => n.status === 'sent' || n.delivered_at).length;
      const delivered = typeNotifications.filter((n) => n.delivered_at).length;
      const failed = typeNotifications.filter((n) => n.status === 'failed').length;
      const successRate = sent > 0 ? (delivered / sent) * 100 : 0;

      return {
        type,
        sent,
        delivered,
        failed,
        success_rate: Math.round(successRate * 100) / 100,
      };
    })
    .sort((a, b) => b.sent - a.sent); // Sort by sent count descending
}

/**
 * Calculate timeline data for charts
 */
function calculateTimeline(
  notifications: NotificationLogRow[],
  period: PeriodDates
): TimelineEntry[] {
  // Group by date
  const dateGroups = notifications.reduce((acc, n) => {
    const date = new Date(n.created_at).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(n);
    return acc;
  }, {} as Record<string, NotificationLogRow[]>);

  // Generate timeline entries for all dates in period (including zero days)
  const timeline: TimelineEntry[] = [];
  const startDate = new Date(period.start);
  const endDate = new Date(period.end);

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayNotifications = dateGroups[dateStr] || [];

    const sent = dayNotifications.filter((n) => n.status === 'sent' || n.delivered_at).length;
    const delivered = dayNotifications.filter((n) => n.delivered_at).length;
    const failed = dayNotifications.filter((n) => n.status === 'failed').length;

    timeline.push({
      date: dateStr,
      sent,
      delivered,
      failed,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return timeline;
}

/**
 * Calculate failure reasons with counts
 */
function calculateFailureReasons(notifications: NotificationLogRow[]): FailureReason[] {
  const failedNotifications = notifications.filter((n) => n.status === 'failed' && n.error_message);

  if (failedNotifications.length === 0) {
    return [];
  }

  // Group by error message
  const reasonGroups = failedNotifications.reduce((acc, n) => {
    const reason = n.error_message || 'Unknown error';
    if (!acc[reason]) {
      acc[reason] = 0;
    }
    acc[reason]++;
    return acc;
  }, {} as Record<string, number>);

  // Calculate percentages
  const total = failedNotifications.length;

  return Object.entries(reasonGroups)
    .map(([reason, count]): FailureReason => ({
      reason,
      count: count as number,
      percentage: Math.round((count as number / total) * 100 * 100) / 100,
    }))
    .sort((a, b) => b.count - a.count); // Sort by count descending
}

/**
 * Calculate recent failures (last 10)
 */
function calculateRecentFailures(notifications: NotificationLogRow[]): RecentFailure[] {
  const failedNotifications = notifications
    .filter((n) => n.status === 'failed')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return failedNotifications.map((n): RecentFailure => ({
    id: n.id,
    type: n.type,
    channel: n.channel || 'unknown',
    recipient: n.recipient,
    error_message: n.error_message || 'Unknown error',
    created_at: n.created_at,
  }));
}
