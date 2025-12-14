/**
 * Campaign Analytics
 * Task 0047: Campaign performance tracking and metrics calculation
 */

import type { AppSupabaseClient } from '@/lib/supabase/server';
import type { CampaignPerformanceMetrics } from '@/types/marketing';

export interface ABTestComparison {
  variant: 'A' | 'B';
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  conversion_count: number;
  revenue_generated: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  avg_revenue_per_send: number;
}

export interface ConversionData {
  customer_id: string;
  customer_name: string;
  booking_id: string;
  booking_date: string;
  revenue: number;
  days_to_conversion: number;
}

/**
 * Get campaign performance metrics
 */
export async function getCampaignPerformance(
  supabase: AppSupabaseClient,
  campaignId: string
): Promise<CampaignPerformanceMetrics | null> {
  try {
    console.log(`[Campaign Analytics] Calculating performance for campaign: ${campaignId}`);

    // Get all campaign_sends for this campaign
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sends, error: sendsError } = await (supabase as any)
      .from('campaign_sends')
      .select(
        `
        id,
        sent_at,
        delivered_at,
        clicked_at,
        booking_id,
        appointments:appointments(
          total_price
        )
      `
      )
      .eq('campaign_id', campaignId);

    if (sendsError) {
      console.error('[Campaign Analytics] Error fetching campaign_sends:', sendsError);
      return null;
    }

    if (!sends || sends.length === 0) {
      console.log('[Campaign Analytics] No sends found for campaign');
      return {
        campaign_id: campaignId,
        sent_count: 0,
        delivered_count: 0,
        opened_count: 0,
        clicked_count: 0,
        bounced_count: 0,
        failed_count: 0,
        conversion_count: 0,
        revenue_generated: 0,
        open_rate: 0,
        click_rate: 0,
        conversion_rate: 0,
        roi: 0,
        avg_revenue_per_send: 0,
      };
    }

    // Get notifications_log for delivery and open tracking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: notifications, error: notifError } = await (supabase as any)
      .from('notifications_log')
      .select('id, campaign_send_id, delivered_at, clicked_at, status')
      .eq('campaign_id', campaignId);

    if (notifError) {
      console.error('[Campaign Analytics] Error fetching notifications_log:', notifError);
    }

    // Create lookup for notifications by campaign_send_id
    const notificationsBySendId = new Map();
    if (notifications) {
      notifications.forEach((notif: any) => {
        if (notif.campaign_send_id) {
          notificationsBySendId.set(notif.campaign_send_id, notif);
        }
      });
    }

    // Calculate metrics
    const sent_count = sends.length;
    let delivered_count = 0;
    let opened_count = 0;
    let clicked_count = 0;
    let bounced_count = 0;
    let failed_count = 0;
    let conversion_count = 0;
    let revenue_generated = 0;

    sends.forEach((send: any) => {
      // Check delivery status from notifications_log
      const notification = notificationsBySendId.get(send.id);

      if (notification) {
        if (notification.status === 'delivered' || notification.delivered_at) {
          delivered_count++;
        }
        if (notification.status === 'bounced') {
          bounced_count++;
        }
        if (notification.status === 'failed') {
          failed_count++;
        }
        if (notification.clicked_at) {
          opened_count++; // Clicked implies opened
        }
      } else {
        // Fallback to campaign_sends table
        if (send.delivered_at) {
          delivered_count++;
        }
      }

      // Track clicks
      if (send.clicked_at || notification?.clicked_at) {
        clicked_count++;
      }

      // Track conversions (bookings)
      if (send.booking_id && send.appointments) {
        conversion_count++;
        revenue_generated += send.appointments.total_price || 0;
      }
    });

    // Calculate rates
    const open_rate = delivered_count > 0 ? (opened_count / delivered_count) * 100 : 0;
    const click_rate = delivered_count > 0 ? (clicked_count / delivered_count) * 100 : 0;
    const conversion_rate = sent_count > 0 ? (conversion_count / sent_count) * 100 : 0;
    const avg_revenue_per_send = sent_count > 0 ? revenue_generated / sent_count : 0;

    // Calculate ROI (assuming SMS cost ~$0.01, Email cost ~$0.001)
    // For simplicity, we'll calculate based on notifications_log cost_cents if available
    let total_cost = 0;
    if (notifications) {
      total_cost = notifications.reduce((sum: number, notif: any) => {
        return sum + (notif.cost_cents || 0);
      }, 0) / 100; // Convert cents to dollars
    }

    const roi = total_cost > 0 ? ((revenue_generated - total_cost) / total_cost) * 100 : 0;

    const metrics: CampaignPerformanceMetrics = {
      campaign_id: campaignId,
      sent_count,
      delivered_count,
      opened_count,
      clicked_count,
      bounced_count,
      failed_count,
      conversion_count,
      revenue_generated,
      open_rate: Math.round(open_rate * 100) / 100,
      click_rate: Math.round(click_rate * 100) / 100,
      conversion_rate: Math.round(conversion_rate * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      avg_revenue_per_send: Math.round(avg_revenue_per_send * 100) / 100,
    };

    console.log('[Campaign Analytics] Calculated metrics:', metrics);
    return metrics;
  } catch (error) {
    console.error('[Campaign Analytics] Error in getCampaignPerformance:', error);
    return null;
  }
}

/**
 * Get A/B test comparison data
 */
