/**
 * PATCH /api/admin/customers/[id]/pets/[petId]
 * Update a pet's details
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { PetSize } from '@/types/database';

interface RouteContext {
  params: Promise<{ id: string; petId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();
    await requireAdmin(supabase);
    const { id: customerId, petId } = await context.params;

    const body = await request.json();
    const {
      name,
      breed_id,
      breed_custom,
      size,
      gender,
      color,
      notes,
      medical_info,
    } = body as {
      name?: string;
      breed_id?: string | null;
      breed_custom?: string | null;
      size?: PetSize;
      gender?: string | null;
      color?: string | null;
      notes?: string | null;
      medical_info?: string | null;
    };

    // Validation
    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Pet name cannot be empty' }, { status: 400 });
    }

    const validSizes: PetSize[] = ['small', 'medium', 'large', 'xlarge'];
    if (size !== undefined && !validSizes.includes(size)) {
      return NextResponse.json({ error: 'Invalid pet size' }, { status: 400 });
    }

    // Build update object — only include fields that were provided
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (Object.prototype.hasOwnProperty.call(body, 'breed_id')) updateData.breed_id = breed_id ?? null;
    if (Object.prototype.hasOwnProperty.call(body, 'breed_custom')) updateData.breed_custom = breed_custom ?? null;
    if (size !== undefined) updateData.size = size;
    if (Object.prototype.hasOwnProperty.call(body, 'gender')) updateData.gender = gender ?? null;
    if (Object.prototype.hasOwnProperty.call(body, 'color')) updateData.color = color ?? null;
    if (Object.prototype.hasOwnProperty.call(body, 'notes')) updateData.notes = notes ?? null;
    if (Object.prototype.hasOwnProperty.call(body, 'medical_info')) updateData.medical_info = medical_info ?? null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedPet, error: updateError } = await (serviceClient as any)
      .from('pets')
      .update(updateData)
      .eq('id', petId)
      .eq('owner_id', customerId)
      .select('*, breed:breeds(*)')
      .single();

    if (updateError) {
      console.error('[Pet API] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update pet' }, { status: 500 });
    }

    if (!updatedPet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updatedPet });
  } catch (error) {
    console.error('[Pet API] PATCH error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();
    await requireAdmin(supabase);
    const { id: customerId, petId } = await context.params;

    // Check for existing appointments linked to this pet
    const { count } = await (serviceClient as any)
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('pet_id', petId)
      .eq('customer_id', customerId);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete pet with ${count} appointment${count > 1 ? 's' : ''}. Remove appointments first.` },
        { status: 409 }
      );
    }

    const { error: deleteError } = await (serviceClient as any)
      .from('pets')
      .delete()
      .eq('id', petId)
      .eq('owner_id', customerId);

    if (deleteError) {
      console.error('[Pet API] Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete pet' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Pet API] DELETE error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
