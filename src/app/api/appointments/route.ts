/**
 * POST /api/appointments - Create new appointment with conflict checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/mocks/supabase/store';
import { appointmentCreationSchema } from '@/lib/booking/validation';
import { generateId } from '@/lib/utils';
import type { Appointment, User, Addon } from '@/types/database';
import { z } from 'zod';

/**
 * Extended schema for appointment creation with guest_info support
 */
const appointmentRequestSchema = appointmentCreationSchema.extend({
  addon_ids: z.array(z.string().uuid()).optional().default([]),
  guest_info: z
    .object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(10),
    })
    .optional(),
});

/**
 * Extended Appointment type with booking_reference
 */
interface AppointmentWithReference extends Appointment {
  booking_reference?: string;
}

/**
 * Generate a unique booking reference number
 * Format: APT-YYYY-NNNNNN
 */
function generateBookingReference(existingAppointments: Appointment[]): string {
  const year = new Date().getFullYear();
  const maxAttempts = 10;

  // Get all existing references for uniqueness check
  const existingReferences = new Set(
    (existingAppointments as AppointmentWithReference[])
      .map(apt => apt.booking_reference)
      .filter(Boolean)
  );

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    const reference = `APT-${year}-${random}`;

    // Check if reference is unique
    if (!existingReferences.has(reference)) {
      return reference;
    }
  }

  // Fallback: use timestamp-based reference if random fails
  const timestamp = Date.now().toString().slice(-6);
  return `APT-${year}-${timestamp}`;
}

/**
 * Check if a time slot has conflicts with existing appointments
 */
function hasSlotConflict(
  scheduledAt: string,
  durationMinutes: number,
  existingAppointments: Appointment[]
): boolean {
  const slotStart = new Date(scheduledAt);
  const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

  for (const appointment of existingAppointments) {
    // Skip cancelled or no-show appointments
    if (
      appointment.status === 'cancelled' ||
      appointment.status === 'no_show'
    ) {
      continue;
    }

    const appointmentStart = new Date(appointment.scheduled_at);
    const appointmentEnd = new Date(
      appointmentStart.getTime() + appointment.duration_minutes * 60000
    );

    // Check for overlap
    if (slotStart < appointmentEnd && slotEnd > appointmentStart) {
      return true;
    }
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const validated = appointmentRequestSchema.parse(body);

    const store = getMockStore();

    // Handle guest user creation if guest_info provided
    let customerId = validated.customer_id;
    if (validated.guest_info) {
      // Check if user exists
      const existingUsers = (store
        .select('users') as unknown as User[])
        .filter(
          (u) =>
            u.email.toLowerCase() === validated.guest_info!.email.toLowerCase()
        );

      if (existingUsers.length > 0) {
        customerId = existingUsers[0].id;
      } else {
        // Create guest user
        const guestUser = store.insert('users', {
          email: validated.guest_info.email.toLowerCase(),
          first_name: validated.guest_info.firstName,
          last_name: validated.guest_info.lastName,
          phone: validated.guest_info.phone,
          role: 'customer',
          avatar_url: null,
          preferences: {},
        }) as unknown as User;
        customerId = guestUser.id;
      }
    }

    // Check for slot conflicts (pessimistic locking in mock mode)
    const allAppointments = store.select('appointments') as unknown as Appointment[];
    if (
      hasSlotConflict(
        validated.scheduled_at,
        validated.duration_minutes,
        allAppointments
      )
    ) {
      return NextResponse.json(
        { error: 'Time slot no longer available', code: 'SLOT_CONFLICT' },
        { status: 409 }
      );
    }

    // Generate unique booking reference
    const reference = generateBookingReference(allAppointments);

    // Create appointment record with booking reference
    const appointment = store.insert('appointments', {
      customer_id: customerId,
      pet_id: validated.pet_id,
      service_id: validated.service_id,
      groomer_id: validated.groomer_id || null,
      scheduled_at: validated.scheduled_at,
      duration_minutes: validated.duration_minutes,
      status: 'pending',
      payment_status: 'pending',
      total_price: validated.total_price,
      notes: validated.notes || null,
      booking_reference: reference,
    }) as unknown as Appointment;

    // Create appointment_addon records
    if (validated.addon_ids && validated.addon_ids.length > 0) {
      // Get addon prices
      const addons = (store.select('addons') as unknown as Addon[])
        .filter((addon) => validated.addon_ids!.includes(addon.id));

      for (const addon of addons) {
        store.insert('appointment_addons', {
          id: generateId(),
          appointment_id: appointment.id,
          addon_id: addon.id,
          price: addon.price,
        });
      }
    }

    // TODO: Send confirmation email

    return NextResponse.json({
      success: true,
      appointment_id: appointment.id,
      reference,
      scheduled_at: appointment.scheduled_at,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
