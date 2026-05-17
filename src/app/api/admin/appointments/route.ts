/**
 * Admin Appointments API Route
 * GET /api/admin/appointments - List appointments with filters, search, and pagination
 * POST /api/admin/appointments - Create appointment manually
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse, after } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { getTodayInBusinessTimezone } from '@/lib/utils/timezone';
import { z } from 'zod';
import { calculatePrice } from '@/lib/booking/pricing';
import { triggerBookingConfirmation, triggerAdminNewBooking } from '@/lib/notifications/triggers';
import { generateWalkinEmail } from '@/lib/utils';
import type { Appointment, User, Pet, Service, PetSize, ServiceWithPrices, Addon } from '@/types/database';
import type { CreateAppointmentResponse } from '@/types/admin-appointments';

// Status priority order for sorting (module-scope: init once per server boot)
const STATUS_PRIORITY: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  in_progress: 2,
  completed: 3,
  cancelled: 4,
  no_show: 5,
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();
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

    // Date priority sort: today → future → past, then by status priority within each group
    const { todayStart, todayEnd } = getTodayInBusinessTimezone();
    function datePrioritySort(a: { scheduled_at: string; status: string }, b: { scheduled_at: string; status: string }): number {
      const aDate = new Date(a.scheduled_at);
      const bDate = new Date(b.scheduled_at);
      const todayStartDate = new Date(todayStart);
      const todayEndDate = new Date(todayEnd);
      const aGroup = aDate < todayStartDate ? 2 : aDate > todayEndDate ? 1 : 0;
      const bGroup = bDate < todayStartDate ? 2 : bDate > todayEndDate ? 1 : 0;
      if (aGroup !== bGroup) return aGroup - bGroup;
      // Within same date group, sort by date first
      let dateCmp: number;
      if (aGroup === 2) {
        // Past group: most recent first (descending)
        dateCmp = bDate.getTime() - aDate.getTime();
      } else {
        // Today + Future: ascending
        dateCmp = aDate.getTime() - bDate.getTime();
      }
      if (dateCmp !== 0) return dateCmp;
      // Same date: sort by status priority (pending → confirmed → in_progress → completed → cancelled → no_show)
      return (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99);
    }

    // In mock mode, query from mock store
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();

      // Get all appointments (fetch with scheduled_at order as base)
      let appointments = store.select('appointments', {
        order: { column: 'scheduled_at', ascending: true },
      }) as unknown as Appointment[];

      // Apply sort after fetching
      if (sortBy === 'date_priority') {
        appointments = [...appointments].sort(datePrioritySort);
      } else if (sortBy === 'status_priority') {
        const asc = sortOrder === 'asc';
        appointments = [...appointments].sort((a, b) => {
          const statusDiff = (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99);
          if (statusDiff !== 0) return asc ? statusDiff : -statusDiff;
          // Secondary sort: scheduled_at ascending
          return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
        });
      } else {
        // Re-sort by requested column
        appointments = [...appointments].sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[sortBy];
          const bVal = (b as Record<string, unknown>)[sortBy];
          const cmp = (aVal as string) < (bVal as string) ? -1 : (aVal as string) > (bVal as string) ? 1 : 0;
          return sortOrder === 'asc' ? cmp : -cmp;
        });
      }

      // Apply filters
      if (status) {
        appointments = appointments.filter((apt) => apt.status === status);
      }

      if (service) {
        appointments = appointments.filter((apt) => apt.service_id === service);
      }

      if (dateFrom) {
        const dateFromDate = new Date(dateFrom);
        appointments = appointments.filter(
          (apt) => new Date(apt.scheduled_at) >= dateFromDate
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
    const isStatusPrioritySort = sortBy === 'status_priority';
    const isDatePrioritySort = sortBy === 'date_priority';

    let query = (serviceClient as any)
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
      );

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
    if (isDatePrioritySort) {
      // Bucket order: today+future (ASC) then past (DESC). Split at todayStart so we can
      // page across buckets with two ranged DB queries instead of fetching all rows.
      const SELECT_WITH_JOINS = `
        *,
        customer:users!customer_id(*),
        pet:pets(*),
        service:services(*),
        groomer:users!groomer_id(*)
      `;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const applyFilters = (q: any) => {
        if (status) q = q.eq('status', status);
        if (service) q = q.eq('service_id', service);
        if (dateFrom) q = q.gte('scheduled_at', dateFrom);
        if (dateTo) {
          const dateToEnd = new Date(dateTo);
          dateToEnd.setHours(23, 59, 59, 999);
          q = q.lte('scheduled_at', dateToEnd.toISOString());
        }
        return q;
      };

      const baseQuery = () =>
        // No count — total comes from baseCountQuery() to avoid duplicate COUNT(*) per page.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applyFilters((serviceClient as any).from('appointments').select(SELECT_WITH_JOINS));

      const baseCountQuery = () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applyFilters((serviceClient as any).from('appointments').select('id', { count: 'exact', head: true }));

      const [tfCountRes, pastCountRes] = await Promise.all([
        baseCountQuery().gte('scheduled_at', todayStart),
        baseCountQuery().lt('scheduled_at', todayStart),
      ]);

      if (tfCountRes.error || pastCountRes.error) {
        console.error('[Admin API] Error counting appointments:', tfCountRes.error || pastCountRes.error);
        return NextResponse.json(
          { error: 'Failed to fetch appointments' },
          { status: 500 }
        );
      }

      const tfCount = tfCountRes.count || 0;
      const pastCount = pastCountRes.count || 0;
      const total = tfCount + pastCount;

      const sliceTo = offset + limit;

      const tfFrom = Math.min(offset, tfCount);
      const tfTake = Math.max(0, Math.min(sliceTo, tfCount) - tfFrom);

      const pastFrom = Math.max(0, offset - tfCount);
      const pastTake = Math.max(0, Math.max(0, sliceTo - tfCount) - pastFrom);

      const tfPromise = tfTake > 0
        ? baseQuery()
            .gte('scheduled_at', todayStart)
            .order('scheduled_at', { ascending: true })
            .range(tfFrom, tfFrom + tfTake - 1)
        : Promise.resolve({ data: [], error: null });

      const pastPromise = pastTake > 0
        ? baseQuery()
            .lt('scheduled_at', todayStart)
            .order('scheduled_at', { ascending: false })
            .range(pastFrom, pastFrom + pastTake - 1)
        : Promise.resolve({ data: [], error: null });

      const [tfRes, pastRes] = await Promise.all([tfPromise, pastPromise]);

      if (tfRes.error || pastRes.error) {
        console.error('[Admin API] Error fetching appointments:', tfRes.error || pastRes.error);
        return NextResponse.json(
          { error: 'Failed to fetch appointments' },
          { status: 500 }
        );
      }

      const sortByTimeThenStatus = <T extends { scheduled_at: string; status: string }>(
        rows: T[],
        timeAscending: boolean
      ): T[] =>
        [...rows].sort((a, b) => {
          const t = a.scheduled_at.localeCompare(b.scheduled_at);
          if (t !== 0) return timeAscending ? t : -t;
          return (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99);
        });

      const data = [
        ...sortByTimeThenStatus(tfRes.data || [], true),
        ...sortByTimeThenStatus(pastRes.data || [], false),
      ];

      return NextResponse.json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // For other sort modes, use DB-level ordering and pagination
    if (isStatusPrioritySort) {
      query = query
        .order('status', { ascending: sortOrder === 'asc' })
        .order('scheduled_at', { ascending: false });
    } else {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: rawData, error, count } = await query;

    if (error) {
      console.error('[Admin API] Error fetching appointments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    const data = rawData || [];

    return NextResponse.json({
      data,
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
    // Phone required for new customers (used for lookup/creation); optional when id is provided
    phone: z.union([z.string().min(10), z.literal('')]).optional().default(''),
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
    gender: z.enum(['male', 'female']).default('male'),
    color: z.string().optional().nullable().transform((val) => val ?? undefined),
    isNew: z.boolean().optional(), // Track if this is a new pet from walk-in
  }),
  service_id: z.string().uuid(),
  groomer_id: z.string().uuid().optional().nullable(),
  addon_ids: z.array(z.string().uuid()).default([]),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().max(1000).optional().nullable().transform((val) => val ?? undefined),
  payment_status: z.enum(['pending', 'paid', 'partially_paid']).default('pending'),
  payment_details: z
    .object({
      amount_paid: z.number().min(0),
      payment_method: z.enum(['cash', 'card', 'check', 'venmo', 'zelle', 'other']),
    })
    .optional(),
  send_notification: z.boolean().default(true),
  source: z.enum(['walk_in', 'phone', 'online', 'admin']).optional(), // Track appointment creation source
  // New: price adjustments created during booking
  price_adjustments: z.array(z.object({
    label: z.string().min(1).max(100),
    amount: z.number().refine((n) => n !== 0, { message: 'Amount cannot be zero' }),
    note: z.string().max(500).optional(),
  })).default([]),
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

    const validationResult = CreateAppointmentSchema.safeParse(body);

    if (!validationResult.success) {
      // Safely extract validation errors
      const validationErrors = validationResult.error?.errors?.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })) || [{ field: 'unknown', message: 'Validation failed' }];

      return NextResponse.json(
        {
          error: 'Validation failed',
          validation_errors: validationErrors,
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
            gender: data.pet.gender || 'male',
            color: data.pet.color || null,
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

    // Determine status based on date: backdated appointments are auto-completed
    const now = new Date();
    const isBackdated = scheduledAt < now;
    const appointmentStatus = data.source === 'walk_in'
      ? 'in_progress'
      : isBackdated
        ? 'completed'
        : data.source === 'admin'
          ? 'confirmed'
          : 'pending';

    // Generate unique booking reference
    const { randomBytes } = await import('crypto');
    const generateBookingReference = (): string => {
      const year = new Date().getFullYear();
      const randomValue = randomBytes(3).readUIntBE(0, 3) % 1000000;
      const random = randomValue.toString().padStart(6, '0');
      return `APT-${year}-${random}`;
    };

    let bookingReference = generateBookingReference();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('appointments')
        .select('id')
        .eq('booking_reference', bookingReference)
        .maybeSingle();

      if (!existing) break;

      bookingReference = generateBookingReference();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      const timestamp = Date.now().toString().slice(-6);
      bookingReference = `APT-${new Date().getFullYear()}-${timestamp}`;
    }

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        customer_id: customerId,
        pet_id: petId,
        service_id: data.service_id,
        groomer_id: data.groomer_id || null,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: service.duration_minutes,
        status: appointmentStatus,
        payment_status: data.payment_status,
        total_price: priceBreakdown.total,
        notes: data.notes || null,
        creation_method: 'manual_admin',
        created_by_admin_id: adminUser.id,
        booking_reference: bookingReference,
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

    // --- Critical group: addons + payment ---
    // If either fails, roll back the appointment to avoid inconsistent data.
    // Note: This application-level rollback has a small race condition window.
    // For true atomicity, use a PostgreSQL stored procedure (RPC).
    try {
      // 5. Create appointment addons
      if (data.addon_ids && Array.isArray(data.addon_ids) && data.addon_ids.length > 0) {
        if (Array.isArray(addons) && addons.length > 0) {
          const addonRecords = addons.map((addon) => ({
            appointment_id: appointment.id,
            addon_id: addon.id,
            price: addon.price,
          }));

          const { error: addonsInsertError } = await supabase
            .from('appointment_addons')
            .insert(addonRecords);

          if (addonsInsertError) {
            throw new Error(`Failed to create appointment addons: ${addonsInsertError.message}`);
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
          throw new Error(`Failed to create payment record: ${paymentError.message}`);
        }
      }

      // 7. Insert price adjustments (in parallel)
      if (data.price_adjustments.length > 0) {
        const adjustmentRecords = data.price_adjustments.map((adj) => ({
          appointment_id: appointment.id,
          label: adj.label,
          amount: adj.amount,
          note: adj.note || null,
          created_by: adminUser.id,
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: adjError } = await (supabase as any)
          .from('appointment_price_adjustments')
          .insert(adjustmentRecords);
        if (adjError) {
          throw new Error(`Failed to create price adjustments: ${adjError.message}`);
        }

        // Recalculate total with adjustments and update the appointment
        const adjustmentsTotal = data.price_adjustments.reduce((sum, a) => sum + a.amount, 0);
        const adjustedTotal = Math.max(0, priceBreakdown.total + adjustmentsTotal);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('appointments')
          .update({ total_price: adjustedTotal })
          .eq('id', appointment.id);
      }
    } catch (criticalError) {
      // Rollback: delete the appointment and any addons that may have been created
      console.error('[Create Appointment] Critical operation failed, rolling back appointment:', criticalError);
      try {
        // Delete price adjustments first
        await supabase
          .from('appointment_price_adjustments')
          .delete()
          .eq('appointment_id', appointment.id);
        // Delete addons (foreign key dependency)
        await supabase
          .from('appointment_addons')
          .delete()
          .eq('appointment_id', appointment.id);
        // Delete the appointment
        await supabase
          .from('appointments')
          .delete()
          .eq('id', appointment.id);
      } catch (rollbackError) {
        // Log rollback failure but return the original error to the client
        console.error('[Create Appointment] Rollback failed - manual cleanup may be needed for appointment:', appointment.id, rollbackError);
      }

      return NextResponse.json(
        {
          error: 'Failed to create appointment (rolled back)',
          details: criticalError instanceof Error ? criticalError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // --- Non-critical operations (fire-and-forget) ---
    // These should not block the response or cause the appointment creation to fail.

    // 8. Send notifications (customer + admin) — non-blocking via after()
    after(async () => {
      const notificationPromises: Promise<unknown>[] = [];
      const source = data.source === 'walk_in' ? 'walk_in' as const : 'admin' as const;

      // Customer notification only for active customers who opted in
      if (data.send_notification && customerStatus === 'active') {
        notificationPromises.push(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          triggerBookingConfirmation(supabase as any, {
            appointmentId: appointment.id,
            customerId: customerId,
            customerName: `${data.customer.first_name} ${data.customer.last_name}`,
            customerEmail: data.customer.email || '',
            customerPhone: data.customer.phone || null,
            petName: data.pet.name,
            serviceName: service.name,
            scheduledAt: appointment.scheduled_at,
            totalPrice: appointment.total_price || 0,
            addons: addons.length > 0
              ? addons.map((a) => ({ name: a.name, price: a.price }))
              : undefined,
          })
        );
      }

      // Admin notification always
      notificationPromises.push(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        triggerAdminNewBooking(supabase as any, {
          appointmentId: appointment.id,
          customerName: `${data.customer.first_name} ${data.customer.last_name}`,
          customerEmail: data.customer.email || '',
          customerPhone: data.customer.phone || null,
          petName: data.pet.name,
          serviceName: service.name,
          scheduledAt: appointment.scheduled_at,
          totalPrice: appointment.total_price || 0,
          addons: addons.length > 0
            ? addons.map((a) => ({ name: a.name, price: a.price }))
            : undefined,
          bookingReference: bookingReference,
          source,
        })
      );

      try {
        await Promise.all(notificationPromises);
      } catch (notifError) {
        // Log but do not fail the appointment creation
        console.error('[Admin Appointments] Notification trigger failed:', notifError);
      }
    });

    // 9. Trigger calendar sync (auto-sync) - Task 0025
    // This runs asynchronously and won't block the response
    try {
      const { triggerAutoSyncInBackground } = await import(
        '@/lib/calendar/sync/auto-sync-trigger'
      );

      // Fetch appointment with joined data for sync
      const { data: appointmentForSync } = await supabase
        .from('appointments')
        .select(`
          *,
          customer:users!customer_id (
            first_name,
            last_name,
            email,
            phone
          ),
          pet:pets (
            name,
            size
          ),
          service:services (
            name,
            duration_minutes
          ),
          appointment_addons (
            addon:addons (
              id,
              name,
              duration_minutes
            )
          )
        `)
        .eq('id', appointment.id)
        .single();

      if (appointmentForSync) {
        // Transform to AppointmentForSync format
        const syncData = {
          id: appointmentForSync.id,
          customer_id: appointmentForSync.customer_id,
          pet_id: appointmentForSync.pet_id,
          service_id: appointmentForSync.service_id,
          scheduled_at: appointmentForSync.scheduled_at,
          status: appointmentForSync.status,
          notes: appointmentForSync.notes,
          customer: {
            first_name: appointmentForSync.customer.first_name,
            last_name: appointmentForSync.customer.last_name,
            email: appointmentForSync.customer.email,
            phone: appointmentForSync.customer.phone,
          },
          pet: {
            name: appointmentForSync.pet.name,
            size: appointmentForSync.pet.size,
          },
          service: {
            name: appointmentForSync.service.name,
            duration_minutes: appointmentForSync.service.duration_minutes,
          },
          addons: appointmentForSync.appointment_addons?.map((aa: any) => ({
            addon_id: aa.addon.id,
            addon_name: aa.addon.name,
            duration_minutes: aa.addon.duration_minutes,
          })) || [],
        };

        // Trigger sync in background (fire and forget)
        triggerAutoSyncInBackground(supabase, syncData);
      }
    } catch (syncError) {
      // Log error but don't fail the request
      console.error('[Admin API] Calendar sync error:', syncError);
    }

    // Return success response
    const response: CreateAppointmentResponse = {
      success: true,
      appointment_id: appointment.id,
      booking_reference: bookingReference,
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
