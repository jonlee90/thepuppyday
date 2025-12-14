/**
 * GET /api/breeds - Fetch all dog breeds
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get all breeds
    const { data: breeds, error } = await (supabase as any)
      .from('breeds')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching breeds:', error);
      return NextResponse.json(
        { error: 'Failed to fetch breeds' },
        { status: 500 }
      );
    }

    return NextResponse.json({ breeds: breeds || [] });
  } catch (error) {
    console.error('Error fetching breeds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch breeds' },
      { status: 500 }
    );
  }
}
