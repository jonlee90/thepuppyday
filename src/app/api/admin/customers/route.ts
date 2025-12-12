/**
 * Customers List API Route
 * GET /api/admin/customers - Get all customers with search, pagination, and sorting
 * Task 0017: Create /api/admin/customers API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { User, Pet, Appointment, CustomerFlag, CustomerMembership } from '@/types/database';

interface CustomerWithStats extends User {
  pets_count: number;
  appointments_count: number;
  flags: CustomerFlag[];
  active_membership: CustomerMembership | null;
}

/**
 * GET - List all customers with search, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch all customers (role = 'customer')
    const { data: allCustomers, error: customersError } = await (supabase as any)
      .from('users')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (customersError) {
      console.error('[Customers API] Error fetching customers:', customersError);
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      );
    }

    // Fetch all pets
    const { data: allPets, error: petsError } = await (supabase as any)
      .from('pets')
      .select('id, owner_id, name, is_active');

    if (petsError) {
      console.error('[Customers API] Error fetching pets:', petsError);
    }

    // Fetch all appointments
    const { data: allAppointments, error: appointmentsError } = await (supabase as any)
      .from('appointments')
      .select('id, customer_id');

    if (appointmentsError) {
      console.error('[Customers API] Error fetching appointments:', appointmentsError);
    }

    // Fetch all customer flags
    const { data: allFlags, error: flagsError } = await (supabase as any)
      .from('customer_flags')
      .select('*')
      .eq('is_active', true);

    if (flagsError) {
      console.error('[Customers API] Error fetching flags:', flagsError);
    }

    // Fetch active memberships
    const { data: allMemberships, error: membershipsError } = await (supabase as any)
      .from('customer_memberships')
      .select('*, membership:memberships(*)')
      .eq('status', 'active');

    if (membershipsError) {
      console.error('[Customers API] Error fetching memberships:', membershipsError);
    }

    // Build customer stats
    const pets = (allPets || []) as Pet[];
    const appointments = (allAppointments || []) as Appointment[];
    const flags = (allFlags || []) as CustomerFlag[];
    const memberships = (allMemberships || []) as CustomerMembership[];

    const customersWithStats: CustomerWithStats[] = (allCustomers || []).map((customer: User) => {
      const customerPets = pets.filter((p) => p.owner_id === customer.id && p.is_active);
      const customerAppointments = appointments.filter((a) => a.customer_id === customer.id);
      const customerFlags = flags.filter((f) => f.customer_id === customer.id);
      const customerMembership = memberships.find((m) => m.customer_id === customer.id) || null;

      return {
        ...customer,
        pets_count: customerPets.length,
        appointments_count: customerAppointments.length,
        flags: customerFlags,
        active_membership: customerMembership,
      };
    });

    // Search filter
    let filteredCustomers = customersWithStats;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCustomers = customersWithStats.filter((customer) => {
        const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
        const email = customer.email.toLowerCase();
        const phone = customer.phone?.toLowerCase() || '';

        // Search in customer fields
        if (
          fullName.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower)
        ) {
          return true;
        }

        // Search in pet names
        const customerPets = pets.filter((p) => p.owner_id === customer.id && p.is_active);
        const petNameMatch = customerPets.some((pet) =>
          pet.name.toLowerCase().includes(searchLower)
        );

        return petNameMatch;
      });
    }

    // Sort customers
    filteredCustomers.sort((a, b) => {
      let aValue: any;
      let bValue: any;

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

    // Paginate
    const totalCount = filteredCustomers.length;
    const paginatedCustomers = filteredCustomers.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginatedCustomers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
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
