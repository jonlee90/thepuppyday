/**
 * Customers List API Route
 * GET /api/admin/customers - Get customers with DB-level search, sort, and pagination
 * Task 0017: Create /api/admin/customers API route
 *
 * Scalability: All filtering, sorting, and pagination happen in the database.
 * Related data (pets, appointments, flags) is fetched only for the current page.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase/mock client type compat */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { config } from '@/lib/config';
import { escapeLikePattern } from '@/lib/utils/validation';

// Inline types — the generated database.ts does not export these as named types.
// These match the shape returned by Supabase queries on the respective tables.
interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  created_at: string;
  [key: string]: unknown;
}

interface Pet {
  id: string;
  owner_id: string;
  name: string;
  is_active: boolean;
  [key: string]: unknown;
}

interface Appointment {
  id: string;
  customer_id: string;
  [key: string]: unknown;
}

interface CustomerFlag {
  id: string;
  customer_id: string;
  is_active: boolean;
  [key: string]: unknown;
}

interface CustomerWithStats extends User {
  pets_count: number;
  appointments_count: number;
  flags: CustomerFlag[];
}

/**
 * GET - List customers with search, pagination, and sorting
 *
 * Query params:
 *   search     - filter by name, email, or phone (ilike)
 *   sortBy     - 'name' | 'email' | 'join_date' | 'appointments'
 *   sortOrder  - 'asc' | 'desc'
 *   page       - 1-based page number
 *   limit      - items per page (default 25, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const serviceClient = createServiceRoleClient();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const offset = (page - 1) * limit;

    // --- Mock mode: fetch all and filter/sort/paginate in JS ---
    // The mock Supabase client does not support .or(), { count: 'exact' },
    // or .ilike() with proper wildcard semantics, so we fall back to the
    // in-memory approach. This path is only hit in development.
    if (config.useMocks) {
      return handleMockMode(serviceClient, { search, sortBy, sortOrder, page, limit, offset });
    }

    // --- Production mode: DB-level operations ---
    return handleProductionMode(serviceClient, { search, sortBy, sortOrder, page, limit, offset });
  } catch (error) {
    console.error('[Customers API] GET error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────
// Production mode: DB-level search, sort, paginate
// ─────────────────────────────────────────────────────

interface QueryParams {
  search: string;
  sortBy: string;
  sortOrder: string;
  page: number;
  limit: number;
  offset: number;
}

async function handleProductionMode(
  serviceClient: ReturnType<typeof createServiceRoleClient>,
  params: QueryParams
) {
  const { search, sortBy, sortOrder, page, limit, offset } = params;
  const ascending = sortOrder === 'asc';

  // 1. Build the base query
  let query = (serviceClient as any)
    .from('users')
    .select('*', { count: 'exact' })
    .eq('role', 'customer');

  // 2. Apply search filter in DB using .or() with ilike
  if (search) {
    const escaped = escapeLikePattern(search);
    const pattern = `%${escaped}%`;
    query = query.or(
      `first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`
    );
  }

  // 3. Apply sorting in DB
  // Note: 'appointments' sort falls back to 'created_at' because it requires
  // a subquery/RPC that is not yet implemented. TODO: Add RPC for appointment count sort.
  switch (sortBy) {
    case 'email':
      query = query.order('email', { ascending });
      break;
    case 'join_date':
      query = query.order('created_at', { ascending });
      break;
    case 'appointments':
      // Fallback: sort by created_at for now (DB-level appointment count sort
      // would require a view or RPC). The client still sees correct counts.
      query = query.order('created_at', { ascending: false });
      break;
    case 'name':
    default:
      query = query.order('last_name', { ascending }).order('first_name', { ascending });
      break;
  }

  // 4. Paginate in DB
  query = query.range(offset, offset + limit - 1);

  // 5. Execute
  const { data: customers, error: customersError, count: totalCount } = await query;

  if (customersError) {
    console.error('[Customers API] Error fetching customers:', customersError);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }

  const customerList = (customers || []) as User[];
  const total = totalCount ?? customerList.length;

  if (customerList.length === 0) {
    return NextResponse.json({
      data: [],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }

  // 6. Fetch related data only for this page's customer IDs
  const customerIds = customerList.map((c) => c.id);

  const [
    { data: pets },
    { data: appointments },
    { data: flags },
  ] = await Promise.all([
    (serviceClient as any)
      .from('pets')
      .select('id, owner_id')
      .in('owner_id', customerIds)
      .eq('is_active', true),
    (serviceClient as any)
      .from('appointments')
      .select('id, customer_id')
      .in('customer_id', customerIds),
    (serviceClient as any)
      .from('customer_flags')
      .select('*')
      .in('customer_id', customerIds)
      .eq('is_active', true),
  ]);

  // 7. Build lookup maps for O(n) merge
  const petCountMap = new Map<string, number>();
  for (const pet of (pets || []) as Pick<Pet, 'id' | 'owner_id'>[]) {
    petCountMap.set(pet.owner_id, (petCountMap.get(pet.owner_id) || 0) + 1);
  }

  const appointmentCountMap = new Map<string, number>();
  for (const apt of (appointments || []) as Pick<Appointment, 'id' | 'customer_id'>[]) {
    appointmentCountMap.set(apt.customer_id, (appointmentCountMap.get(apt.customer_id) || 0) + 1);
  }

  const flagsMap = new Map<string, CustomerFlag[]>();
  for (const flag of (flags || []) as CustomerFlag[]) {
    const existing = flagsMap.get(flag.customer_id) || [];
    existing.push(flag);
    flagsMap.set(flag.customer_id, existing);
  }

  // 8. Merge stats into customer records
  const customersWithStats: CustomerWithStats[] = customerList.map((customer) => ({
    ...customer,
    pets_count: petCountMap.get(customer.id) || 0,
    appointments_count: appointmentCountMap.get(customer.id) || 0,
    flags: flagsMap.get(customer.id) || [],
  }));

  return NextResponse.json({
    data: customersWithStats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// ─────────────────────────────────────────────────────
// Mock mode: in-memory search, sort, paginate
// ─────────────────────────────────────────────────────

async function handleMockMode(
  serviceClient: ReturnType<typeof createServiceRoleClient>,
  params: QueryParams
) {
  const { search, sortBy, sortOrder, page, limit, offset } = params;

  // Fetch all data in parallel (mock store is in-memory, so this is fine)
  const [
    { data: allCustomers, error: customersError },
    { data: allPets },
    { data: allAppointments },
    { data: allFlags },
  ] = await Promise.all([
    (serviceClient as any)
      .from('users')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false }),
    (serviceClient as any)
      .from('pets')
      .select('id, owner_id, name, is_active'),
    (serviceClient as any)
      .from('appointments')
      .select('id, customer_id'),
    (serviceClient as any)
      .from('customer_flags')
      .select('*')
      .eq('is_active', true),
  ]);

  if (customersError) {
    console.error('[Customers API] Error fetching customers:', customersError);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }

  const pets = (allPets || []) as Pet[];
  const appointments = (allAppointments || []) as Appointment[];
  const flags = (allFlags || []) as CustomerFlag[];

  // Build stats
  const customersWithStats: CustomerWithStats[] = (allCustomers || []).map((customer: User) => {
    const customerPets = pets.filter((p) => p.owner_id === customer.id && p.is_active);
    const customerAppointments = appointments.filter((a) => a.customer_id === customer.id);
    const customerFlags = flags.filter((f) => f.customer_id === customer.id);

    return {
      ...customer,
      pets_count: customerPets.length,
      appointments_count: customerAppointments.length,
      flags: customerFlags,
    };
  });

  // Search filter (in JS for mock mode)
  let filtered = customersWithStats;
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = customersWithStats.filter((customer) => {
      const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
      const email = customer.email.toLowerCase();
      const phone = customer.phone?.toLowerCase() || '';

      if (
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        phone.includes(searchLower)
      ) {
        return true;
      }

      // Search in pet names
      const customerPets = pets.filter((p) => p.owner_id === customer.id && p.is_active);
      return customerPets.some((pet) =>
        pet.name.toLowerCase().includes(searchLower)
      );
    });
  }

  // Sort (in JS for mock mode)
  filtered.sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'appointments':
        aValue = a.appointments_count;
        bValue = b.appointments_count;
        break;
      case 'join_date':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'name':
      default:
        aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
        bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
        break;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate (in JS for mock mode)
  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    data: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
