/**
 * Appointment API Routes
 * DELETE: Cancel appointment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// DELETE - Cancel appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch appointment to verify ownership and check if cancellable
    const { data: appointment, error: fetchError } = await (supabase as any)
      .from('appointments')
      .select('*, customer_id, scheduled_at, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching appointment:', fetchError);
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Verify customer owns this appointment
    if (appointment.customer_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your appointment' },
        { status: 403 }
      );
    }

    // Fetch booking settings to get cancellation policy
    const { data: bookingSettingsData } = await (supabase as any)
      .from('settings')
      .select('value')
      .eq('key', 'booking_settings')
      .single();

    const cancellationCutoffHours = bookingSettingsData?.value?.cancellation_cutoff_hours ?? 24;

    // Check if appointment can be cancelled
    const scheduledAt = new Date(appointment.scheduled_at);
    const now = new Date();
    const hoursUntil = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil <= cancellationCutoffHours) {
      return NextResponse.json(
        { error: `Appointments must be cancelled at least ${cancellationCutoffHours} hours in advance. Please call us at (657) 252-2903.` },
        { status: 400 }
      );
    }

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return NextResponse.json(
        { error: 'This appointment cannot be cancelled' },
        { status: 400 }
      );
    }

    // Update appointment status to cancelled
    const { error: updateError } = await (supabase as any)
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error cancelling appointment:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel appointment' },
        { status: 500 }
      );
    }

    // TODO: Send cancellation confirmation email (when email service is ready)
    // await sendCancellationEmail(user.email, appointment);

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
    });

  } catch (error) {
    console.error('Error in appointment cancellation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
