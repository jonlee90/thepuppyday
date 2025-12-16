/**
 * Admin API - Notification Log Detail
 * Task 0130: GET /api/admin/notifications/log/[id]
 * Get single notification log entry with full details
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { isValidUUID } from '@/lib/utils/validation';

interface NotificationLogDetail {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  type: string;
  channel: 'email' | 'sms';
  recipient: string;
  subject: string | null;
  content: string;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  is_test: boolean;
  template_id: string | null;
  template_data: Record<string, unknown> | null;
  message_id: string | null;
  retry_count: number;
  retry_after: string | null;
}

/**
 * GET /api/admin/notifications/log/[id]
 * Get single notification log entry with full details
 */
export async function GET(
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

    // Fetch log entry with LEFT JOIN to users table
    const { data: log, error } = await (supabase as any)
      .from('notifications_log')
      .select(`
        id,
        customer_id,
        type,
        channel,
        recipient,
        subject,
        content,
        status,
        error_message,
        sent_at,
        created_at,
        is_test,
        template_id,
        template_data,
        message_id,
        retry_count,
        retry_after,
        users:customer_id (
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .single();

    if (error || !log) {
      return NextResponse.json(
        { error: 'Notification log entry not found' },
        { status: 404 }
      );
    }

    // Transform data to include customer_name
    const customerName =
      log.users && log.users.first_name && log.users.last_name
        ? `${log.users.first_name} ${log.users.last_name}`
        : null;

    const logDetail: NotificationLogDetail = {
      id: log.id,
      customer_id: log.customer_id,
      customer_name: customerName,
      type: log.type,
      channel: log.channel,
      recipient: log.recipient,
      subject: log.subject,
      content: log.content,
      status: log.status,
      error_message: log.error_message,
      sent_at: log.sent_at,
      created_at: log.created_at,
      is_test: log.is_test,
      template_id: log.template_id,
      template_data: log.template_data,
      message_id: log.message_id,
      retry_count: log.retry_count,
      retry_after: log.retry_after,
    };

    return NextResponse.json({ log: logDetail });
  } catch (error) {
    console.error('[Admin API] Error fetching notification log detail:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch notification log';

    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
