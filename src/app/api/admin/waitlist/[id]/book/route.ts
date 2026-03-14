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
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { z } from 'zod';

const bookingSchema = z.object({
  scheduled_at: z.string().datetime({ offset: true }),
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
    await requireAdmin(supabase);
    const serviceClient = createServiceRoleClient();

    // Get waitlist entry with related data
    const { data: waitlistEntry, error: waitlistError } = await (serviceClient as any)
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

    // Get pet size for pricing
    const { data: pet } = await (serviceClient as any)
      .from('pets')
      .select('size')
      .eq('id', waitlistEntry.pet_id)
      .single();

    const petSize = pet?.size || 'medium';

    const { data: servicePrice } = await (serviceClient as any)
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

    // Generate unique booking reference
    let reference = generateBookingReference();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const { data: existing } = await (serviceClient as any)
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
    const { data: appointment, error: apptError } = await (serviceClient as any)
      .from('appointments')
      .insert({
        customer_id: waitlistEntry.customer_id,
        pet_id: waitlistEntry.pet_id,
        service_id: waitlistEntry.service_id,
        scheduled_at: validated.scheduled_at,
        duration_minutes: durationMinutes,
        status: 'confirmed',
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
    const { error: updateError } = await (serviceClient as any)
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
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error booking from waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
