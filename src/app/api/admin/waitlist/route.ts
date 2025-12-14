/**
 * Admin Waitlist API Route
 * GET /api/admin/waitlist
 *
 * Fetches waitlist entries with filtering, sorting, and pagination.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';
import type { WaitlistStatus, TimePreference } from '@/types/database';

export const dynamic = 'force-dynamic';

interface WaitlistQueryParams {
  status?: WaitlistStatus | WaitlistStatus[];
  service_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  sort_by?: 'requested_date' | 'created_at' | 'priority';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * GET /api/admin/waitlist
 *
 * Query Parameters:
 * - status: Filter by status (can be array)
 * - service_id: Filter by service
 * - start_date: Filter by requested date (start)
 * - end_date: Filter by requested date (end)
 * - search: Search customer name, pet name, phone
 * - sort_by: Sort field (requested_date, created_at, priority)
 * - sort_order: Sort direction (asc, desc)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 25)
 *
 * Response:
 * - entries: Array of waitlist entries with joined data
 * - total: Total count (for pagination)
 * - page: Current page
 * - limit: Items per page
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check admin authorization
    const admin = await requireAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params: WaitlistQueryParams = {
      status: searchParams.get('status')
        ? searchParams.get('status')!.split(',') as WaitlistStatus[]
        : undefined,
      service_id: searchParams.get('service_id') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: (searchParams.get('sort_by') as WaitlistQueryParams['sort_by']) || 'requested_date',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'asc',
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '25', 10),
    };

    // Build query
    let query = (supabase as any)
      .from('waitlist')
      .select(
        `
        *,
        customer:users!customer_id(id, full_name, email, phone),
        pet:pets!pet_id(id, name, breed_id),
        service:services!service_id(id, name)
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (params.status && params.status.length > 0) {
      query = query.in('status', params.status);
    }

    if (params.service_id) {
      query = query.eq('service_id', params.service_id);
    }

    if (params.start_date) {
      query = query.gte('requested_date', params.start_date);
    }

    if (params.end_date) {
      query = query.lte('requested_date', params.end_date);
    }

    // Apply search (if provided, search across customer name, pet name, phone)
    // Note: This requires a more complex approach since we're searching joined tables
    // For now, we'll fetch all and filter in memory if search is provided
    // TODO: Optimize with database-level full-text search in production

    // Apply sorting
    const sortField = params.sort_by === 'priority' ? 'created_at' : params.sort_by!;
    query = query.order(sortField, { ascending: params.sort_order === 'asc' });

    // Apply pagination
    const offset = (params.page! - 1) * params.limit!;
    query = query.range(offset, offset + params.limit! - 1);

    // Execute query
    const { data: entries, error, count } = await query;

    if (error) {
      console.error('Error fetching waitlist:', error);
      return NextResponse.json(
        { error: 'Failed to fetch waitlist' },
        { status: 500 }
      );
    }

    // Apply client-side search filter if needed
    let filteredEntries = entries || [];
    if (params.search && filteredEntries.length > 0) {
      const searchLower = params.search.toLowerCase();
      filteredEntries = filteredEntries.filter((entry: any) => {
        const customerName = entry.customer?.full_name?.toLowerCase() || '';
        const petName = entry.pet?.name?.toLowerCase() || '';
        const phone = entry.customer?.phone?.toLowerCase() || '';
        return (
          customerName.includes(searchLower) ||
          petName.includes(searchLower) ||
          phone.includes(searchLower)
        );
      });
    }

    return NextResponse.json(
      {
        entries: filteredEntries,
        total: count || 0,
        page: params.page,
        limit: params.limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in waitlist API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
