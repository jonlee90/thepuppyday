/**
 * POST /api/admin/waitlist/[id]/book
 * Book appointment from waitlist entry
 *
 * Manually book a customer from the waitlist by:
 * 1. Creating an appointment with selected date/time
 * 2. Applying optional discount
 * 3. Marking waitlist entry as 'booked'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const bookingSchema = z.object({
  scheduled_at: z.string().datetime(),
  discount_percentage: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const validated = bookingSchema.parse(body);
    const { id: waitlistId } = await params;

    const supabase = await createServerSupabaseClient();

    // Get waitlist entry with related data
    const { data: waitlistEntry, error: waitlistError } = await (supabase as any)
      .from('waitlist')
      .select(
        `
        *,
        customer:users!customer_id(id, first_name, last_name, email, phone),
        pet:pets!pet_id(id, name),
        service:services!service_id(*)
      `
      )
      .eq('id', waitlistId)
      .single();

    if (waitlistError || !waitlistEntry) {
      console.error('Error fetching waitlist entry:', waitlistError);
      return NextResponse.json(
        { error: 'Waitlist entry not found' },
        { status: 404 }
      );
    }

    // Verify entry is in bookable status
    if (waitlistEntry.status === 'booked') {
      return NextResponse.json(
        { error: 'Waitlist entry already booked' },
        { status: 400 }
      );
    }

    if (waitlistEntry.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Waitlist entry is cancelled' },
        { status: 400 }
      );
    }

    // Get service pricing for the pet size
    const { data: pet } = await (supabase as any)
      .from('pets')
      .select('size')
      .eq('id', waitlistEntry.pet_id)
      .single();

    const petSize = pet?.size || 'medium';

    const { data: servicePrice } = await (supabase as any)
      .from('service_prices')
      .select('*')
      .eq('service_id', waitlistEntry.service_id)
      .eq('size', petSize)
      .single();

    if (!servicePrice) {
      return NextResponse.json(
        { error: 'Service pricing not found for pet size' },
        { status: 400 }
      );
    }

    // Calculate total price with discount
    const basePrice = servicePrice.price;
    const discountAmount = (basePrice * validated.discount_percentage) / 100;
    const totalPrice = basePrice - discountAmount;

    // Get service duration
    const durationMinutes = waitlistEntry.service.duration_minutes || 60;

    // Check for slot conflicts
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

    // Check for conflicts
    const slotStart = new Date(validated.scheduled_at);
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

    for (const appointment of allAppointments || []) {
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
        return NextResponse.json(
          { error: 'Time slot conflicts with existing appointment', code: 'SLOT_CONFLICT' },
          { status: 409 }
        );
      }
    }

    // Generate unique booking reference
    let reference = generateBookingReference();
    let attempts = 0;
    const maxAttempts = 10;

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

    if (attempts >= maxAttempts) {
      const timestamp = Date.now().toString().slice(-6);
      reference = `APT-${new Date().getFullYear()}-${timestamp}`;
    }

    // Create appointment
    const { data: appointment, error: apptError } = await (supabase as any)
      .from('appointments')
      .insert({
        customer_id: waitlistEntry.customer_id,
        pet_id: waitlistEntry.pet_id,
        service_id: waitlistEntry.service_id,
        scheduled_at: validated.scheduled_at,
        duration_minutes: durationMinutes,
        status: 'scheduled',
        payment_status: 'pending',
        total_price: totalPrice,
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

    // Update waitlist entry to 'booked'
    const { error: updateError } = await (supabase as any)
      .from('waitlist')
      .update({
        status: 'booked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', waitlistId);

    if (updateError) {
      console.error('Error updating waitlist entry:', updateError);
      // Non-fatal, appointment is already created
    }

    return NextResponse.json({
      success: true,
      appointment_id: appointment.id,
      reference,
      scheduled_at: appointment.scheduled_at,
      total_price: totalPrice,
      discount_applied: discountAmount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error booking from waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
