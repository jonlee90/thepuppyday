/**
 * Reminder Conversion Analytics
 * Task 0039: Track reminder effectiveness for ROI analysis
 *
 * Tracks when customers click reminder links and convert to bookings,
 * enabling ROI analysis of the breed reminder system.
 */

import type { AppSupabaseClient } from '@/lib/supabase/server';

export interface ReminderStats {
  // Overall metrics
  totalSent: number;
  totalClicked: number;
  totalConverted: number;
  clickRate: number; // percentage
  conversionRate: number; // percentage
  avgDaysToConversion: number;

  // Revenue metrics
  totalRevenue: number;
  avgRevenuePerConversion: number;

  // Cost metrics (if tracking SMS costs)
  totalCost?: number;
  costPerAcquisition?: number;
  roi?: number;
}

export interface BreedReminderStats extends ReminderStats {
  breedId: string;
  breedName: string;
}

interface CampaignSendRecord {
  id: string;
  user_id: string;
  pet_id: string | null;
  tracking_id: string | null;
  sent_at: string | null;
  clicked_at: string | null;
  booking_id: string | null;
  created_at: string;
}

interface NotificationLogRecord {
  id: string;
  customer_id: string | null;
  type: string;
  tracking_id: string | null;
  sent_at: string | null;
  clicked_at: string | null;
  created_at: string;
}

interface AppointmentRecord {
  id: string;
  customer_id: string;
  total_price: number;
  scheduled_at: string;
  created_at: string;
}

const CONVERSION_WINDOW_DAYS = 30;

/**
 * Get overall reminder statistics for a date range
 */
