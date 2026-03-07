/**
 * Bulk Resend Notifications API Route
 * POST /api/admin/notifications/bulk-resend - Resend multiple failed notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getNotificationService } from '@/lib/notifications';
import type { BulkResendRequest, BulkResendResponse } from '@/types/notifications';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const body = (await request.json()) as BulkResendRequest;
    const { ids, filters } = body;

    if (!ids && !filters) {
      return NextResponse.json(
        {
          success: false,
          totalResent: 0,
          totalFailed: 0,
          errors: ['Either ids or filters must be provided'],
        },
        { status: 400 }
      );
    }

    // Use service role client for data queries (bypasses RLS)
    const serviceClient = createServiceRoleClient();

    // Fetch notifications to resend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (serviceClient as any).from('notifications_log')
      .select('id, customer_id, type, channel, recipient, template_data');

    if (ids && ids.length > 0) {
      query = query.in('id', ids);
    } else if (filters) {
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.channel) query = query.eq('channel', filters.channel);
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters.dateTo) {
        const dateToEnd = new Date(filters.dateTo);
        dateToEnd.setHours(23, 59, 59, 999);
        query = query.lte('created_at', dateToEnd.toISOString());
      }
    }

    const { data: notifications, error: fetchError } = await query;

    if (fetchError) {
      console.error('[Bulk Resend] Error fetching notifications:', fetchError);
      return NextResponse.json(
        {
          success: false,
          totalResent: 0,
          totalFailed: 0,
          errors: ['Failed to fetch notifications'],
        },
        { status: 500 }
      );
    }

    // Send each notification via the notification service (sequential to avoid rate limiting)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notificationService = getNotificationService(serviceClient as any);
    let totalResent = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    for (const notification of notifications || []) {
      try {
        const result = await notificationService.send({
          type: notification.type,
          channel: notification.channel,
          recipient: notification.recipient,
          templateData: notification.template_data || {},
          userId: notification.customer_id || undefined,
        });

        if (result.success) {
          totalResent++;
        } else {
          totalFailed++;
          errors.push(`Failed to resend ${notification.id}: ${result.error}`);
        }
      } catch (err) {
        totalFailed++;
        errors.push(
          `Error resending ${notification.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    const response: BulkResendResponse = {
      success: totalFailed === 0,
      totalResent,
      totalFailed,
      errors: errors.length > 0 ? errors : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Bulk Resend] Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          success: false,
          totalResent: 0,
          totalFailed: 0,
          errors: ['Unauthorized'],
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        totalResent: 0,
        totalFailed: 0,
        errors: ['Internal server error'],
      },
      { status: 500 }
    );
  }
}
