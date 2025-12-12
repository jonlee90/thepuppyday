/**
 * POST /api/waitlist - Add customer to waitlist for a date/service
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Validation schema for waitlist requests
 */
const waitlistSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  pet_id: z.string().uuid('Invalid pet ID'),
  service_id: z.string().uuid('Invalid service ID'),
  requested_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  time_preference: z
    .enum(['morning', 'afternoon', 'any'], {
      message: 'Time preference must be morning, afternoon, or any',
    })
    .default('any'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = waitlistSchema.parse(body);

    const supabase = await createServerSupabaseClient();

    // Check for existing active entry for same customer/date/service/pet
    const { data: existingEntries } = await (supabase as any)
      .from('waitlist')
      .select('*')
      .eq('customer_id', validated.customer_id)
      .eq('requested_date', validated.requested_date)
      .eq('service_id', validated.service_id)
      .eq('pet_id', validated.pet_id)
      .eq('status', 'active');

    if (existingEntries && existingEntries.length > 0) {
      return NextResponse.json(
        {
          error: 'Already on waitlist for this date',
          code: 'DUPLICATE_ENTRY',
          existing_entry: {
            waitlist_id: existingEntries[0].id,
            time_preference: existingEntries[0].time_preference,
          },
        },
        { status: 409 }
      );
    }

    // Create waitlist entry
    const { data: entry, error: insertError } = await (supabase as any)
      .from('waitlist')
      .insert({
        customer_id: validated.customer_id,
        pet_id: validated.pet_id,
        service_id: validated.service_id,
        requested_date: validated.requested_date,
        time_preference: validated.time_preference,
        status: 'active',
        notified_at: null,
      })
      .select()
      .single();

    if (insertError || !entry) {
      console.error('Error creating waitlist entry:', insertError);
      return NextResponse.json(
        { error: 'Failed to join waitlist' },
        { status: 500 }
      );
    }

    // Calculate position (count active entries for this date)
    const { count } = await (supabase as any)
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('requested_date', validated.requested_date)
      .eq('status', 'active');

    return NextResponse.json({
      success: true,
      waitlist_id: entry.id,
      position: count || 1,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating waitlist entry:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
}
