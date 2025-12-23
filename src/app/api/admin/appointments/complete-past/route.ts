/**
 * API route to mark all past appointments as completed
 * POST /api/admin/appointments/complete-past
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update all appointments where:
    // 1. scheduled_at is today or earlier
    // 2. status is NOT already completed, cancelled, or no_show
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'completed' })
      .lte('scheduled_at', new Date().toISOString())
      .not('status', 'in', '(completed,cancelled,no_show)')
      .select('id');

    if (error) {
      console.error('Error updating appointments:', error);
      return NextResponse.json(
        { error: 'Failed to update appointments', details: error.message },
        { status: 500 }
      );
    }

    const count = data?.length || 0;

    return NextResponse.json({
      success: true,
      count,
      message: `Successfully marked ${count} appointment(s) as completed`,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
