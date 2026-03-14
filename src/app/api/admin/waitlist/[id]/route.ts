/**
 * PATCH /api/admin/waitlist/[id]
 * Update a waitlist entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { z } from 'zod';

const updateSchema = z.object({
  requested_date: z.string().optional(),
  time_preference: z.enum(['morning', 'afternoon', 'any']).optional(),
  preferred_time: z.union([z.string().regex(/^\d{1,2}:\d{2}$/), z.null()]).optional(),
  notes: z.string().optional(),
  priority: z.number().min(0).max(10).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = updateSchema.parse(body);

    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const serviceClient = createServiceRoleClient();

    const { data, error } = await (serviceClient as any)
      .from('waitlist')
      .update(validated)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Waitlist Update] Error:', error);
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
    }

    return NextResponse.json({ success: true, entry: data });
  } catch (error) {
    console.error('[Waitlist Update] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
