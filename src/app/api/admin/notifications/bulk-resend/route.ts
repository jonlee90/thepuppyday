/**
 * Bulk Resend Notifications API Route
 * POST /api/admin/notifications/bulk-resend - Resend multiple failed notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { NotificationLog } from '@/types/database';
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

    // In mock mode
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();

      let notificationsToResend: NotificationLog[] = [];

      if (ids && ids.length > 0) {
        // Get notifications by IDs
        notificationsToResend = ids
          .map((id) => store.selectById('notifications_log', id) as NotificationLog | null)
          .filter((n): n is NotificationLog => n !== null);
      } else if (filters) {
        // Get all notifications matching filters
        let allNotifications = store.select('notifications_log', {
          order: { column: 'created_at', ascending: false },
        }) as unknown as NotificationLog[];

        // Apply filters
        if (filters.status) {
          allNotifications = allNotifications.filter(
            (n) => n.status === filters.status
          );
        }
        if (filters.channel) {
          allNotifications = allNotifications.filter(
            (n) => n.channel === filters.channel
          );
        }
        if (filters.type) {
          allNotifications = allNotifications.filter((n) => n.type === filters.type);
        }

        notificationsToResend = allNotifications;
      }

      console.log('[Bulk Resend] Resending', notificationsToResend.length, 'notifications');

      let totalResent = 0;
      let totalFailed = 0;
      const errors: string[] = [];

      for (const notification of notificationsToResend) {
        try {
          const newNotification: Partial<NotificationLog> = {
            customer_id: notification.customer_id,
            type: notification.type,
            channel: notification.channel,
            recipient: notification.recipient,
            subject: notification.subject,
            content: notification.content,
            status: 'pending',
            error_message: null,
            sent_at: null,
            clicked_at: null,
            delivered_at: null,
            message_id: null,
            tracking_id: null,
            report_card_id: notification.report_card_id,
          };

          const result = await (store as any).insert(
            'notifications_log',
            newNotification
          );

          if (result) {
            // Simulate sending
            setTimeout(() => {
              store.update('notifications_log', result.id, {
                status: 'sent',
                sent_at: new Date().toISOString(),
                delivered_at: new Date().toISOString(),
              });
            }, 1000);

            totalResent++;
          } else {
            totalFailed++;
            errors.push(`Failed to resend notification ${notification.id}`);
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
    }

    // Production Supabase query
    let query = (supabase as any).from('notifications_log').select('*');

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

    let totalResent = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    for (const notification of notifications || []) {
      try {
        const { error: insertError } = await (supabase as any)
          .from('notifications_log')
          .insert({
            customer_id: notification.customer_id,
            type: notification.type,
            channel: notification.channel,
            recipient: notification.recipient,
            subject: notification.subject,
            content: notification.content,
            status: 'pending',
            error_message: null,
            sent_at: null,
            clicked_at: null,
            delivered_at: null,
            message_id: null,
            tracking_id: null,
            report_card_id: notification.report_card_id,
          });

        if (insertError) {
          totalFailed++;
          errors.push(`Failed to resend notification ${notification.id}`);
        } else {
          totalResent++;
          // TODO: Actually send the notification using Resend/Twilio
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
