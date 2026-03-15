/**
 * Appointment API Routes
 * PUT: Reschedule appointment
 * DELETE: Cancel appointment
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse, after } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

// PUT - Reschedule appointment (update scheduled_at)
export async function PUT(
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

    // Parse request body
    const body = await request.json();
    const { scheduled_at } = body;

    if (!scheduled_at) {
      return NextResponse.json(
        { error: 'scheduled_at is required' },
        { status: 400 }
      );
    }

    // Fetch appointment + booking settings in parallel
    const [appointmentResult, settingsResult] = await Promise.all([
      (supabase as any)
        .from('appointments')
        .select('*, customer_id, scheduled_at, status, service_id')
        .eq('id', id)
        .single(),
      (supabase as any)
        .from('settings')
        .select('value')
        .eq('key', 'booking_settings')
        .single(),
    ]);

    const { data: appointment, error: fetchError } = appointmentResult;

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (appointment.customer_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your appointment' },
        { status: 403 }
      );
    }

    // Check status
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return NextResponse.json(
        { error: 'This appointment cannot be rescheduled' },
        { status: 400 }
      );
    }

    // Check cancellation cutoff (same policy applies to reschedule)
    const cancellationCutoffHours = settingsResult.data?.value?.cancellation_cutoff_hours ?? 24;
    const currentScheduledAt = new Date(appointment.scheduled_at);
    const now = new Date();
    const hoursUntil = (currentScheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil <= cancellationCutoffHours) {
      return NextResponse.json(
        { error: `Appointments must be rescheduled at least ${cancellationCutoffHours} hours in advance. Please call us at (657) 252-2903.` },
        { status: 400 }
      );
    }

    // Validate new time is in the future (at least 24h away)
    const newScheduledAt = new Date(scheduled_at);
    const hoursUntilNew = (newScheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilNew <= cancellationCutoffHours) {
      return NextResponse.json(
        { error: `New appointment time must be at least ${cancellationCutoffHours} hours from now.` },
        { status: 400 }
      );
    }

    // Check for conflicts at new time
    const newDateStr = scheduled_at.split('T')[0];
    const { data: existingAppointments } = await (supabase as any)
      .from('appointments')
      .select('id, scheduled_at, status')
      .eq('scheduled_at', newScheduledAt.toISOString())
      .in('status', ['pending', 'confirmed', 'checked_in'])
      .neq('id', id);

    if (existingAppointments && existingAppointments.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is no longer available. Please select a different time.' },
        { status: 409 }
      );
    }

    // Update the appointment
    const { data: updated, error: updateError } = await (supabase as any)
      .from('appointments')
      .update({
        scheduled_at: newScheduledAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error rescheduling appointment:', updateError);
      return NextResponse.json(
        { error: 'Failed to reschedule appointment' },
        { status: 500 }
      );
    }

    // Send reschedule notification in background (non-blocking)
    // Use service role client because after() runs after the response —
    // the request cookie context is gone, so RLS-authenticated queries fail.
    after(async () => {
      try {
        const serviceClient = createServiceRoleClient();
        const { triggerAppointmentRescheduled } = await import('@/lib/notifications/triggers');

        // Fetch customer, pet, service in parallel
        const [{ data: customer }, { data: pet }, { data: service }] = await Promise.all([
          (serviceClient as any).from('users').select('id, first_name, last_name, email, phone').eq('id', user.id).single(),
          (serviceClient as any).from('pets').select('name').eq('id', appointment.pet_id).single(),
          (serviceClient as any).from('services').select('name').eq('id', appointment.service_id).single(),
        ]);

        if (customer && pet && service) {
          await triggerAppointmentRescheduled(serviceClient as any, {
            appointmentId: id,
            customerId: user.id,
            customerName: `${customer.first_name} ${customer.last_name}`,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            petName: pet.name,
            serviceName: service.name,
            originalScheduledAt: appointment.scheduled_at,
            newScheduledAt: scheduled_at,
          });
        }
      } catch (notifError) {
        console.error('[Customer API] Reschedule notification error:', notifError);
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: updated,
    });

  } catch (error) {
    console.error('Error in appointment reschedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Send cancellation notification in background (non-blocking)
    // Use service role client because after() runs after the response —
    // the request cookie context is gone, so RLS-authenticated queries fail.
    after(async () => {
      try {
        const serviceClient = createServiceRoleClient();
        const { triggerAppointmentCancelled } = await import('@/lib/notifications/triggers');

        // Fetch customer, pet, service in parallel
        const [{ data: customer }, { data: pet }, { data: service }] = await Promise.all([
          (serviceClient as any).from('users').select('id, first_name, last_name, email, phone').eq('id', user.id).single(),
          (serviceClient as any).from('pets').select('name').eq('id', appointment.pet_id).single(),
          (serviceClient as any).from('services').select('name').eq('id', appointment.service_id).single(),
        ]);

        if (customer && pet && service) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          await triggerAppointmentCancelled(serviceClient as any, {
            appointmentId: id,
            customerId: user.id,
            customerName: `${customer.first_name} ${customer.last_name}`,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            petName: pet.name,
            serviceName: service.name,
            scheduledAt: appointment.scheduled_at,
            cancelledBy: 'customer',
            rebookUrl: `${baseUrl}/booking`,
          });
        }
      } catch (notifError) {
        console.error('[Customer API] Cancellation notification error:', notifError);
      }
    });

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
