/**
 * Admin Appointment Status Transition API Route
 * POST /api/admin/appointments/[id]/status - Update appointment status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { isTransitionAllowed } from '@/lib/admin/appointment-status';
import { sendAppointmentNotification } from '@/lib/admin/notifications';
import type { AppointmentStatus, Appointment, User, Pet, Service } from '@/types/database';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface StatusUpdateRequest {
  status: AppointmentStatus;
  cancellationReason?: string;
  sendNotification?: boolean;
  sendEmail?: boolean;
  sendSms?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const body: StatusUpdateRequest = await request.json();
    const {
      status: newStatus,
      cancellationReason,
      sendNotification = true,
      sendEmail = true,
      sendSms = false,
    } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate cancellation reason
    if (newStatus === 'cancelled') {
      if (!cancellationReason) {
        return NextResponse.json(
          { error: 'Cancellation reason is required when cancelling' },
          { status: 400 }
        );
      }
      if (cancellationReason.length > 500) {
        return NextResponse.json(
          { error: 'Cancellation reason must be 500 characters or less' },
          { status: 400 }
        );
      }
    }

    // In mock mode
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();

      const appointment = store.selectById('appointments', id) as Appointment | null;

      if (!appointment) {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }

      // Validate transition (allow reverse transitions from terminal states)
      const currentStatus = appointment.status;

      if (!isTransitionAllowed(currentStatus, newStatus)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
          },
          { status: 400 }
        );
      }

      // Update appointment
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'cancelled' && cancellationReason) {
        updates.cancellation_reason = cancellationReason;
      }

      const updatedAppointment = store.update('appointments', id, updates) as Appointment | null;

      if (!updatedAppointment) {
        return NextResponse.json(
          { error: 'Failed to update appointment' },
          { status: 500 }
        );
      }

      // Update customer no_show_count if marking as no-show
      if (newStatus === 'no_show') {
        const customer = store.selectById('users', appointment.customer_id) as User | null;
        if (customer) {
          const currentNoShowCount = (customer.preferences as any)?.no_show_count || 0;
          store.update('users', customer.id, {
            preferences: {
              ...customer.preferences,
              no_show_count: currentNoShowCount + 1,
            },
          });
        }
      }

      // Send notifications if requested
      if (sendNotification) {
        const customer = store.selectById('users', appointment.customer_id) as User | null;
        const pet = store.selectById('pets', appointment.pet_id) as Pet | null;
        const service = store.selectById('services', appointment.service_id) as Service | null;

        if (customer && pet && service) {
          // Use new notification triggers for checked_in and completed statuses (Task 0108)
          if (newStatus === 'checked_in' || newStatus === 'completed') {
            const { triggerAppointmentStatus } = await import(
              '@/lib/notifications/triggers'
            );

            const statusResult = await triggerAppointmentStatus(supabase, {
              appointmentId: id,
              customerId: appointment.customer_id,
              customerPhone: customer.phone,
              petName: pet.name,
              status: newStatus,
              manualOverride: true, // Manual trigger from admin
            });

            if (!statusResult.success && !statusResult.skipped) {
              console.error(
                '[Admin API] Status notification failed:',
                statusResult.errors
              );
            }
          }
          // Use legacy notification for other statuses (confirmed, cancelled, completed)
          else if (newStatus === 'confirmed' || newStatus === 'cancelled' || newStatus === 'completed') {
            await sendAppointmentNotification(
              supabase,
              {
                appointmentId: id,
                customerId: appointment.customer_id,
                customerName: `${customer.first_name} ${customer.last_name}`,
                customerEmail: customer.email,
                customerPhone: customer.phone,
                petName: pet.name,
                serviceName: service.name,
                scheduledAt: appointment.scheduled_at,
                status: newStatus,
                cancellationReason,
              },
              {
                sendEmail,
                sendSms,
              }
            );
          }
        }
      }

      return NextResponse.json({
        data: updatedAppointment,
        message: 'Status updated successfully',
      });
    }

    // Production Supabase query
    const { data: appointment, error: fetchError } = await (supabase as any)
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Validate transition (allow reverse transitions from terminal states)
    const currentStatus = appointment.status;

    if (!isTransitionAllowed(currentStatus, newStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
        },
        { status: 400 }
      );
    }

    // Update appointment
    const updates: Partial<Appointment> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'cancelled' && cancellationReason) {
      updates.cancellation_reason = cancellationReason;
    }

    const { data: updatedAppointment, error: updateError } = await (supabase as any)
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[Admin API] Error updating appointment status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }

    // Update customer no_show_count if marking as no-show
    if (newStatus === 'no_show') {
      const { data: customer } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('id', appointment.customer_id)
        .single();

      if (customer) {
        const currentNoShowCount = (customer.preferences as any)?.no_show_count || 0;
        await (supabase as any)
          .from('users')
          .update({
            preferences: {
              ...customer.preferences,
              no_show_count: currentNoShowCount + 1,
            },
          })
          .eq('id', customer.id);
      }
    }

    // Send notifications if requested
    if (sendNotification) {
      const { data: customer } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('id', appointment.customer_id)
        .single();

      const { data: pet } = await (supabase as any)
        .from('pets')
        .select('*')
        .eq('id', appointment.pet_id)
        .single();

      const { data: service } = await (supabase as any)
        .from('services')
        .select('*')
        .eq('id', appointment.service_id)
        .single();

      if (customer && pet && service) {
        // Use new notification triggers for checked_in and completed statuses (Task 0108)
        if (newStatus === 'checked_in' || newStatus === 'completed') {
          const { triggerAppointmentStatus } = await import(
            '@/lib/notifications/triggers'
          );

          const statusResult = await triggerAppointmentStatus(supabase, {
            appointmentId: id,
            customerId: appointment.customer_id,
            customerPhone: customer.phone,
            petName: pet.name,
            status: newStatus,
            manualOverride: true, // Manual trigger from admin
          });

          if (!statusResult.success && !statusResult.skipped) {
            console.error(
              '[Admin API] Status notification failed:',
              statusResult.errors
            );
          }
        }
        // Use legacy notification for other statuses (confirmed, cancelled, completed)
        else if (newStatus === 'confirmed' || newStatus === 'cancelled' || newStatus === 'completed') {
          await sendAppointmentNotification(
            supabase,
            {
              appointmentId: id,
              customerId: appointment.customer_id,
              customerName: `${customer.first_name} ${customer.last_name}`,
              customerEmail: customer.email,
              customerPhone: customer.phone,
              petName: pet.name,
              serviceName: service.name,
              scheduledAt: appointment.scheduled_at,
              status: newStatus,
              cancellationReason,
            },
            {
              sendEmail,
              sendSms,
            }
          );
        }
      }
    }

    return NextResponse.json({
      data: updatedAppointment,
      message: 'Status updated successfully',
    });
  } catch (error) {
    console.error('[Admin API] Error in status update route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
