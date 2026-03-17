/**
 * Public API - Services
 * GET /api/services - List active services with pricing
 *
 * Gold-standard template for public API routes.
 * Uses service role client for read-only public data.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Public routes use service role for read-only access
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('services')
      .select('id, name, description, duration_minutes, image_url, is_active, service_prices(*)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('[Public API] Error fetching services:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch services';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
