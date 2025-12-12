/**
 * Customer Detail API Route
 * GET /api/admin/customers/[id] - Get detailed customer information
 * PATCH /api/admin/customers/[id] - Update customer information
 * Task 0018: Create /api/admin/customers/[id] API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Security: Proper email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Security: Phone number max length to prevent abuse
const MAX_PHONE_LENGTH = 20;

/**
 * GET - Get detailed customer information
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    const { id: customerId } = await context.params;

    // Fetch customer
    const { data: customer, error: customerError } = await (supabase as any)
      .from('users')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Fetch pets with breed information
    const { data: pets, error: petsError } = await (supabase as any)
      .from('pets')
      .select('*, breed:breeds(*)')
      .eq('owner_id', customerId)
      .eq('is_active', true);

    if (petsError) {
      console.error('[Customer API] Error fetching pets:', petsError);
    }

    // Fetch customer flags
    const { data: flags, error: flagsError } = await (supabase as any)
      .from('customer_flags')
      .select('*, created_by_user:users!customer_flags_created_by_fkey(first_name, last_name)')
      .eq('customer_id', customerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (flagsError) {
      console.error('[Customer API] Error fetching flags:', flagsError);
    }

    // Fetch loyalty points
    const { data: loyaltyPoints, error: loyaltyError } = await (supabase as any)
      .from('customer_loyalty')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (loyaltyError && loyaltyError.code !== 'PGRST116') {
      console.error('[Customer API] Error fetching loyalty points:', loyaltyError);
    }

    // Fetch recent loyalty transactions
    const { data: loyaltyTransactions, error: transactionsError } = await (supabase as any)
      .from('loyalty_punches')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (transactionsError) {
      console.error('[Customer API] Error fetching loyalty transactions:', transactionsError);
    }

    // Fetch active membership
    const { data: membership, error: membershipError } = await (supabase as any)
      .from('customer_memberships')
      .select('*, membership:memberships(*)')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .single();

    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error('[Customer API] Error fetching membership:', membershipError);
    }

    // Build detailed customer object
    const customerDetail = {
      ...customer,
      pets: pets || [],
      flags: flags || [],
      loyalty_points: loyaltyPoints || null,
      loyalty_transactions: loyaltyTransactions || [],
      active_membership: membership || null,
    };

    return NextResponse.json({ data: customerDetail });
  } catch (error) {
    console.error('[Customer API] GET error:', error);

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
 * PATCH - Update customer information
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    const { id: customerId } = await context.params;

    const body = await request.json();
    const { first_name, last_name, email, phone } = body;

    // Validation
    const updateData: any = {};

    if (first_name !== undefined) {
      if (!first_name.trim()) {
        return NextResponse.json(
          { error: 'First name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.first_name = first_name.trim();
    }

    if (last_name !== undefined) {
      if (!last_name.trim()) {
        return NextResponse.json(
          { error: 'Last name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.last_name = last_name.trim();
    }

    if (email !== undefined) {
      const trimmedEmail = email.trim();

      // Security: Proper email validation
      if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
        return NextResponse.json(
          { error: 'Valid email is required' },
          { status: 400 }
        );
      }

      // Security: Check for duplicate email (excluding current user)
      const { data: existingUser, error: checkError } = await (supabase as any)
        .from('users')
        .select('id')
        .eq('email', trimmedEmail)
        .neq('id', customerId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('[Customer API] Error checking duplicate email:', checkError);
        return NextResponse.json(
          { error: 'Failed to validate email' },
          { status: 500 }
        );
      }

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use by another customer' },
          { status: 409 }
        );
      }

      updateData.email = trimmedEmail;
    }

    if (phone !== undefined) {
      const trimmedPhone = phone?.trim() || null;

      // Security: Validate phone length to prevent abuse
      if (trimmedPhone && trimmedPhone.length > MAX_PHONE_LENGTH) {
        return NextResponse.json(
          { error: `Phone number cannot exceed ${MAX_PHONE_LENGTH} characters` },
          { status: 400 }
        );
      }

      updateData.phone = trimmedPhone;
    }

    // Update customer
    const { data: customer, error: updateError } = await (supabase as any)
      .from('users')
      .update(updateData)
      .eq('id', customerId)
      .select()
      .single();

    if (updateError) {
      console.error('[Customer API] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update customer' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: customer });
  } catch (error) {
    console.error('[Customer API] PATCH error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
