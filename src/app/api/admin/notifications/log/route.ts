/**
 * Admin API - Notification Log List with Pagination
 * Task 0129: GET /api/admin/notifications/log
 * List notification logs with pagination and filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

interface NotificationLogListItem {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  type: string;
  channel: 'email' | 'sms';
  recipient: string;
  subject: string | null;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  is_test: boolean;
}

interface PaginationMetadata {
  total: number;
  total_pages: number;
  current_page: number;
  per_page: number;
}

/**
 * GET /api/admin/notifications/log
 * List all notification logs with pagination and filtering
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * - type: Filter by notification type
 * - channel: Filter by channel (email or sms)
 * - status: Filter by status (sent, failed, pending)
 * - customer_id: Filter by specific customer
 * - start_date: Filter created_at >= start_date (ISO date string)
 * - end_date: Filter created_at <= end_date (ISO date string)
 * - search: Search recipient email/phone (case-insensitive)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const type = searchParams.get('type');
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customer_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const search = searchParams.get('search');

    // Validate pagination parameters
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page parameter. Must be a positive integer.' },
        { status: 400 }
      );
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be between 1 and 100.' },
        { status: 400 }
      );
    }

    // Validate channel filter
    if (channel && !['email', 'sms'].includes(channel)) {
      return NextResponse.json(
        { error: 'Invalid channel parameter. Must be either "email" or "sms".' },
        { status: 400 }
      );
    }

    // Validate status filter
    if (status && !['sent', 'failed', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status parameter. Must be one of: "sent", "failed", "pending".' },
        { status: 400 }
      );
    }

    // Validate date filters
    if (startDate) {
      const startDateObj = new Date(startDate);
      if (isNaN(startDateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid start_date parameter. Must be a valid ISO date string.' },
          { status: 400 }
        );
      }
    }

    if (endDate) {
      const endDateObj = new Date(endDate);
      if (isNaN(endDateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end_date parameter. Must be a valid ISO date string.' },
          { status: 400 }
        );
      }
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build count query for total
    let countQuery = (supabase as any)
      .from('notifications_log')
      .select('*', { count: 'exact', head: true });

    // Apply filters to count query
    if (type) {
      countQuery = countQuery.eq('type', type);
    }
    if (channel) {
      countQuery = countQuery.eq('channel', channel);
    }
    if (status) {
      countQuery = countQuery.eq('status', status);
    }
    if (customerId) {
      countQuery = countQuery.eq('customer_id', customerId);
    }
    if (startDate) {
      countQuery = countQuery.gte('created_at', startDate);
    }
    if (endDate) {
      countQuery = countQuery.lte('created_at', endDate);
    }
    if (search) {
      countQuery = countQuery.ilike('recipient', `%${search}%`);
    }

    // Execute count query
    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // Build data query with LEFT JOIN to users table
    let dataQuery = (supabase as any)
      .from('notifications_log')
      .select(`
        id,
        customer_id,
        type,
        channel,
        recipient,
        subject,
        status,
        error_message,
        sent_at,
        created_at,
        is_test,
        users:customer_id (
          first_name,
          last_name
        )
      `);

    // Apply same filters to data query
    if (type) {
      dataQuery = dataQuery.eq('type', type);
    }
    if (channel) {
      dataQuery = dataQuery.eq('channel', channel);
    }
    if (status) {
      dataQuery = dataQuery.eq('status', status);
    }
    if (customerId) {
      dataQuery = dataQuery.eq('customer_id', customerId);
    }
    if (startDate) {
      dataQuery = dataQuery.gte('created_at', startDate);
    }
    if (endDate) {
      dataQuery = dataQuery.lte('created_at', endDate);
    }
    if (search) {
      dataQuery = dataQuery.ilike('recipient', `%${search}%`);
    }

    // Order by created_at descending (most recent first)
    dataQuery = dataQuery.order('created_at', { ascending: false });

    // Apply pagination
    dataQuery = dataQuery.range(offset, offset + limit - 1);

    // Execute data query
    const { data: logs, error: dataError } = await dataQuery;

    if (dataError) {
      throw dataError;
    }

    // Transform data to include customer_name
    const transformedLogs: NotificationLogListItem[] = (logs || []).map((log: any) => {
      const customerName =
        log.users && log.users.first_name && log.users.last_name
          ? `${log.users.first_name} ${log.users.last_name}`
          : null;

      return {
        id: log.id,
        customer_id: log.customer_id,
        customer_name: customerName,
        type: log.type,
        channel: log.channel,
        recipient: log.recipient,
        subject: log.subject,
        status: log.status,
        error_message: log.error_message,
        sent_at: log.sent_at,
        created_at: log.created_at,
        is_test: log.is_test,
      };
    });

    // Build metadata
    const metadata: PaginationMetadata = {
      total,
      total_pages: totalPages,
      current_page: page,
      per_page: limit,
    };

    return NextResponse.json({
      logs: transformedLogs,
      metadata,
    });
  } catch (error) {
    console.error('[Admin API] Error fetching notification logs:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch notification logs';

    // Check for unauthorized error
    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
