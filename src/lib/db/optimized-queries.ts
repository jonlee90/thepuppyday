/**
 * Optimized Database Queries
 * Task 0227: Optimize database queries with parallel fetching
 *
 * Provides helper functions for parallel query execution,
 * query timing, and cursor-based pagination
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Query timing threshold in milliseconds
 * Queries exceeding this will be logged for optimization
 */
const SLOW_QUERY_THRESHOLD = 500;

/**
 * Log slow queries for monitoring and optimization
 */
function logSlowQuery(queryName: string, duration: number, details?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[Slow Query] ${queryName} took ${duration}ms`, details || '');
  }

  // In production, you would send this to a monitoring service
  // Example: sendToMonitoring({ type: 'slow_query', queryName, duration, details });
}

/**
 * Execute a query with timing
 */
async function timedQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - start;

    if (duration > SLOW_QUERY_THRESHOLD) {
      logSlowQuery(queryName, duration);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[Query Error] ${queryName} failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Dashboard Data Structure
 */
export interface DashboardData {
  todayAppointments: any[];
  upcomingAppointments: any[];
  pendingAppointments: any[];
  recentCustomers: any[];
  stats: {
    todayCount: number;
    weekCount: number;
    monthRevenue: number;
    activeCustomers: number;
  };
}

/**
 * Get all dashboard data with parallel queries
 * Task 0227: Implement getDashboardData with Promise.all
 */
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createServerSupabaseClient();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Execute all queries in parallel for optimal performance
  const [
    todayAppointmentsResult,
    upcomingAppointmentsResult,
    pendingAppointmentsResult,
    recentCustomersResult,
    todayCountResult,
    weekCountResult,
    monthRevenueResult,
    activeCustomersResult,
  ] = await Promise.all([
    // Today's appointments
    timedQuery('todayAppointments', () =>
      (supabase as any)
        .from('appointments')
        .select('*, pet:pets(*), customer:users!appointments_customer_id_fkey(*)')
        .gte('scheduled_at', `${today}T00:00:00`)
        .lt('scheduled_at', `${today}T23:59:59`)
        .order('scheduled_at')
    ),

    // Upcoming appointments (next 7 days)
    timedQuery('upcomingAppointments', () =>
      (supabase as any)
        .from('appointments')
        .select('*, pet:pets(*), customer:users!appointments_customer_id_fkey(*)')
        .gt('scheduled_at', `${today}T23:59:59`)
        .lte('scheduled_at', weekAgo)
        .order('scheduled_at')
        .limit(10)
    ),

    // Pending appointments
    timedQuery('pendingAppointments', () =>
      (supabase as any)
        .from('appointments')
        .select('*, pet:pets(*), customer:users!appointments_customer_id_fkey(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10)
    ),

    // Recent customers (last 30 days)
    timedQuery('recentCustomers', () =>
      (supabase as any)
        .from('users')
        .select('*')
        .eq('role', 'customer')
        .gte('created_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10)
    ),

    // Stats: Today's appointment count
    timedQuery('todayCount', () =>
      (supabase as any)
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_at', `${today}T00:00:00`)
        .lt('scheduled_at', `${today}T23:59:59`)
    ),

    // Stats: This week's appointment count
    timedQuery('weekCount', () =>
      (supabase as any)
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_at', weekAgo)
    ),

    // Stats: This month's revenue
    timedQuery('monthRevenue', () =>
      (supabase as any)
        .from('appointments')
        .select('total_price')
        .gte('scheduled_at', monthStart)
        .in('status', ['completed', 'confirmed'])
    ),

    // Stats: Active customers (customers with appointments in last 90 days)
    timedQuery('activeCustomers', () =>
      (supabase as any)
        .from('appointments')
        .select('customer_id')
        .gte('scheduled_at', new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString())
    ),
  ]);

  // Calculate month revenue
  const monthRevenue =
    monthRevenueResult.data?.reduce(
      (sum: number, apt: { total_price: number }) => sum + (apt.total_price || 0),
      0
    ) || 0;

  // Count unique active customers
  const uniqueCustomers = new Set(
    activeCustomersResult.data?.map((apt: { customer_id: string }) => apt.customer_id) || []
  );

  return {
    todayAppointments: todayAppointmentsResult.data || [],
    upcomingAppointments: upcomingAppointmentsResult.data || [],
    pendingAppointments: pendingAppointmentsResult.data || [],
    recentCustomers: recentCustomersResult.data || [],
    stats: {
      todayCount: todayCountResult.count || 0,
      weekCount: weekCountResult.count || 0,
      monthRevenue,
      activeCustomers: uniqueCustomers.size,
    },
  };
}

/**
 * Cursor-based pagination parameters
 */
export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Cursor-based pagination result
 */
export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Get customers with cursor-based pagination
 * More efficient than offset-based pagination for large datasets
 */
export async function getCustomersPaginated(
  params: CursorPaginationParams = {}
): Promise<CursorPaginationResult<any>> {
  const supabase = await createServerSupabaseClient();
  const {
    cursor,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = params;

  let query = (supabase as any)
    .from('users')
    .select('*')
    .eq('role', 'customer')
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .limit(limit + 1); // Fetch one extra to determine if there's more

  // Apply cursor if provided
  if (cursor) {
    if (sortOrder === 'desc') {
      query = query.lt(sortBy, cursor);
    } else {
      query = query.gt(sortBy, cursor);
    }
  }

  const { data, error } = await timedQuery('getCustomersPaginated', () => query);

  if (error) {
    throw error;
  }

  const hasMore = data.length > limit;
  const results = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore ? results[results.length - 1][sortBy] : undefined;

  return {
    data: results,
    nextCursor,
    hasMore,
  };
}

/**
 * Get appointments with optimized date range query
 * Only fetches appointments within the visible calendar range
 */
export async function getAppointmentsByDateRange(
  startDate: string,
  endDate: string
): Promise<any[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await timedQuery(
    'getAppointmentsByDateRange',
    () =>
      (supabase as any)
        .from('appointments')
        .select(`
          *,
          pet:pets(*),
          customer:users!appointments_customer_id_fkey(*),
          service:services(*)
        `)
        .gte('scheduled_at', startDate)
        .lte('scheduled_at', endDate)
        .order('scheduled_at')
  );

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Batch fetch pets for multiple customers
 * More efficient than N+1 queries
 */
export async function getPetsByCustomerIds(customerIds: string[]): Promise<Map<string, any[]>> {
  if (customerIds.length === 0) {
    return new Map();
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await timedQuery('getPetsByCustomerIds', () =>
    (supabase as any).from('pets').select('*').in('owner_id', customerIds)
  );

  if (error) {
    throw error;
  }

  // Group pets by owner_id
  const petsMap = new Map<string, any[]>();
  (data || []).forEach((pet: any) => {
    const pets = petsMap.get(pet.owner_id) || [];
    pets.push(pet);
    petsMap.set(pet.owner_id, pets);
  });

  return petsMap;
}

/**
 * Get service availability with caching-friendly query
 * Only fetches appointments for the specific date
 */
export async function getServiceAvailability(
  serviceId: string,
  date: string
): Promise<{ bookedSlots: string[]; capacity: number }> {
  const supabase = await createServerSupabaseClient();

  const [appointmentsResult, serviceResult] = await Promise.all([
    timedQuery('getBookedSlots', () =>
      (supabase as any)
        .from('appointments')
        .select('scheduled_at')
        .eq('service_id', serviceId)
        .gte('scheduled_at', `${date}T00:00:00`)
        .lt('scheduled_at', `${date}T23:59:59`)
        .in('status', ['pending', 'confirmed'])
    ),

    timedQuery('getServiceCapacity', () =>
      (supabase as any).from('services').select('max_concurrent').eq('id', serviceId).single()
    ),
  ]);

  const bookedSlots =
    appointmentsResult.data?.map((apt: { scheduled_at: string }) =>
      new Date(apt.scheduled_at).toISOString()
    ) || [];

  return {
    bookedSlots,
    capacity: serviceResult.data?.max_concurrent || 1,
  };
}

/**
 * Prefetch data for faster navigation
 * Useful for preloading data before route transitions
 */
export async function prefetchAppointmentData(appointmentId: string): Promise<any> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await timedQuery('prefetchAppointmentData', () =>
    (supabase as any)
      .from('appointments')
      .select(`
        *,
        pet:pets(*),
        customer:users!appointments_customer_id_fkey(*),
        service:services(*),
        addons:appointment_addons(*, addon:addons(*)),
        report_card:report_cards(*)
      `)
      .eq('id', appointmentId)
      .single()
  );

  if (error) {
    throw error;
  }

  return data;
}
