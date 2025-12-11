/**
 * GET /api/addons - Fetch active add-on services
 */

import { NextResponse } from 'next/server';
import { getMockStore } from '@/mocks/supabase/store';
import type { Addon } from '@/types/database';

export async function GET() {
  try {
    const store = getMockStore();

    // Get active addons ordered by display_order
    const addons = store.select('addons', {
      column: 'is_active',
      value: true,
      order: { column: 'display_order', ascending: true },
    }) as unknown as Addon[];

    return NextResponse.json({ addons });
  } catch (error) {
    console.error('Error fetching addons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addons' },
      { status: 500 }
    );
  }
}
