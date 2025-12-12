/**
 * Admin Appointments API Route
 * GET /api/admin/appointments - List appointments with filters, search, and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { Appointment, User, Pet, Service } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const service = searchParams.get('service') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const sortBy = searchParams.get('sortBy') || 'scheduled_at';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const offset = (page - 1) * limit;

    // In mock mode, query from mock store
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();

      // Get all appointments
      let appointments = store.select('appointments', {
        order: { column: sortBy, ascending: sortOrder === 'asc' },
      }) as unknown as Appointment[];

      // Apply filters
      if (status) {
        appointments = appointments.filter((apt) => apt.status === status);
      }

      if (service) {
        appointments = appointments.filter((apt) => apt.service_id === service);
      }

      if (dateFrom) {
        appointments = appointments.filter(
          (apt) => new Date(apt.scheduled_at) >= new Date(dateFrom)
        );
      }

      if (dateTo) {
        const dateToEnd = new Date(dateTo);
        dateToEnd.setHours(23, 59, 59, 999);
        appointments = appointments.filter(
          (apt) => new Date(apt.scheduled_at) <= dateToEnd
        );
      }

      // Apply search
      if (search) {
        const searchLower = search.toLowerCase();
        appointments = appointments.filter((apt) => {
          const customer = store.selectById('users', apt.customer_id) as User | null;
          const pet = store.selectById('pets', apt.pet_id) as Pet | null;
          const service = store.selectById('services', apt.service_id) as Service | null;

          const customerName = customer
            ? `${customer.first_name} ${customer.last_name}`.toLowerCase()
            : '';
          const petName = pet?.name?.toLowerCase() || '';
          const serviceName = service?.name?.toLowerCase() || '';
          const email = customer?.email?.toLowerCase() || '';
          const phone = customer?.phone?.toLowerCase() || '';

          return (
            customerName.includes(searchLower) ||
            petName.includes(searchLower) ||
            serviceName.includes(searchLower) ||
            email.includes(searchLower) ||
            phone.includes(searchLower)
          );
        });
      }

      // Get total count
      const totalCount = appointments.length;

      // Apply pagination
      const paginatedAppointments = appointments.slice(offset, offset + limit);

      // Enrich with related data
      const enrichedAppointments = paginatedAppointments.map((apt) => ({
        ...apt,
        customer: store.selectById('users', apt.customer_id) as User | null,
        pet: store.selectById('pets', apt.pet_id) as Pet | null,
        service: store.selectById('services', apt.service_id) as Service | null,
        groomer: apt.groomer_id
          ? (store.selectById('users', apt.groomer_id) as User | null)
          : null,
      }));

      return NextResponse.json({
        data: enrichedAppointments,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    }

    // Production Supabase query
    let query = (supabase as any)
      .from('appointments')
      .select(
        `
        *,
        customer:users!customer_id(*),
        pet:pets(*),
        service:services(*),
        groomer:users!groomer_id(*)
      `,
        { count: 'exact' }
      )
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (service) {
      query = query.eq('service_id', service);
    }

    if (dateFrom) {
      query = query.gte('scheduled_at', dateFrom);
    }

    if (dateTo) {
      const dateToEnd = new Date(dateTo);
      dateToEnd.setHours(23, 59, 59, 999);
      query = query.lte('scheduled_at', dateToEnd.toISOString());
    }

    // Apply search
    // TODO: Implement proper full-text search with Supabase textSearch
    // The following code is commented out due to SQL injection vulnerability
    // in string interpolation. Need to use Supabase's textSearch or parameterized queries.
    // For now, search is disabled in production mode.
    // if (search) {
    //   query = query.textSearch('fts', search);
    // }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query;

    if (error) {
      console.error('[Admin API] Error fetching appointments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('[Admin API] Error in appointments route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
