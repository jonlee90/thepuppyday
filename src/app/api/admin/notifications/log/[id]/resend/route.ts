/**
 * Admin API - Notification Resend
 * Task 0131: POST /api/admin/notifications/log/[id]/resend
 * Resend a failed notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { isValidUUID } from '@/lib/utils/validation';
import { getNotificationService } from '@/lib/notifications';
import type { NotificationChannel } from '@/types/database';

interface NotificationLogRow {
  id: string;
  customer_id: string | null;
  type: string;
  channel: NotificationChannel;
  recipient: string;
  status: 'pending' | 'sent' | 'failed';
  template_data: Record<string, unknown> | null;
}

/**
 * POST /api/admin/notifications/log/[id]/resend
 * Resend a failed notification
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    const { id } = await params;

    // Security: Validate UUID format to prevent injection
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid log ID format' },
        { status: 400 }
      );
    }

    // Load original notification log entry
    const { data: originalLog, error: fetchError } = (await (supabase as any)
      .from('notifications_log')
      .select('id, customer_id, type, channel, recipient, status, template_data')
      .eq('id', id)
      .single()) as {
      data: NotificationLogRow | null;
      error: Error | null;
    };

    if (fetchError || !originalLog) {
      return NextResponse.json(
        { error: 'Original notification log entry not found' },
        { status: 404 }
      );
    }

    // Validate that the original notification has status 'failed'
    if (originalLog.status !== 'failed') {
      return NextResponse.json(
        {
          error: `Cannot resend notification with status '${originalLog.status}'. Only failed notifications can be resent.`,
        },
        { status: 400 }
      );
    }

    // Get notification service
    const notificationService = getNotificationService(supabase as any);

    // Resend notification using the original parameters
    const result = await notificationService.send({
      type: originalLog.type,
      channel: originalLog.channel,
      recipient: originalLog.recipient,
      templateData: originalLog.template_data || {},
      userId: originalLog.customer_id || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to resend notification',
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      new_log_id: result.logId,
      message: 'Notification resent successfully',
    });
  } catch (error) {
    console.error('[Admin API] Error resending notification:', error);
    const message = error instanceof Error ? error.message : 'Failed to resend notification';

    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while resending notification',
        error: message,
      },
      { status: 500 }
    );
  }
}
