/**
 * GET /api/pets - Fetch authenticated user's pets
 * GET /api/pets?owner_id=xxx - Fetch pets for specific owner (admin only)
 * POST /api/pets - Create a new pet profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { petFormSchema } from '@/lib/booking/validation';
import { getAuthenticatedUserId, getUserIdFromRequest } from '@/lib/auth/mock-auth';
import { requireAdmin } from '@/lib/admin/auth';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const requestedOwnerId = searchParams.get('owner_id');

    // Create Supabase client and get authenticated user
    let supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let ownerId = user.id;

    // If requesting pets for a different owner, verify admin access
    if (requestedOwnerId && requestedOwnerId !== user.id) {
      try {
        await requireAdmin(supabase);
        // Use service role client to bypass RLS for admin queries
        supabase = createServiceRoleClient();
        ownerId = requestedOwnerId;
      } catch {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    const { data: pets, error } = await (supabase as any)
      .from('pets')
      .select('*, breed:breeds(*)')
      .eq('owner_id', ownerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pets' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pets: pets || [] });
  } catch (error) {
    console.error('Error fetching pets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pets' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const validated = petFormSchema.parse(body);

    // Get authenticated user
    const authenticatedUserId = await getAuthenticatedUserId(req);

    // If user is authenticated, prevent owner_id manipulation
    if (authenticatedUserId && body.owner_id && body.owner_id !== authenticatedUserId) {
      return NextResponse.json(
        { error: 'Cannot create pets for other users' },
        { status: 403 }
      );
    }

    // Get final user ID (authenticated user or provided owner_id for guest)
    const userId = await getUserIdFromRequest(req, body.owner_id);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for guest pet creation (bypasses RLS)
    // Use regular client for authenticated users (respects RLS)
    const supabase = !authenticatedUserId && body.owner_id
      ? createServiceRoleClient()
      : await createServerSupabaseClient();

    const { data: pet, error } = await (supabase as any)
      .from('pets')
      .insert({
        owner_id: userId,
        name: validated.name,
        breed_id: validated.breed_id || null,
        breed_custom: validated.breed_custom || null,
        size: validated.size,
        weight: validated.weight || null,
        birth_date: null,
        notes: validated.notes || null,
        medical_info: null,
        photo_url: null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pet:', error);
      return NextResponse.json(
        { error: 'Failed to create pet' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pet });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating pet:', error);
    return NextResponse.json(
      { error: 'Failed to create pet' },
      { status: 500 }
    );
  }
}