export async function getReminderStats(
  supabase: AppSupabaseClient,
  startDate: string,
  endDate: string
): Promise<ReminderStats> {
  try {
    console.log(`[Reminder Analytics] Calculating stats for ${startDate} to ${endDate}`);

    // Get all campaign sends (breed reminders) within date range
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaignSends, error: sendsError } = await (supabase as any)
      .from('campaign_sends')
      .select('id, user_id, pet_id, tracking_id, sent_at, booking_id, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('pet_id', 'is', null); // Only breed reminders

    if (sendsError) {
      console.error('[Reminder Analytics] Error fetching campaign_sends:', sendsError);
      return createEmptyStats();
    }

    const sends = (campaignSends || []) as CampaignSendRecord[];
    const totalSent = sends.length;

    if (totalSent === 0) {
      console.log('[Reminder Analytics] No reminders sent in this period');
      return createEmptyStats();
    }

    // Get click data from notifications_log
    const trackingIds = sends
      .map(s => s.tracking_id)
      .filter((id): id is string => id !== null);

    let clickedTrackingIds: Set<string> = new Set();

    if (trackingIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: notifications, error: notifError } = await (supabase as any)
        .from('notifications_log')
        .select('tracking_id, clicked_at')
        .in('tracking_id', trackingIds)
        .not('clicked_at', 'is', null);

      if (notifError) {
        console.error('[Reminder Analytics] Error fetching notification clicks:', notifError);
      } else {
        clickedTrackingIds = new Set(
          (notifications || []).map((n: NotificationLogRecord) => n.tracking_id).filter(Boolean)
        );
      }
    }

    const totalClicked = clickedTrackingIds.size;

    // Count conversions and calculate revenue
    const conversions = sends.filter(s => s.booking_id !== null);
    const totalConverted = conversions.length;

    let totalRevenue = 0;
    let totalDaysToConversion = 0;

    if (totalConverted > 0) {
      // Get appointment details for converted bookings
      const bookingIds = conversions
        .map(c => c.booking_id)
        .filter((id): id is string => id !== null);

      if (bookingIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: appointments, error: apptError } = await (supabase as any)
          .from('appointments')
          .select('id, customer_id, total_price, scheduled_at, created_at')
          .in('id', bookingIds);

        if (apptError) {
          console.error('[Reminder Analytics] Error fetching appointments:', apptError);
        } else {
          const apptMap = new Map(
            (appointments || []).map((a: AppointmentRecord) => [a.id, a])
          );

          // Calculate revenue and days to conversion
          conversions.forEach(conversion => {
            const appointment = apptMap.get(conversion.booking_id || '') as AppointmentRecord | undefined;
            if (appointment) {
              totalRevenue += appointment.total_price;

              // Calculate days from reminder sent to booking created
              if (conversion.sent_at) {
                const sentDate = new Date(conversion.sent_at);
                const bookedDate = new Date(appointment.created_at);
                const daysToConvert = Math.floor(
                  (bookedDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                totalDaysToConversion += daysToConvert;
              }
            }
          });
        }
      }
    }

    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    const conversionRate = totalSent > 0 ? (totalConverted / totalSent) * 100 : 0;
    const avgDaysToConversion = totalConverted > 0 ? totalDaysToConversion / totalConverted : 0;
    const avgRevenuePerConversion = totalConverted > 0 ? totalRevenue / totalConverted : 0;

    const stats: ReminderStats = {
      totalSent,
      totalClicked,
      totalConverted,
      clickRate: Math.round(clickRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      avgDaysToConversion: Math.round(avgDaysToConversion * 10) / 10,
      totalRevenue,
      avgRevenuePerConversion: Math.round(avgRevenuePerConversion * 100) / 100,
    };

    console.log('[Reminder Analytics] Calculated stats:', stats);
    return stats;
  } catch (error) {
    console.error('[Reminder Analytics] Error in getReminderStats:', error);
    return createEmptyStats();
  }
}

/**
 * Get reminder statistics by breed
 */
export async function getReminderStatsByBreed(
  supabase: AppSupabaseClient,
  startDate: string,
  endDate: string
): Promise<BreedReminderStats[]> {
  try {
    console.log(`[Reminder Analytics] Calculating breed stats for ${startDate} to ${endDate}`);

    // Get all campaign sends with pet/breed data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaignSends, error: sendsError } = await (supabase as any)
      .from('campaign_sends')
      .select(`
        id,
        user_id,
        pet_id,
        tracking_id,
        sent_at,
        booking_id,
        created_at,
        pets!inner (
          id,
          breed_id,
          breeds!inner (
            id,
            name
          )
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('pet_id', 'is', null);

    if (sendsError) {
      console.error('[Reminder Analytics] Error fetching campaign sends with breeds:', sendsError);
      return [];
    }

    if (!campaignSends || campaignSends.length === 0) {
      console.log('[Reminder Analytics] No breed reminders sent in this period');
      return [];
    }

    // Group sends by breed
    const breedGroups = new Map<string, {
      breedId: string;
      breedName: string;
      sends: CampaignSendRecord[];
    }>();

    campaignSends.forEach((send: any) => {
      const breedId = send.pets?.breeds?.id;
      const breedName = send.pets?.breeds?.name;

      if (!breedId || !breedName) return;

      if (!breedGroups.has(breedId)) {
        breedGroups.set(breedId, {
          breedId,
          breedName,
          sends: [],
        });
      }

      breedGroups.get(breedId)?.sends.push({
        id: send.id,
        user_id: send.user_id,
        pet_id: send.pet_id,
        tracking_id: send.tracking_id,
        sent_at: send.sent_at,
        clicked_at: null,
        booking_id: send.booking_id,
        created_at: send.created_at,
      });
    });

    // Get all tracking IDs for click data
    const allTrackingIds = campaignSends
      .map((s: any) => s.tracking_id)
      .filter((id: string | null): id is string => id !== null);

    let clickedTrackingIds: Set<string> = new Set();

    if (allTrackingIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: notifications, error: notifError } = await (supabase as any)
        .from('notifications_log')
        .select('tracking_id, clicked_at')
        .in('tracking_id', allTrackingIds)
        .not('clicked_at', 'is', null);

      if (notifError) {
        console.error('[Reminder Analytics] Error fetching clicks:', notifError);
      } else {
        clickedTrackingIds = new Set(
          (notifications || []).map((n: NotificationLogRecord) => n.tracking_id).filter(Boolean)
        );
      }
    }

    // Get all booking IDs for revenue data
    const allBookingIds = campaignSends
      .map((s: any) => s.booking_id)
      .filter((id: string | null): id is string => id !== null);

    let appointmentMap = new Map<string, AppointmentRecord>();

    if (allBookingIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: appointments, error: apptError } = await (supabase as any)
        .from('appointments')
        .select('id, customer_id, total_price, scheduled_at, created_at')
        .in('id', allBookingIds);

      if (apptError) {
        console.error('[Reminder Analytics] Error fetching appointments:', apptError);
      } else {
        appointmentMap = new Map(
          (appointments || []).map((a: AppointmentRecord) => [a.id, a])
        );
      }
    }

    // Calculate stats for each breed
    const breedStats: BreedReminderStats[] = [];

    breedGroups.forEach(({ breedId, breedName, sends }) => {
      const totalSent = sends.length;
      const totalClicked = sends.filter(s => s.tracking_id && clickedTrackingIds.has(s.tracking_id)).length;
      const conversions = sends.filter(s => s.booking_id !== null);
      const totalConverted = conversions.length;

      let totalRevenue = 0;
      let totalDaysToConversion = 0;

      conversions.forEach(conversion => {
        const appointment = appointmentMap.get(conversion.booking_id || '');
        if (appointment) {
          totalRevenue += appointment.total_price;

          if (conversion.sent_at) {
            const sentDate = new Date(conversion.sent_at);
            const bookedDate = new Date(appointment.created_at);
            const daysToConvert = Math.floor(
              (bookedDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            totalDaysToConversion += daysToConvert;
          }
        }
      });

      const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
      const conversionRate = totalSent > 0 ? (totalConverted / totalSent) * 100 : 0;
      const avgDaysToConversion = totalConverted > 0 ? totalDaysToConversion / totalConverted : 0;
      const avgRevenuePerConversion = totalConverted > 0 ? totalRevenue / totalConverted : 0;

      breedStats.push({
        breedId,
        breedName,
        totalSent,
        totalClicked,
        totalConverted,
        clickRate: Math.round(clickRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgDaysToConversion: Math.round(avgDaysToConversion * 10) / 10,
        totalRevenue,
        avgRevenuePerConversion: Math.round(avgRevenuePerConversion * 100) / 100,
      });
    });

    // Sort by total sent (most active breeds first)
    breedStats.sort((a, b) => b.totalSent - a.totalSent);

    console.log(`[Reminder Analytics] Calculated stats for ${breedStats.length} breeds`);
    return breedStats;
  } catch (error) {
    console.error('[Reminder Analytics] Error in getReminderStatsByBreed:', error);
    return [];
  }
}

/**
 * Link a booking to a reminder tracking_id
 * Called when a customer books after clicking a reminder link
 */
export async function linkBookingToReminder(
  supabase: AppSupabaseClient,
  customerId: string,
  bookingId: string,
  scheduledAt: string
): Promise<void> {
  try {
    console.log(`[Reminder Analytics] Linking booking ${bookingId} to reminder for customer ${customerId}`);

    // Calculate conversion window (30 days before booking)
    const bookingDate = new Date(scheduledAt);
    const windowStart = new Date(bookingDate);
    windowStart.setDate(windowStart.getDate() - CONVERSION_WINDOW_DAYS);
    const windowStartStr = windowStart.toISOString();

    // Find the most recent campaign send for this customer within conversion window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recentSend, error: sendError } = await (supabase as any)
      .from('campaign_sends')
      .select('id, tracking_id')
      .eq('user_id', customerId)
      .gte('created_at', windowStartStr)
      .not('pet_id', 'is', null) // Only breed reminders
      .is('booking_id', null) // Not already converted
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sendError) {
      console.error('[Reminder Analytics] Error finding recent send:', sendError);
      return;
    }

    if (!recentSend) {
      console.log('[Reminder Analytics] No unconverted reminder found within conversion window');
      return;
    }

    // Update campaign_sends with booking_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('campaign_sends')
      .update({ booking_id: bookingId })
      .eq('id', recentSend.id);

    if (updateError) {
      console.error('[Reminder Analytics] Error updating campaign_send:', updateError);
      return;
    }

    console.log(`[Reminder Analytics] Successfully linked booking to reminder ${recentSend.id}`);
  } catch (error) {
    console.error('[Reminder Analytics] Error in linkBookingToReminder:', error);
  }
}

/**
 * Create empty stats object
 */
function createEmptyStats(): ReminderStats {
  return {
    totalSent: 0,
    totalClicked: 0,
    totalConverted: 0,
    clickRate: 0,
    conversionRate: 0,
    avgDaysToConversion: 0,
    totalRevenue: 0,
    avgRevenuePerConversion: 0,
  };
}
