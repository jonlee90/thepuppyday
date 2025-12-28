/**
 * POST /api/appointments - Create new appointment with conflict checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { appointmentCreationSchema } from '@/lib/booking/validation';
import type { Appointment } from '@/types/database';
import { z } from 'zod';
import { randomBytes } from 'crypto';

/**
 * Extended schema for appointment creation with guest_info and new_pet support
 */
const appointmentRequestSchema = appointmentCreationSchema
  .extend({
    addon_ids: z.array(z.string().uuid()).optional().default([]),
    guest_info: z
      .object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(10),
      })
      .optional(),
    new_pet: z
      .object({
        name: z.string().min(1),
        breed_id: z.string().uuid().optional(),
        size: z.enum(['small', 'medium', 'large', 'xlarge']),
        weight: z.number().positive().optional(),
        breed_custom: z.string().optional(),
      })
      .optional(),
  })
  .partial({
    customer_id: true,
    pet_id: true,
  })
  .refine(
    (data) => {
      // Either pet_id OR new_pet must be provided
      return data.pet_id || data.new_pet;
    },
    {
      message: 'Either pet_id or new_pet must be provided',
    }
  );

/**
 * Generate a cryptographically secure unique booking reference number
 * Format: APT-YYYY-NNNNNN
 * Uses crypto.randomBytes for secure random number generation
 */
