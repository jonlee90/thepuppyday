/**
 * POST /api/appointments - Create new appointment with conflict checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { appointmentCreationSchema } from '@/lib/booking/validation';
import type { Appointment } from '@/types/database';
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
 * Generate a unique booking reference number
 * Format: APT-YYYY-NNNNNN
 */
function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
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
      const { data: existingUsers } = await (supabase as any)
        .from('users')
        .select('*')
        .ilike('email', validated.guest_info.email);

      if (existingUsers && existingUsers.length > 0) {
        customerId = existingUsers[0].id;
      } else {
        // Create guest user
        const { data: guestUser, error: userError } = await (supabase as any)
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

    // Check for slot conflicts
    // Get appointments for the same day
    const slotDate = new Date(validated.scheduled_at);
    const dateStart = new Date(slotDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(slotDate);
    dateEnd.setHours(23, 59, 59, 999);

    const { data: allAppointments } = await (supabase as any)
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
    let reference = generateBookingReference();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const { data: existing } = await (supabase as any)
        .from('appointments')
        .select('id')
        .eq('booking_reference', reference)
        .single();

      if (!existing) break;

      reference = generateBookingReference();
      attempts++;
    }

    // If we couldn't generate a unique reference, use timestamp-based
    if (attempts >= maxAttempts) {
      const timestamp = Date.now().toString().slice(-6);
      reference = `APT-${new Date().getFullYear()}-${timestamp}`;
    }

    // Create appointment record
    const { data: appointment, error: apptError } = await (supabase as any)
      .from('appointments')
      .insert({
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
      })
      .select()
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
      const { data: addons } = await (supabase as any)
        .from('addons')
        .select('*')
        .in('id', validated.addon_ids);

      if (addons && addons.length > 0) {
        const addonInserts = addons.map((addon: any) => ({
          appointment_id: appointment.id,
          addon_id: addon.id,
          price: addon.price,
        }));

        const { error: addonError } = await (supabase as any)
          .from('appointment_addons')
          .insert(addonInserts);

        if (addonError) {
          console.error('Error creating appointment addons:', addonError);
          // Non-fatal error, continue
        }
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
