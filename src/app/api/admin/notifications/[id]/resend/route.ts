/**
 * Resend Single Notification API Route
 * POST /api/admin/notifications/[id]/resend - Resend a specific notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getNotificationService } from '@/lib/notifications';

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

    // Use service role client for data queries (bypasses RLS)
    const serviceClient = createServiceRoleClient();

    // Fetch original notification
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: notification, error: fetchError } = await (serviceClient as any)
      .from('notifications_log')
      .select('id, customer_id, type, channel, recipient, status, template_data')
      .eq('id', id)
      .single();

    if (fetchError || !notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Send via notification service (handles mock/production internally)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notificationService = getNotificationService(serviceClient as any);
    const result = await notificationService.send({
      type: notification.type,
      channel: notification.channel,
      recipient: notification.recipient,
      templateData: notification.template_data || {},
      userId: notification.customer_id || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to resend notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notificationId: result.logId,
    });
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
