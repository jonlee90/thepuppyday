/**
 * /api/admin/customers/[id]/pets
 * GET  — Fetch all pets for a customer
 * POST — Create a new pet for a customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const authSupabase = await createServerSupabaseClient();
    await requireAdmin(authSupabase);
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('pets')
      .select('*, breed:breeds(id, name)')
      .eq('owner_id', customerId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/admin/customers/[id]/pets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer pets' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const authSupabase = await createServerSupabaseClient();
    await requireAdmin(authSupabase);
    const supabase = createServiceRoleClient();

    const body = await request.json();
    const { name, breed_id, breed_custom, size, gender, color, medical_info, notes } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Pet name is required' }, { status: 400 });
    }
    if (!size) {
      return NextResponse.json({ error: 'Pet size is required' }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from('pets')
      .insert({
        owner_id: customerId,
        name: name.trim(),
        breed_id: breed_id || null,
        breed_custom: breed_custom?.trim() || null,
        size,
        gender: gender || null,
        color: color?.trim() || null,
        medical_info: medical_info?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select('*, breed:breeds(id, name)')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/customers/[id]/pets error:', error);
    return NextResponse.json(
      { error: 'Failed to create pet' },
      { status: 500 }
    );
  }
}
