/**
 * Marketing Analytics API Route
 * GET /api/admin/analytics/marketing
 * Task 0054: Fetch marketing campaign effectiveness metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { MarketingCampaign, CampaignSend } from '@/types/marketing';
import type { Appointment } from '@/types/database';

export const dynamic = 'force-dynamic';

interface MarketingAnalyticsResponse {
  remindersSent: {
    count: number;
    sms: number;
    email: number;
  };
  clickThroughRate: {
    clicks: number;
    sent: number;
    percentage: number;
  };
  bookingConversion: {
    bookings: number;
    clicks: number;
    percentage: number;
  };
  revenue: {
    total: number;
    fromReminders: number;
    percentage: number;
  };
  costPerAcquisition: {
    totalCost: number;
    totalBookings: number;
    cpa: number;
  };
  byChannel: Array<{
    channel: string;
    sent: number;
    clicks: number;
    bookings: number;
    revenue: number;
    cost: number;
  }>;
}

/**
 * Calculate SMS cost (estimated at $0.0075 per SMS)
 */
function calculateSmsCost(smsSent: number): number {
  const costPerSms = 0.0075;
  return Math.round(smsSent * costPerSms * 100) / 100;
}

/**
 * Group sends by date and channel
 */
function generateChannelData(
  sends: CampaignSend[],
  campaigns: MarketingCampaign[],
  startDate: Date,
  endDate: Date
): Array<{ date: string; email: number; sms: number }> {
  const channelMap = new Map<string, { email: number; sms: number }>();

  // Initialize dates in range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    channelMap.set(dateKey, { email: 0, sms: 0 });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Populate channel data
  sends.forEach((send) => {
    if (!send.sent_at) return;

    const dateKey = new Date(send.sent_at).toISOString().split('T')[0];
    const existing = channelMap.get(dateKey);

    if (existing && send.campaign_id) {
      const campaign = campaigns.find((c) => c.id === send.campaign_id);
      if (campaign) {
        if (campaign.channel === 'email') {
          existing.email += 1;
        } else if (campaign.channel === 'sms') {
          existing.sms += 1;
        } else if (campaign.channel === 'both') {
          existing.email += 1;
          existing.sms += 1;
        }
      }
    }
  });

  return Array.from(channelMap.entries())
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate campaign detail data
 */
function generateDetailData(
  campaigns: MarketingCampaign[],
  sends: CampaignSend[],
  appointments: Appointment[]
): Array<{
  campaign: string;
  sent: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roi: number;
}> {
  return campaigns.map((campaign) => {
    const campaignSends = sends.filter((s) => s.campaign_id === campaign.id);
    const sent = campaignSends.length;
    const clicks = campaignSends.filter((s) => s.clicked_at !== null).length;
    const conversions = campaignSends.filter((s) => s.booking_id !== null).length;

    // Calculate revenue from converted appointments
    const convertedAppointmentIds = campaignSends
      .filter((s) => s.booking_id)
      .map((s) => s.booking_id);

    const revenue = appointments
      .filter((apt) => convertedAppointmentIds.includes(apt.id))
      .reduce((sum, apt) => sum + apt.total_price, 0);

    // Calculate cost based on channel
    let cost = 0;
    if (campaign.channel === 'sms' || campaign.channel === 'both') {
      const smsSent = campaign.channel === 'both' ? sent : sent;
      cost += calculateSmsCost(smsSent);
    }
    // Email cost is minimal/negligible

    // Calculate ROI
    const roi = cost > 0 ? Math.round(((revenue - cost) / cost) * 100) : 0;

    return {
      campaign: campaign.name,
      sent,
      clicks,
      conversions,
      revenue: Math.round(revenue * 100) / 100,
      roi,
    };
  });
}

/**
 * GET /api/admin/analytics/marketing
 * Fetch marketing campaign performance and ROI metrics
 */
export async function GET(request: NextRequest) {
  try {
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

    // Check if we're in mock mode (return mock data without auth check for development)
    const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

    if (useMocks) {
      // Generate mock marketing analytics
      const mockChannelData = [];
      const days = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      for (let i = 0; i < Math.min(days, 14); i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        mockChannelData.push({
          date: date.toISOString().split('T')[0],
          email: Math.floor(Math.random() * 30) + 10,
          sms: Math.floor(Math.random() * 20) + 5,
        });
      }

      // Aggregate channel data into per-channel metrics
      const emailTotal = mockChannelData.reduce((s, d) => s + d.email, 0);
      const smsTotal = mockChannelData.reduce((s, d) => s + d.sms, 0);
      const totalSent = emailTotal + smsTotal;

      const mockData: MarketingAnalyticsResponse = {
        remindersSent: { count: totalSent, sms: smsTotal, email: emailTotal },
        clickThroughRate: { clicks: 178, sent: totalSent, percentage: 51.6 },
        bookingConversion: { bookings: 89, clicks: 178, percentage: 50.0 },
        revenue: { total: 6745.0, fromReminders: 6745.0, percentage: 100 },
        costPerAcquisition: { totalCost: 127.35, totalBookings: 89, cpa: 1.43 },
        byChannel: [
          { channel: 'Email', sent: emailTotal, clicks: 112, bookings: 56, revenue: 4200, cost: 0 },
          { channel: 'SMS', sent: smsTotal, clicks: 66, bookings: 33, revenue: 2545, cost: 127.35 },
        ],
      };

      return NextResponse.json({ data: mockData });
    }

    // Production implementation - require admin auth
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Fetch campaigns within date range
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaigns, error: campaignsError } = (await (supabase as any)
      .from('marketing_campaigns')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())) as {
      data: MarketingCampaign[] | null;
      error: Error | null;
    };

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      throw new Error('Failed to fetch campaigns');
    }

    const campaignList = campaigns || [];
    const campaignIds = campaignList.map((c) => c.id);

    // Fetch campaign sends
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sends, error: sendsError } = (await (supabase as any)
      .from('campaign_sends')
      .select('*')
      .in('campaign_id', campaignIds.length > 0 ? campaignIds : [''])) as {
      data: CampaignSend[] | null;
      error: Error | null;
    };

    if (sendsError) {
      console.error('Error fetching campaign sends:', sendsError);
      throw new Error('Failed to fetch campaign sends');
    }

    const sendsList = sends || [];

    // Fetch appointments that were converted from campaigns
    const convertedAppointmentIds = sendsList
      .filter((s) => s.booking_id)
      .map((s) => s.booking_id);

    let appointmentsList: Appointment[] = [];
    if (convertedAppointmentIds.length > 0) {
       
      const { data: appointments, error: appointmentsError } = (await (
        supabase as any
      )
        .from('appointments')
        .select('*')
        .in('id', convertedAppointmentIds)) as {
        data: Appointment[] | null;
        error: Error | null;
      };

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
      } else {
        appointmentsList = appointments || [];
      }
    }

    // Calculate metrics
    const remindersSent = sendsList.filter((s) => s.sent_at !== null).length;
    const clicked = sendsList.filter((s) => s.clicked_at !== null).length;
    const clickRate = remindersSent > 0 ? Math.round((clicked / remindersSent) * 1000) / 10 : 0;

    const converted = sendsList.filter((s) => s.booking_id !== null).length;
    const conversionRate = clicked > 0 ? Math.round((converted / clicked) * 1000) / 10 : 0;

    const revenue = appointmentsList.reduce(
      (sum, apt) => sum + apt.total_price,
      0
    );

    // Calculate SMS cost
    const smsSends = sendsList.filter((s) => {
      if (!s.campaign_id) return false;
      const campaign = campaignList.find((c) => c.id === s.campaign_id);
      return campaign && (campaign.channel === 'sms' || campaign.channel === 'both');
    }).length;
    const smsCost = calculateSmsCost(smsSends);

    // Calculate CPA (Cost Per Acquisition)
    const cpa = converted > 0 ? Math.round((smsCost / converted) * 100) / 100 : 0;

    // Generate channel data
    const channelData = generateChannelData(
      sendsList,
      campaignList,
      startDate,
      endDate
    );

    // Generate detail data
    const detailData = generateDetailData(
      campaignList,
      sendsList,
      appointmentsList
    );

    // Count email vs SMS sends
    const emailSends = sendsList.filter((s) => {
      if (!s.campaign_id) return false;
      const campaign = campaignList.find((c) => c.id === s.campaign_id);
      return campaign && (campaign.channel === 'email' || campaign.channel === 'both');
    }).length;

    // Build per-channel aggregates
    const byChannelMap = new Map<string, { sent: number; clicks: number; bookings: number; revenue: number; cost: number }>();
    for (const detail of detailData) {
      const campaign = campaignList.find((c) => c.name === detail.campaign);
      const ch = campaign?.channel || 'email';
      const channels = ch === 'both' ? ['Email', 'SMS'] : [ch === 'sms' ? 'SMS' : 'Email'];
      for (const channel of channels) {
        const existing = byChannelMap.get(channel) || { sent: 0, clicks: 0, bookings: 0, revenue: 0, cost: 0 };
        existing.sent += detail.sent;
        existing.clicks += detail.clicks;
        existing.bookings += detail.conversions;
        existing.revenue += detail.revenue;
        if (channel === 'SMS') {
          existing.cost += calculateSmsCost(detail.sent);
        }
        byChannelMap.set(channel, existing);
      }
    }
    const byChannel = Array.from(byChannelMap.entries()).map(([channel, data]) => ({
      channel,
      ...data,
    }));

    const responseData: MarketingAnalyticsResponse = {
      remindersSent: { count: remindersSent, sms: smsSends, email: emailSends },
      clickThroughRate: { clicks: clicked, sent: remindersSent, percentage: clickRate },
      bookingConversion: { bookings: converted, clicks: clicked, percentage: conversionRate },
      revenue: { total: Math.round(revenue * 100) / 100, fromReminders: Math.round(revenue * 100) / 100, percentage: 100 },
      costPerAcquisition: { totalCost: smsCost, totalBookings: converted, cpa },
      byChannel,
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('Error in marketing analytics:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
