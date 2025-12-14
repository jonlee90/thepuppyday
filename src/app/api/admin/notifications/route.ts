/**
 * Admin Notifications API Route
 * GET /api/admin/notifications - List notifications with filters, search, and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type {
  NotificationWithCustomer,
  NotificationFilters,
  NotificationStats,
} from '@/types/notifications';
import type { NotificationLog, User } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const channel = searchParams.get('channel') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const search = searchParams.get('search') || '';
    const campaignId = searchParams.get('campaignId') || '';

    const offset = (page - 1) * limit;

    // In mock mode, query from mock store
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();

      // Get all notifications
      let notifications = store.select('notifications_log', {
        order: { column: 'created_at', ascending: false },
      }) as unknown as NotificationLog[];

      console.log('[Notifications API] Total notifications:', notifications.length);

      // Apply filters
      if (channel) {
        notifications = notifications.filter((n) => n.channel === channel);
      }

      if (status) {
        notifications = notifications.filter((n) => n.status === status);
      }

      if (type) {
        notifications = notifications.filter((n) => n.type === type);
      }

      if (campaignId) {
        notifications = notifications.filter(
          (n) => (n as any).campaign_id === campaignId
        );
      }

      if (dateFrom) {
        const dateFromDate = new Date(dateFrom);
        notifications = notifications.filter(
          (n) => new Date(n.created_at) >= dateFromDate
        );
      }

      if (dateTo) {
        const dateToEnd = new Date(dateTo);
        dateToEnd.setHours(23, 59, 59, 999);
        notifications = notifications.filter(
          (n) => new Date(n.created_at) <= dateToEnd
        );
      }

      // Apply search (customer name, email, phone)
      if (search) {
        const searchLower = search.toLowerCase();
        notifications = notifications.filter((n) => {
          const customer = n.customer_id
            ? (store.selectById('users', n.customer_id) as User | null)
            : null;

          const customerName = customer
            ? `${customer.first_name} ${customer.last_name}`.toLowerCase()
            : '';
          const email = customer?.email?.toLowerCase() || n.recipient.toLowerCase();
          const phone = customer?.phone?.toLowerCase() || n.recipient.toLowerCase();

          return (
            customerName.includes(searchLower) ||
            email.includes(searchLower) ||
            phone.includes(searchLower)
          );
        });
      }

      // Calculate stats
      const stats: NotificationStats = calculateStats(notifications);

      // Get total count
      const totalCount = notifications.length;

      // Apply pagination
      const paginatedNotifications = notifications.slice(offset, offset + limit);

      // Enrich with customer data
      const enrichedNotifications: NotificationWithCustomer[] = paginatedNotifications.map(
        (n) => {
          const customer = n.customer_id
            ? (store.selectById('users', n.customer_id) as User | null)
            : null;

          return {
            ...n,
            customer,
            customer_name: customer
              ? `${customer.first_name} ${customer.last_name}`
              : null,
            customer_email: customer?.email || null,
            customer_phone: customer?.phone || null,
          };
        }
      );

      return NextResponse.json({
        data: enrichedNotifications,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        stats,
      });
    }

    // Production Supabase query
    let query = (supabase as any)
      .from('notifications_log')
      .select(
        `
        *,
        customer:users(*)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (channel) {
      query = query.eq('channel', channel);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      const dateToEnd = new Date(dateTo);
      dateToEnd.setHours(23, 59, 59, 999);
      query = query.lte('created_at', dateToEnd.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[Notifications API] Error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Enrich data
    const enrichedNotifications: NotificationWithCustomer[] = (data || []).map(
      (n: any) => ({
        ...n,
        customer_name: n.customer
          ? `${n.customer.first_name} ${n.customer.last_name}`
          : null,
        customer_email: n.customer?.email || null,
        customer_phone: n.customer?.phone || null,
      })
    );

    // Calculate stats from full dataset (not paginated)
    // In production, you'd want to optimize this with aggregation queries
    const statsQuery = (supabase as any)
      .from('notifications_log')
      .select('*');

    // Apply same filters for stats
    if (channel) statsQuery.eq('channel', channel);
    if (status) statsQuery.eq('status', status);
    if (type) statsQuery.eq('type', type);
    if (campaignId) statsQuery.eq('campaign_id', campaignId);
    if (dateFrom) statsQuery.gte('created_at', dateFrom);
    if (dateTo) {
      const dateToEnd = new Date(dateTo);
      dateToEnd.setHours(23, 59, 59, 999);
      statsQuery.lte('created_at', dateToEnd.toISOString());
    }

    const { data: statsData } = await statsQuery;
    const stats: NotificationStats = calculateStats(statsData || []);

    return NextResponse.json({
      data: enrichedNotifications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('[Notifications API] Error in notifications route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate notification statistics
 */
function calculateStats(notifications: NotificationLog[]): NotificationStats {
  const totalSent = notifications.length;
  const totalDelivered = notifications.filter((n) => n.delivered_at).length;
  const totalClicked = notifications.filter((n) => n.clicked_at).length;
  const totalFailed = notifications.filter((n) => n.status === 'failed').length;
  const emailCount = notifications.filter((n) => n.channel === 'email').length;
  const smsCount = notifications.filter((n) => n.channel === 'sms').length;

  const deliveryRate =
    totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100 * 100) / 100 : 0;
  const clickRate =
    totalDelivered > 0
      ? Math.round((totalClicked / totalDelivered) * 100 * 100) / 100
      : 0;

  // Calculate total cost (for SMS, assuming cost_cents field exists)
  const totalCostCents = notifications.reduce((sum, n) => {
    return sum + ((n as any).cost_cents || 0);
  }, 0);
  const totalCostDollars = Math.round(totalCostCents) / 100;

  return {
    totalSent,
    totalDelivered,
    totalClicked,
    totalFailed,
    deliveryRate,
    clickRate,
    totalCostDollars,
    emailCount,
    smsCount,
  };
}