function generateBookingReference(): string {
  const year = new Date().getFullYear();
  // Generate 3 random bytes, convert to number, and take last 6 digits
  const randomValue = randomBytes(3).readUIntBE(0, 3) % 1000000;
  const random = randomValue.toString().padStart(6, '0');
  return `APT-${year}-${random}`;
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

    // Use service role client for all appointment operations (bypasses RLS)
    // This is needed because guests are creating appointments without being authenticated
    const supabase = createServiceRoleClient();

    // Handle guest user creation if guest_info provided
    let customerId = validated.customer_id;
    if (validated.guest_info) {
      // Check if user exists (case-insensitive email match)
      const { data: existingUsers } = await supabase
        .from('users')
        .select('*')
        .ilike('email', validated.guest_info.email);

      if (existingUsers && existingUsers.length > 0) {
        customerId = existingUsers[0].id;
      } else {
        // Create guest user
        const { data: guestUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: validated.guest_info.email.toLowerCase(),
            first_name: validated.guest_info.firstName,
            last_name: validated.guest_info.lastName,
            phone: validated.guest_info.phone,
            role: 'customer',
            avatar_url: null,
            preferences: {},
          })
          .select()
          .single();

        if (userError || !guestUser) {
          console.error('Error creating guest user:', userError);
          return NextResponse.json(
            { error: 'Failed to create guest account' },
            { status: 500 }
          );
        }
        customerId = guestUser.id;
      }
    }

    // Handle new pet creation if new_pet provided
    let petId = validated.pet_id;
    if (validated.new_pet && customerId) {
      // Create new pet for the customer
      const { data: newPet, error: petError } = await supabase
        .from('pets')
        .insert({
          owner_id: customerId,
          name: validated.new_pet.name,
          breed_id: validated.new_pet.breed_id || null,
          size: validated.new_pet.size,
          weight: validated.new_pet.weight || null,
          breed_custom: validated.new_pet.breed_custom || null,
        })
        .select()
        .single();

      if (petError || !newPet) {
        console.error('Error creating pet:', petError);
        return NextResponse.json(
          { error: 'Failed to create pet information' },
          { status: 500 }
        );
      }
      petId = newPet.id;
    }

    // Validate we have a pet_id
    if (!petId) {
      return NextResponse.json(
        { error: 'Pet information is required' },
        { status: 400 }
      );
    }

    // Check for slot conflicts
    // Get appointments for the same day
    const slotDate = new Date(validated.scheduled_at);
    const dateStart = new Date(slotDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(slotDate);
    dateEnd.setHours(23, 59, 59, 999);

    const { data: allAppointments } = await supabase
      .from('appointments')
      .select('*')
      .gte('scheduled_at', dateStart.toISOString())
      .lte('scheduled_at', dateEnd.toISOString());

    if (
      hasSlotConflict(
        validated.scheduled_at,
        validated.duration_minutes,
        allAppointments || []
      )
    ) {
      return NextResponse.json(
        { error: 'Time slot no longer available', code: 'SLOT_CONFLICT' },
        { status: 409 }
      );
    }

    // Generate unique booking reference
    // Use .maybeSingle() for more efficient uniqueness check
    let reference = generateBookingReference();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure uniqueness with efficient query
    while (attempts < maxAttempts) {
      const { data: existing, error: checkError } = await supabase
        .from('appointments')
        .select('id')
        .eq('booking_reference', reference)
        .maybeSingle();

      // maybeSingle returns null if not found (no error), which is what we want
      if (!existing && !checkError) break;

      reference = generateBookingReference();
      attempts++;
    }

    // If we couldn't generate a unique reference after max attempts,
    // use timestamp-based fallback (extremely unlikely with crypto random)
    if (attempts >= maxAttempts) {
      const timestamp = Date.now().toString().slice(-6);
      reference = `APT-${new Date().getFullYear()}-${timestamp}`;
    }

    // Create appointment record with full details for notification
    // Fetch related data in a single query to avoid N+1
    const { data: appointment, error: apptError } = await supabase
      .from('appointments')
      .insert({
        customer_id: customerId,
        pet_id: petId,
        service_id: validated.service_id,
        groomer_id: validated.groomer_id || null,
        scheduled_at: validated.scheduled_at,
        duration_minutes: validated.duration_minutes,
        status: 'pending',
        payment_status: 'pending',
        total_price: validated.total_price,
        notes: validated.notes || null,
        booking_reference: reference,
      })
      .select(
        `
        *,
        customer:users!customer_id(id, first_name, last_name, email, phone),
        pet:pets!pet_id(id, name),
        service:services(id, name)
      `
      )
      .single();

    if (apptError || !appointment) {
      console.error('Error creating appointment:', apptError);
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    // Create appointment_addon records
    if (validated.addon_ids && validated.addon_ids.length > 0) {
      // Get addon prices
      const { data: addons } = await supabase
        .from('addons')
        .select('*')
        .in('id', validated.addon_ids);

      if (addons && addons.length > 0) {
        const addonInserts = addons.map((addon) => ({
          appointment_id: appointment.id,
          addon_id: addon.id,
          price: addon.price,
        }));

        const { error: addonError } = await supabase
          .from('appointment_addons')
          .insert(addonInserts);

        if (addonError) {
          console.error('Error creating appointment addons:', addonError);
          // Non-fatal error, continue
        }
      }
    }

    // Send booking confirmation notifications (Task 0107)
    // Use already-fetched appointment data to avoid N+1 query
    try {
      // Type assertion for nested joined data
      const customer = appointment.customer as unknown as {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone: string | null;
      };
      const pet = appointment.pet as unknown as { id: string; name: string };
      const service = appointment.service as unknown as { id: string; name: string };

      const { triggerBookingConfirmation } = await import(
        '@/lib/notifications/triggers'
      );

      const notificationResult = await triggerBookingConfirmation(supabase, {
        appointmentId: appointment.id,
        customerId: customer.id,
        customerName: `${customer.first_name} ${customer.last_name}`,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        petName: pet.name,
        serviceName: service.name,
        scheduledAt: appointment.scheduled_at,
        totalPrice: appointment.total_price,
      });

      if (!notificationResult.success) {
        console.error(
          '[Appointments API] Booking notification failed:',
          notificationResult.errors
        );
        // Don't fail the booking if notification fails
      } else {
        console.log(
          `[Appointments API] Booking confirmation sent - Email: ${notificationResult.emailSent}, SMS: ${notificationResult.smsSent}`
        );
      }
    } catch (error) {
      console.error('[Appointments API] Error sending booking confirmation:', error);
      // Don't fail the booking if notification fails
    }

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
