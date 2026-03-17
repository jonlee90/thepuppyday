/**
 * Admin API - Resource Management
 * GET /api/admin/resources - List resources with pagination
 * POST /api/admin/resources - Create resource
 *
 * Gold-standard template for admin API routes.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { z } from 'zod';
import { sanitizeText } from '@/lib/utils/validation';

// --- Zod Schemas ---

const CreateResourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
});

// --- GET: List with pagination ---

export async function GET(request: NextRequest) {
  try {
    // 1. Auth: two-client pattern
    const authSupabase = await createServerSupabaseClient();
    await requireAdmin(authSupabase);
    const supabase = createServiceRoleClient();

    // 2. Parse query params with defaults
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // 3. Build query
    let query = supabase
      .from('resources')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // 4. Standard response format
    const total = count || 0;
    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Admin API] Error fetching resources:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch resources';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// --- POST: Create ---

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const authSupabase = await createServerSupabaseClient();
    await requireAdmin(authSupabase);
    const supabase = createServiceRoleClient();

    // 2. Validate body with Zod
    const body = await request.json();
    const parsed = CreateResourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 3. Sanitize text fields
    const { name, description, is_active } = parsed.data;
    const sanitizedName = sanitizeText(name);
    const sanitizedDescription = description ? sanitizeText(description) : null;

    // 4. Insert
    const { data, error } = await supabase
      .from('resources')
      .insert({
        name: sanitizedName,
        description: sanitizedDescription,
        is_active,
      })
      .select()
      .single();

    if (error) throw error;

    // 5. Standard response with 201
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('[Admin API] Error creating resource:', error);
    const message = error instanceof Error ? error.message : 'Failed to create resource';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