export async function getABTestComparison(
  supabase: AppSupabaseClient,
  campaignId: string
): Promise<{ variant_a: ABTestComparison; variant_b: ABTestComparison } | null> {
  try {
    console.log(`[Campaign Analytics] Calculating A/B test comparison for campaign: ${campaignId}`);

    // Get all campaign_sends grouped by variant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sends, error: sendsError } = await (supabase as any)
      .from('campaign_sends')
      .select(
        `
        id,
        variant,
        sent_at,
        delivered_at,
        clicked_at,
        booking_id,
        appointments:appointments(
          total_price
        )
      `
      )
      .eq('campaign_id', campaignId)
      .not('variant', 'is', null);

    if (sendsError) {
      console.error('[Campaign Analytics] Error fetching A/B test sends:', sendsError);
      return null;
    }

    if (!sends || sends.length === 0) {
      console.log('[Campaign Analytics] No A/B test data found');
      return null;
    }

    // Get notifications for this campaign
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: notifications, error: notifError } = await (supabase as any)
      .from('notifications_log')
      .select('campaign_send_id, delivered_at, clicked_at, status')
      .eq('campaign_id', campaignId);

    if (notifError) {
      console.error('[Campaign Analytics] Error fetching notifications:', notifError);
    }

    // Create lookup for notifications
    const notificationsBySendId = new Map();
    if (notifications) {
      notifications.forEach((notif: any) => {
        if (notif.campaign_send_id) {
          notificationsBySendId.set(notif.campaign_send_id, notif);
        }
      });
    }

    // Separate sends by variant
    const variantASends = sends.filter((s: any) => s.variant === 'A');
    const variantBSends = sends.filter((s: any) => s.variant === 'B');

    // Calculate metrics for each variant
    const variantAMetrics = calculateVariantMetrics(variantASends, notificationsBySendId);
    const variantBMetrics = calculateVariantMetrics(variantBSends, notificationsBySendId);

    return {
      variant_a: { variant: 'A', ...variantAMetrics },
      variant_b: { variant: 'B', ...variantBMetrics },
    };
  } catch (error) {
    console.error('[Campaign Analytics] Error in getABTestComparison:', error);
    return null;
  }
}

/**
 * Calculate metrics for a variant
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateVariantMetrics(sends: any[], notificationsBySendId: Map<string, any>): Omit<ABTestComparison, 'variant'> {
  const sent_count = sends.length;
  let delivered_count = 0;
  let opened_count = 0;
  let clicked_count = 0;
  let conversion_count = 0;
  let revenue_generated = 0;

  sends.forEach((send) => {
    const notification = notificationsBySendId.get(send.id);

    // Count deliveries
    if (notification?.delivered_at || send.delivered_at) {
      delivered_count++;
    }

    // Count opens (clicks imply opens)
    if (notification?.clicked_at || send.clicked_at) {
      opened_count++;
    }

    // Count clicks
    if (notification?.clicked_at || send.clicked_at) {
      clicked_count++;
    }

    // Count conversions
    if (send.booking_id && send.appointments) {
      conversion_count++;
      revenue_generated += send.appointments.total_price || 0;
    }
  });

  const open_rate = delivered_count > 0 ? (opened_count / delivered_count) * 100 : 0;
  const click_rate = delivered_count > 0 ? (clicked_count / delivered_count) * 100 : 0;
  const conversion_rate = sent_count > 0 ? (conversion_count / sent_count) * 100 : 0;
  const avg_revenue_per_send = sent_count > 0 ? revenue_generated / sent_count : 0;

  return {
    sent_count,
    delivered_count,
    opened_count,
    clicked_count,
    conversion_count,
    revenue_generated,
    open_rate: Math.round(open_rate * 100) / 100,
    click_rate: Math.round(click_rate * 100) / 100,
    conversion_rate: Math.round(conversion_rate * 100) / 100,
    avg_revenue_per_send: Math.round(avg_revenue_per_send * 100) / 100,
  };
}

/**
 * Get conversion data with details
 */
export async function getConversionData(
  supabase: AppSupabaseClient,
  campaignId: string
): Promise<ConversionData[]> {
  try {
    console.log(`[Campaign Analytics] Getting conversion data for campaign: ${campaignId}`);

    // Get campaign_sends with bookings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sends, error: sendsError } = await (supabase as any)
      .from('campaign_sends')
      .select(
        `
        customer_id,
        sent_at,
        booking_id,
        customers:users!customer_id(
          first_name,
          last_name
        ),
        appointments:appointments!booking_id(
          id,
          scheduled_at,
          total_price
        )
      `
      )
      .eq('campaign_id', campaignId)
      .not('booking_id', 'is', null);

    if (sendsError) {
      console.error('[Campaign Analytics] Error fetching conversion data:', sendsError);
      return [];
    }

    if (!sends || sends.length === 0) {
      return [];
    }

    // Map to ConversionData format
    const conversions: ConversionData[] = sends.map((send: any) => {
      const sentDate = new Date(send.sent_at);
      const bookingDate = new Date(send.appointments.scheduled_at);
      const daysToConversion = Math.floor(
        (bookingDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        customer_id: send.customer_id,
        customer_name: `${send.customers.first_name} ${send.customers.last_name}`,
        booking_id: send.booking_id,
        booking_date: send.appointments.scheduled_at,
        revenue: send.appointments.total_price || 0,
        days_to_conversion: daysToConversion,
      };
    });

    return conversions;
  } catch (error) {
    console.error('[Campaign Analytics] Error in getConversionData:', error);
    return [];
  }
}
