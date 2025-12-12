/**
 * Individual Customer Flag API Routes
 * PATCH /api/admin/customers/[id]/flags/[flagId] - Update a customer flag
 * DELETE /api/admin/customers/[id]/flags/[flagId] - Soft delete a customer flag
 * Task 0021: Create customer flags API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { CustomerFlagType, CustomerFlagColor } from '@/types/database';

interface RouteContext {
  params: Promise<{ id: string; flagId: string }>;
}

/**
 * PATCH - Update a customer flag
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    const { id: customerId, flagId } = await context.params;

    const body = await request.json();
    const { flag_type, description, color } = body as {
      flag_type?: CustomerFlagType;
      description?: string;
      color?: CustomerFlagColor;
    };

    // Validation
    if (description !== undefined) {
      if (!description.trim()) {
        return NextResponse.json(
          { error: 'Description cannot be empty' },
          { status: 400 }
        );
      }

      if (description.length > 500) {
        return NextResponse.json(
          { error: 'Description must be 500 characters or less' },
          { status: 400 }
        );
      }
    }

    if (flag_type !== undefined) {
      const validFlagTypes: CustomerFlagType[] = [
        'aggressive_dog',
        'payment_issues',
        'vip',
        'special_needs',
        'grooming_notes',
        'other',
      ];

      if (!validFlagTypes.includes(flag_type)) {
        return NextResponse.json({ error: 'Invalid flag type' }, { status: 400 });
      }
    }

    // Build update object
    const updateData: any = {};
    if (flag_type !== undefined) updateData.flag_type = flag_type;
    if (description !== undefined) updateData.description = description.trim();
    if (color !== undefined) updateData.color = color;

    // Update flag
    const { data: flag, error: updateError } = await (supabase as any)
      .from('customer_flags')
      .update(updateData)
      .eq('id', flagId)
      .eq('customer_id', customerId)
      .select()
      .single();

    if (updateError) {
      console.error('[Customer Flags API] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update customer flag' },
        { status: 500 }
      );
    }

    if (!flag) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
    }

    return NextResponse.json({ data: flag });
  } catch (error) {
    console.error('[Customer Flags API] PATCH error:', error);

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
 * DELETE - Soft delete a customer flag (set is_active to false)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    const { id: customerId, flagId } = await context.params;

    // Soft delete by setting is_active to false
    const { data: flag, error: deleteError } = await (supabase as any)
      .from('customer_flags')
      .update({ is_active: false })
      .eq('id', flagId)
      .eq('customer_id', customerId)
      .select()
      .single();

    if (deleteError) {
      console.error('[Customer Flags API] Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove customer flag' },
        { status: 500 }
      );
    }

    if (!flag) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
    }

    return NextResponse.json({ data: flag });
  } catch (error) {
    console.error('[Customer Flags API] DELETE error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
