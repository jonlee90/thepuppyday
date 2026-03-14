/**
 * POST /api/admin/waitlist/[id]/cancel
 * Cancel a waitlist entry
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const serviceClient = createServiceRoleClient();

    const { error } = await (serviceClient as any)
      .from('waitlist')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      console.error('[Waitlist Cancel] Error:', error);
      return NextResponse.json({ error: 'Failed to cancel entry' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Waitlist Cancel] Error:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
