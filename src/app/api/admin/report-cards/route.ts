/**
 * Report Cards API Route
 * Handles creating, updating, and retrieving report cards
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { validateReportCard, sanitizeGroomerNotes } from '@/lib/admin/report-card-validation';
import type { ReportCardFormState } from '@/types/report-card';

/**
 * GET - Fetch report card by appointment ID
 */
export async function GET(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get appointment ID from query params
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointment_id');

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 });
    }

    // Use service role client for data queries to bypass RLS
    const supabase = createServiceRoleClient();

    // Fetch report card
    const { data: reportCard, error: fetchError } = await (supabase as any)
      .from('report_cards')
      .select('*')
      .eq('appointment_id', appointmentId)
      .single();

    if (fetchError) {
      // Not found is not an error - just means no report card exists yet
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ reportCard: null });
      }
      throw fetchError;
    }

    return NextResponse.json({ reportCard });
  } catch (error) {
    console.error('Report card fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report card' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create or update report card (auto-save and submit)
 */
export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { formState, isDraft } = body as {
      formState: ReportCardFormState;
      isDraft: boolean;
    };

    // Validate form state
    const validation = validateReportCard(formState, isDraft);

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Sanitize notes
    const sanitizedNotes = sanitizeGroomerNotes(formState.groomer_notes);

    // Use service role client for data queries to bypass RLS
    const supabase = createServiceRoleClient();

    // Check if report card already exists
    const { data: existingReportCard } = await (supabase as any)
      .from('report_cards')
      .select('id, created_at')
      .eq('appointment_id', formState.appointment_id)
      .single();

    let reportCardId: string;

    if (existingReportCard) {
      // Update existing report card
      const { data: updated, error: updateError } = await (supabase as any)
        .from('report_cards')
        .update({
          mood: formState.mood,
          coat_condition: formState.coat_condition,
          behavior: formState.behavior,
          health_observations: formState.health_observations,
          groomer_notes: sanitizedNotes,
          before_photo_url: formState.before_photo_url || null,
          after_photo_url: formState.after_photo_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingReportCard.id)
        .select()
        .single();

      if (updateError) throw updateError;
      reportCardId = updated.id;
    } else {
      // Create new report card
      const { data: created, error: createError } = await (supabase as any)
        .from('report_cards')
        .insert({
          appointment_id: formState.appointment_id,
          mood: formState.mood,
          coat_condition: formState.coat_condition,
          behavior: formState.behavior,
          health_observations: formState.health_observations,
          groomer_notes: sanitizedNotes,
          before_photo_url: formState.before_photo_url || null,
          after_photo_url: formState.after_photo_url || null,
        })
        .select()
        .single();

      if (createError) throw createError;
      reportCardId = created.id;
    }

    return NextResponse.json({
      success: true,
      reportCardId,
      message: isDraft ? 'Draft saved' : 'Report card submitted successfully',
    });
  } catch (error) {
    console.error('Report card save error:', error);
    return NextResponse.json(
      { error: 'Failed to save report card' },
      { status: 500 }
    );
  }
}
