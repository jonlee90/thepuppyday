/**
 * Customer Profile API
 * PATCH /api/customer/profile - Update profile info (name, phone)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

const MAX_PHONE_LENGTH = 20;

const updateProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50).trim().optional(),
  last_name: z.string().min(1, 'Last name is required').max(50).trim().optional(),
  phone: z
    .string()
    .max(MAX_PHONE_LENGTH, `Phone cannot exceed ${MAX_PHONE_LENGTH} characters`)
    .nullable()
    .optional(),
  address: z.string().max(200).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  zip: z.string().max(10).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data: updated, error: updateError } = await (supabase as any)
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[Profile API] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[Profile API] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
