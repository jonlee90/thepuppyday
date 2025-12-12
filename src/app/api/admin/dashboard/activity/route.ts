/**
 * Admin Dashboard Activity Feed API Route
 * Returns recent notifications/activity for the dashboard
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify admin access
    await requireAdmin(supabase);

    // Fetch 10 most recent notifications
    const { data, error } = await (supabase as any)
      .from('notifications_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[Admin Dashboard Activity] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch activity' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[Admin Dashboard Activity] Error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
