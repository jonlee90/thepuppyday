/**
 * Customer API - Profile Management
 * GET /api/customer/profile - Get current user's profile
 * PUT /api/customer/profile - Update current user's profile
 *
 * Gold-standard template for customer API routes.
 * Uses single Supabase client that respects RLS.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { sanitizeText } from '@/lib/utils/validation';

// --- Zod Schemas ---

const UpdateProfileSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
});

// --- GET: Read own data (RLS ensures scoping) ---

export async function GET() {
  try {
    // Single client — RLS scopes to current user
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone, role, created_at')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Customer API] Error fetching profile:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// --- PUT: Update own data ---

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    // Sanitize text fields
    const updates: Record<string, string> = {};
    if (parsed.data.first_name) updates.first_name = sanitizeText(parsed.data.first_name);
    if (parsed.data.last_name) updates.last_name = sanitizeText(parsed.data.last_name);
    if (parsed.data.phone) updates.phone = sanitizeText(parsed.data.phone);

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Customer API] Error updating profile:', error);
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
