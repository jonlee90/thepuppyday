/**
 * Admin Appointment Price Adjustments API Route
 * GET    /api/admin/appointments/[id]/adjustments - List adjustments
 * POST   /api/admin/appointments/[id]/adjustments - Add adjustment
 * DELETE /api/admin/appointments/[id]/adjustments?adjustmentId=... - Remove adjustment
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, createServiceRoleClient, type AppSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

const addSchema = z.object({
  label: z.string().min(1).max(100),
  amount: z.number().refine(n => n !== 0, { message: 'Amount cannot be zero' }),
  note: z.string().max(500).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function recalculateTotalPrice(
  supabase: AppSupabaseClient,
  appointmentId: string
): Promise<number> {
  const { data: appt } = await supabase
    .from('appointments')
    .select('pet:pets(size), service_id')
    .eq('id', appointmentId)
    .single();

  const [{ data: priceRow }, { data: addonsData }, { data: adjData }] = await Promise.all([
    supabase
      .from('service_prices')
      .select('price')
      .eq('service_id', (appt as any)!.service_id)
      .eq('size', (appt as any)!.pet.size)
      .single(),
    supabase
      .from('appointment_addons')
      .select('price')
      .eq('appointment_id', appointmentId),
    supabase
      .from('appointment_price_adjustments')
      .select('amount')
      .eq('appointment_id', appointmentId),
  ]);

  const base = (priceRow as any)?.price ?? 0;
  const addons = ((addonsData as any[]) ?? []).reduce((sum, a) => sum + a.price, 0);
  const adjustments = ((adjData as any[]) ?? []).reduce((sum, a) => sum + a.amount, 0);
  const total = base + addons + adjustments;

  await supabase
    .from('appointments')
    .update({ total_price: total })
    .eq('id', appointmentId);

  return total;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authSupabase = await createServerSupabaseClient();
    await requireAdmin(authSupabase);

    const supabase = createServiceRoleClient() as AppSupabaseClient;
    const { data, error } = await supabase
      .from('appointment_price_adjustments')
      .select('*, creator:users!created_by(first_name, last_name)')
      .eq('appointment_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Admin API] Error fetching price adjustments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Admin API] Error in adjustments GET route:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authSupabase = await createServerSupabaseClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    await requireAdmin(authSupabase);

    const body = await request.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = createServiceRoleClient() as AppSupabaseClient;
    const { data: adjustment, error } = await supabase
      .from('appointment_price_adjustments')
      .insert({ ...parsed.data, appointment_id: id, created_by: user!.id })
      .select('*, creator:users!created_by(first_name, last_name)')
      .single();

    if (error) {
      console.error('[Admin API] Error creating price adjustment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const total_price = await recalculateTotalPrice(supabase, id);
    return NextResponse.json({ adjustment, total_price }, { status: 201 });
  } catch (error) {
    console.error('[Admin API] Error in adjustments POST route:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authSupabase = await createServerSupabaseClient();
    await requireAdmin(authSupabase);

    const adjustmentId = request.nextUrl.searchParams.get('adjustmentId');
    if (!adjustmentId) {
      return NextResponse.json({ error: 'adjustmentId required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient() as AppSupabaseClient;
    const { error } = await supabase
      .from('appointment_price_adjustments')
      .delete()
      .eq('id', adjustmentId)
      .eq('appointment_id', id);

    if (error) {
      console.error('[Admin API] Error deleting price adjustment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const total_price = await recalculateTotalPrice(supabase, id);
    return NextResponse.json({ total_price });
  } catch (error) {
    console.error('[Admin API] Error in adjustments DELETE route:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
