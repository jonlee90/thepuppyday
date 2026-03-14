/**
 * Admin API - Breeds
 * GET /api/admin/breeds - List all breeds for dropdown selections
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { Breed } from '@/types/database';

/**
 * GET /api/admin/breeds
 * List all breeds ordered by name
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const serviceClient = createServiceRoleClient();
    await requireAdmin(supabase);

    const { data: breeds, error } = (await (serviceClient as any)
      .from('breeds')
      .select('*')
      .order('name', { ascending: true })) as {
      data: Breed[] | null;
      error: Error | null;
    };

    if (error) {
      throw error;
    }

    return NextResponse.json({ breeds: breeds || [] });
  } catch (error) {
    console.error('[Admin API] Error fetching breeds:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch breeds';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
