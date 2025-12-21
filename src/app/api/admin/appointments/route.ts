/**
 * Admin Appointments API Route
 * GET /api/admin/appointments - List appointments with filters, search, and pagination
 * POST /api/admin/appointments - Create appointment manually
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { z } from 'zod';
import { calculatePrice } from '@/lib/booking/pricing';
import { generateWalkinEmail } from '@/lib/utils';
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
    // Email is optional for walk-in customers
    email: z.string().email().trim().toLowerCase().optional().or(z.literal('')),
    phone: z.string().min(10),
    isNew: z.boolean().optional(), // Track if this is a new customer from walk-in
  }),
  pet: z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    breed_id: z
      .union([z.string().uuid(), z.literal(''), z.null(), z.undefined()])
      .transform((val) => (val && val !== '' ? val : undefined)),
    breed_name: z.string().optional(),
    size: z.enum(['small', 'medium', 'large', 'xlarge', 'x-large']),
    weight: z.number().min(0).max(300).optional(),
    isNew: z.boolean().optional(), // Track if this is a new pet from walk-in
  }),
  service_id: z.string().uuid(),
  addon_ids: z.array(z.string().uuid()).default([]),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().max(1000).optional(),
  payment_status: z.enum(['pending', 'paid', 'partially_paid']).default('pending'),
  payment_details: z
    .object({
      amount_paid: z.number().min(0),
      payment_method: z.enum(['cash', 'card', 'check', 'venmo', 'zelle', 'other']),
    })
    .optional(),
  send_notification: z.boolean().default(true),
  source: z.enum(['walk_in', 'phone', 'online', 'admin']).optional(), // Track appointment creation source
});

/**
 * POST handler for creating appointments manually
 */
