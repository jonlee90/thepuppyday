/**
 * Customer Flags API Routes
 * POST /api/admin/customers/[id]/flags - Create a new flag for a customer
 * Task 0021: Create customer flags API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { CustomerFlagType, CustomerFlagColor } from '@/types/database';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST - Create a new customer flag
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireAdmin(supabase);
    const { id: customerId } = await context.params;

    const body = await request.json();
    const { flag_type, description, color } = body as {
      flag_type: CustomerFlagType;
      description: string;
      color?: CustomerFlagColor;
    };

    // Validation
    if (!flag_type || !description?.trim()) {
      return NextResponse.json(
        { error: 'Flag type and description are required' },
        { status: 400 }
      );
    }

    if (description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be 500 characters or less' },
        { status: 400 }
      );
    }

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

    // Determine color based on flag type if not provided
    const flagColor: CustomerFlagColor = color || getDefaultColor(flag_type);

    // Create flag
    const { data: flag, error: insertError } = await (supabase as any)
      .from('customer_flags')
      .insert({
        customer_id: customerId,
        flag_type,
        description: description.trim(),
        color: flagColor,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Customer Flags API] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create customer flag' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: flag }, { status: 201 });
  } catch (error) {
    console.error('[Customer Flags API] POST error:', error);

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
 * Helper function to get default color for flag type
 */
function getDefaultColor(flagType: CustomerFlagType): CustomerFlagColor {
  switch (flagType) {
    case 'aggressive_dog':
    case 'payment_issues':
      return 'red';
    case 'vip':
      return 'green';
    case 'special_needs':
    case 'grooming_notes':
    case 'other':
    default:
      return 'yellow';
  }
}
