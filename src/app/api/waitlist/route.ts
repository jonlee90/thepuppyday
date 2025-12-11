/**
 * POST /api/waitlist - Add customer to waitlist for a date/service
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/mocks/supabase/store';
import type { WaitlistEntry } from '@/types/database';
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

    const store = getMockStore();

    // Check for existing active entry for same customer/date/service/pet
    const existingEntries = (store
      .select('waitlist', {
        column: 'customer_id',
        value: validated.customer_id,
      }) as unknown as WaitlistEntry[])
      .filter(
        (w) =>
          w.requested_date === validated.requested_date &&
          w.service_id === validated.service_id &&
          w.pet_id === validated.pet_id &&
          w.status === 'active'
      );

    if (existingEntries.length > 0) {
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
    const entry = store.insert('waitlist', {
      customer_id: validated.customer_id,
      pet_id: validated.pet_id,
      service_id: validated.service_id,
      requested_date: validated.requested_date,
      time_preference: validated.time_preference,
      status: 'active',
      notified_at: null,
    }) as unknown as WaitlistEntry;

    // Calculate position (count active entries for this date)
    const position = (store
      .select('waitlist', {
        column: 'requested_date',
        value: validated.requested_date,
      }) as unknown as WaitlistEntry[])
      .filter((w) => w.status === 'active').length;

    return NextResponse.json({
      success: true,
      waitlist_id: entry.id,
      position,
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
