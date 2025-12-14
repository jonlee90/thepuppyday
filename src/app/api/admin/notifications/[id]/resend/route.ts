/**
 * Resend Single Notification API Route
 * POST /api/admin/notifications/[id]/resend - Resend a specific notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { NotificationLog } from '@/types/database';
import type { ResendNotificationResponse } from '@/types/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // In mock mode
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();

      // Get the notification
      const notification = store.selectById(
        'notifications_log',
        id
      ) as NotificationLog | null;

      if (!notification) {
        return NextResponse.json(
          { success: false, error: 'Notification not found' },
          { status: 404 }
        );
      }

      // Create a new notification record (resending)
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

      const result = await (store as any).insert('notifications_log', newNotification);

      if (!result) {
        return NextResponse.json(
          { success: false, error: 'Failed to create resend notification' },
          { status: 500 }
        );
      }

      // Simulate sending
      setTimeout(() => {
        store.update('notifications_log', result.id, {
          status: 'sent',
          sent_at: new Date().toISOString(),
          delivered_at: new Date().toISOString(),
        });
      }, 1000);

      const response: ResendNotificationResponse = {
        success: true,
        notificationId: result.id,
      };

      return NextResponse.json(response);
    }

    // Production Supabase query
    const { data: notification, error: fetchError } = await (supabase as any)
      .from('notifications_log')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Create a new notification record
    const { data: newNotification, error: insertError } = await (supabase as any)
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
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Resend Notification] Error creating notification:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create resend notification' },
        { status: 500 }
      );
    }

    // TODO: Actually send the notification using Resend/Twilio
    // For now, just mark as sent
    await (supabase as any)
      .from('notifications_log')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
      })
      .eq('id', newNotification.id);

    const response: ResendNotificationResponse = {
      success: true,
      notificationId: newNotification.id,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Resend Notification] Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
