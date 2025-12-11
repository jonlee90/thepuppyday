/**
 * GET /api/addons - Fetch active add-on services
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get active addons ordered by display_order
    const { data: addons, error } = await supabase
      .from('addons')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching addons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch addons' },
        { status: 500 }
      );
    }

    return NextResponse.json({ addons: addons || [] });
  } catch (error) {
    console.error('Error fetching addons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addons' },
      { status: 500 }
    );
  }
}