export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabaseClient();
    const { user: adminUser } = await requireAdmin(authSupabase);

    // Use service role client for admin operations that bypass RLS
    const supabase = createServiceRoleClient();

    // Parse and validate request body
    const body = await request.json();
    console.log('[Create Appointment] Received body:', JSON.stringify(body, null, 2));

    const validationResult = CreateAppointmentSchema.safeParse(body);
    console.log('[Create Appointment] Validation result:', validationResult.success, validationResult.error?.errors);

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
      // Search for existing customer - by email if provided, otherwise by phone
      let existingCustomer = null;

      if (data.customer.email && data.customer.email !== '') {
        // Search by email (case-insensitive)
        const { data: customerByEmail } = await supabase
          .from('users')
          .select('id, is_active')
          .ilike('email', data.customer.email)
          .eq('role', 'customer')
          .maybeSingle();
        existingCustomer = customerByEmail;
      }

      // If no email or not found by email, try searching by phone
      if (!existingCustomer && data.customer.phone) {
        const { data: customerByPhone } = await supabase
          .from('users')
          .select('id, is_active')
          .eq('phone', data.customer.phone)
          .eq('role', 'customer')
          .maybeSingle();
        existingCustomer = customerByPhone;
      }

      if (existingCustomer) {
        // Use existing customer
        customerId = existingCustomer.id;
        customerStatus = existingCustomer.is_active ? 'active' : 'inactive';
      } else {
        // Create inactive profile
        // For walk-in customers without email, generate a placeholder email
        // This satisfies the NOT NULL constraint while keeping the customer identifiable by phone
        const customerEmail = data.customer.email && data.customer.email !== ''
          ? data.customer.email
          : generateWalkinEmail(data.customer.phone);

        console.log('[Create Appointment] Creating new customer with data:', {
          email: customerEmail,
          phone: data.customer.phone,
          first_name: data.customer.first_name,
          last_name: data.customer.last_name,
          isWalkinPlaceholder: !data.customer.email || data.customer.email === '',
        });

        const { data: newCustomer, error: customerError } = await supabase
          .from('users')
          .insert({
            email: customerEmail,
            phone: data.customer.phone,
            first_name: data.customer.first_name,
            last_name: data.customer.last_name,
            role: 'customer',
            is_active: false,
            created_by_admin: true,
          })
          .select('id')
          .single();

        console.log('[Create Appointment] Customer insert result:', { newCustomer, customerError });

        if (customerError || !newCustomer) {
          console.error('Error creating customer:', customerError);
          console.error('Customer data being inserted:', {
            email: customerEmail,
            phone: data.customer.phone,
            first_name: data.customer.first_name,
            last_name: data.customer.last_name,
            role: 'customer',
            is_active: false,
            created_by_admin: true,
          });
          return NextResponse.json(
            {
              error: 'Failed to create customer profile',
              details: customerError?.message || 'Unknown error - newCustomer is null'
            },
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

    // In mock mode, relationship queries might not work, so fetch prices separately if needed
    let servicePrices = service.prices;
    if (!servicePrices || !Array.isArray(servicePrices)) {
      const { data: pricesData } = await supabase
        .from('service_prices')
        .select('size, price')
        .eq('service_id', data.service_id);
      servicePrices = pricesData || [];
    }

    // Merge prices into service object for calculatePrice
    const serviceWithPrices = { ...service, prices: servicePrices };

    // Fetch addons
    let addons: Addon[] = [];
    if (data.addon_ids && data.addon_ids.length > 0) {
      const { data: addonsData, error: addonsError } = await supabase
        .from('addons')
        .select('id, name, price')
        .in('id', data.addon_ids);

      if (addonsError) {
        console.error('[Create Appointment] Error fetching addons:', addonsError);
        // Continue with empty addons array rather than failing
      }

      // Ensure we always have an array (Supabase can return null)
      addons = Array.isArray(addonsData) ? (addonsData as Addon[]) : [];

      console.log('[Create Appointment] Requested addon IDs:', data.addon_ids);
      console.log('[Create Appointment] Fetched addons:', addons.length, 'addons');

      // Warn if mismatch between requested and fetched addons
      if (addons.length !== data.addon_ids.length) {
        console.warn(
          `[Create Appointment] Addon count mismatch: requested ${data.addon_ids.length}, fetched ${addons.length}`
        );
      }
    }

    // Calculate total price - ensure all parameters are valid
    let priceBreakdown;
    try {
      priceBreakdown = calculatePrice(
        serviceWithPrices as unknown as ServiceWithPrices,
        petSize,
        addons
      );
      console.log('[Create Appointment] Price breakdown calculated:', {
        servicePrice: priceBreakdown.servicePrice,
        addonsTotal: priceBreakdown.addonsTotal,
        total: priceBreakdown.total,
      });
    } catch (priceError) {
      console.error('[Create Appointment] Error calculating price:', priceError);
      return NextResponse.json(
        {
          error: 'Failed to calculate appointment price',
          details: priceError instanceof Error ? priceError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

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
    if (data.addon_ids && Array.isArray(data.addon_ids) && data.addon_ids.length > 0) {
      if (Array.isArray(addons) && addons.length > 0) {
        try {
          const addonRecords = addons.map((addon) => ({
            appointment_id: appointment.id,
            addon_id: addon.id,
            price: addon.price,
          }));

          console.log('[Create Appointment] Inserting addon records:', addonRecords.length);

          const { error: addonsInsertError } = await supabase
            .from('appointment_addons')
            .insert(addonRecords);

          if (addonsInsertError) {
            console.error('[Create Appointment] Error creating appointment addons:', addonsInsertError);
            // Don't fail the entire operation - appointment is already created
          } else {
            console.log('[Create Appointment] Successfully inserted', addonRecords.length, 'addon records');
          }
        } catch (addonError) {
          console.error('[Create Appointment] Exception during addon insertion:', addonError);
          // Don't fail - appointment is already created
        }
      } else {
        console.warn('[Create Appointment] Addon IDs provided but no addons fetched. Requested:', data.addon_ids);
      }
    }

    // 6. Create payment record if paid/partially paid
    if (
      (data.payment_status === 'paid' || data.payment_status === 'partially_paid') &&
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
