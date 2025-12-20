/**
 * Admin Appointments API Route
 * GET /api/admin/appointments - List appointments with filters, search, and pagination
 * POST /api/admin/appointments - Create appointment manually
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { z } from 'zod';
import { calculatePrice } from '@/lib/booking/pricing';
import type { Appointment, User, Pet, Service, PetSize, ServiceWithPrices, Addon } from '@/types/database';
import type { CreateAppointmentResponse } from '@/types/admin-appointments';

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

      console.log('[Admin API] Total appointments in store:', appointments.length);
      console.log('[Admin API] Date filters - from:', dateFrom, 'to:', dateTo);

      // Apply filters
      if (status) {
        appointments = appointments.filter((apt) => apt.status === status);
      }

      if (service) {
        appointments = appointments.filter((apt) => apt.service_id === service);
      }

      if (dateFrom) {
        const dateFromDate = new Date(dateFrom);
        console.log('[Admin API] Filtering by dateFrom:', dateFromDate);
        appointments = appointments.filter(
          (apt) => new Date(apt.scheduled_at) >= dateFromDate
        );
        console.log('[Admin API] After dateFrom filter:', appointments.length);
      }

      if (dateTo) {
        const dateToEnd = new Date(dateTo);
        dateToEnd.setHours(23, 59, 59, 999);
        console.log('[Admin API] Filtering by dateTo:', dateToEnd);
        appointments = appointments.filter(
          (apt) => new Date(apt.scheduled_at) <= dateToEnd
        );
        console.log('[Admin API] After dateTo filter:', appointments.length);
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

      console.log('[Admin API] Returning', enrichedAppointments.length, 'enriched appointments');
      if (enrichedAppointments.length > 0) {
        console.log('[Admin API] Sample appointment:', {
          id: enrichedAppointments[0].id,
          scheduled_at: enrichedAppointments[0].scheduled_at,
          customer: enrichedAppointments[0].customer?.email,
          pet: enrichedAppointments[0].pet?.name,
          service: enrichedAppointments[0].service?.name,
        });
      }

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

/**
 * Validation schema for manual appointment creation
 */
const CreateAppointmentSchema = z.object({
  customer: z.object({
    id: z.string().uuid().optional(),
    first_name: z.string().min(1).max(100),
    last_name: z.string().min(1).max(100),
    email: z.string().email().trim().toLowerCase(),
    phone: z.string().min(10),
  }),
  pet: z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    breed_id: z.string().uuid().optional(),
    breed_name: z.string().optional(),
    size: z.enum(['small', 'medium', 'large', 'xlarge', 'x-large']),
    weight: z.number().min(0).max(300).optional(),
  }),
  service_id: z.string().uuid(),
  addon_ids: z.array(z.string().uuid()).default([]),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().max(1000).optional(),
  payment_status: z.enum(['pending', 'paid', 'deposit_paid']).default('pending'),
  payment_details: z
    .object({
      amount_paid: z.number().min(0),
      payment_method: z.enum(['cash', 'card', 'other']),
    })
    .optional(),
  send_notification: z.boolean().default(true),
});

/**
 * POST handler for creating appointments manually
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user: adminUser } = await requireAdmin(supabase);

    // Parse and validate request body
    const body = await request.json();
    const validationResult = CreateAppointmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          validation_errors: validationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Normalize pet size
    const petSize = (data.pet.size === 'x-large' ? 'xlarge' : data.pet.size) as PetSize;

    // 1. Customer matching with activation flow
    let customerId: string;
    let customerCreated = false;
    let customerStatus: 'active' | 'inactive' = 'active';

    if (data.customer.id) {
      // Use existing customer ID
      customerId = data.customer.id;

      // Check customer status
      const { data: existingCustomer } = await supabase
        .from('users')
        .select('is_active')
        .eq('id', customerId)
        .single();

      customerStatus = existingCustomer?.is_active ? 'active' : 'inactive';
    } else {
      // Search by email (case-insensitive)
      const { data: existingCustomer } = await supabase
        .from('users')
        .select('id, is_active')
        .ilike('email', data.customer.email)
        .eq('role', 'customer')
        .maybeSingle();

      if (existingCustomer) {
        // Use existing customer
        customerId = existingCustomer.id;
        customerStatus = existingCustomer.is_active ? 'active' : 'inactive';
      } else {
        // Create inactive profile
        const { data: newCustomer, error: customerError } = await supabase
          .from('users')
          .insert({
            email: data.customer.email,
            phone: data.customer.phone,
            first_name: data.customer.first_name,
            last_name: data.customer.last_name,
            role: 'customer',
            is_active: false,
            created_by_admin: true,
          })
          .select('id')
          .single();

        if (customerError || !newCustomer) {
          console.error('Error creating customer:', customerError);
          return NextResponse.json(
            { error: 'Failed to create customer profile' },
            { status: 500 }
          );
        }

        customerId = newCustomer.id;
        customerCreated = true;
        customerStatus = 'inactive';
      }
    }

    // 2. Pet matching
    let petId: string;
    let petCreated = false;

    if (data.pet.id) {
      // Use existing pet ID
      petId = data.pet.id;
    } else {
      // Search for existing pet by name and owner
      const { data: existingPet } = await supabase
        .from('pets')
        .select('id')
        .eq('owner_id', customerId)
        .ilike('name', data.pet.name)
        .maybeSingle();

      if (existingPet) {
        petId = existingPet.id;
      } else {
        // Create new pet
        const { data: newPet, error: petError } = await supabase
          .from('pets')
          .insert({
            owner_id: customerId,
            name: data.pet.name,
            breed_id: data.pet.breed_id || null,
            breed_custom: data.pet.breed_name || null,
            size: petSize,
            weight: data.pet.weight || null,
          })
          .select('id')
          .single();

        if (petError || !newPet) {
          console.error('Error creating pet:', petError);
          return NextResponse.json(
            { error: 'Failed to create pet profile' },
            { status: 500 }
          );
        }

        petId = newPet.id;
        petCreated = true;
      }
    }

    // 3. Fetch service and calculate pricing
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select(`
        id,
        name,
        duration_minutes,
        prices:service_prices(size, price)
      `)
      .eq('id', data.service_id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Fetch addons
    let addons: Addon[] = [];
    if (data.addon_ids.length > 0) {
      const { data: addonsData, error: addonsError } = await supabase
        .from('addons')
        .select('id, name, price')
        .in('id', data.addon_ids);

      if (!addonsError && addonsData) {
        addons = addonsData;
      }
    }

    // Calculate total price
    const priceBreakdown = calculatePrice(
      service as unknown as ServiceWithPrices,
      petSize,
      addons
    );

    // 4. Create appointment
    const scheduledAt = new Date(`${data.appointment_date}T${data.appointment_time}:00`);

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        customer_id: customerId,
        pet_id: petId,
        service_id: data.service_id,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: service.duration_minutes,
        status: 'pending',
        payment_status: data.payment_status,
        total_price: priceBreakdown.total,
        notes: data.notes || null,
        creation_method: 'manual_admin',
        created_by_admin_id: adminUser.id,
      })
      .select('*')
      .single();

    if (appointmentError || !appointment) {
      console.error('Error creating appointment:', appointmentError);
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    // 5. Create appointment addons
    if (data.addon_ids.length > 0) {
      const addonRecords = addons.map((addon) => ({
        appointment_id: appointment.id,
        addon_id: addon.id,
        price: addon.price,
      }));

      const { error: addonsInsertError } = await supabase
        .from('appointment_addons')
        .insert(addonRecords);

      if (addonsInsertError) {
        console.error('Error creating appointment addons:', addonsInsertError);
        // Don't fail the entire operation
      }
    }

    // 6. Create payment record if paid/partially paid
    if (
      (data.payment_status === 'paid' || data.payment_status === 'deposit_paid') &&
      data.payment_details
    ) {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          appointment_id: appointment.id,
          customer_id: customerId,
          amount: data.payment_details.amount_paid,
          tip_amount: 0,
          status: data.payment_status === 'paid' ? 'succeeded' : 'pending',
          payment_method: data.payment_details.payment_method,
        });

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        // Don't fail the entire operation
      }
    }

    // 7. Send notification only to active customers
    if (data.send_notification && customerStatus === 'active') {
      // TODO: Integrate with notification service
      console.log('Would send notification to active customer:', customerId);
    }

    // Return success response
    const response: CreateAppointmentResponse = {
      success: true,
      appointment_id: appointment.id,
      customer_created: customerCreated,
      customer_status: customerStatus,
      pet_created: petCreated,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error in create appointment API:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
