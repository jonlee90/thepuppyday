/**
 * POST /api/waitlist - Add customer to waitlist for a date/service
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse, after } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { waitlistDisabledResponse } from '@/lib/waitlist-guard';
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
  preferred_time: z.union([
    z.string().regex(/^\d{1,2}:\d{2}$/, 'Preferred time must be in HH:MM format'),
    z.null(),
  ]).optional(),
});

export async function POST(req: NextRequest) {
  const guard = waitlistDisabledResponse();
  if (guard) return guard;

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
        preferred_time: validated.preferred_time || null,
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

    const position = count || 1;

    // Send waitlist confirmation notification in background (non-blocking)
    // Use service role client because after() runs after the response —
    // the request cookie context is gone, so RLS-authenticated queries fail.
    after(async () => {
      try {
        const serviceClient = createServiceRoleClient();
        const { triggerWaitlistAdded } = await import('@/lib/notifications/triggers');

        // Fetch customer, pet, service in parallel
        const [{ data: customer }, { data: pet }, { data: service }] = await Promise.all([
          (serviceClient as any).from('users').select('id, first_name, last_name, email, phone').eq('id', validated.customer_id).single(),
          (serviceClient as any).from('pets').select('name').eq('id', validated.pet_id).single(),
          (serviceClient as any).from('services').select('name').eq('id', validated.service_id).single(),
        ]);

        if (customer && pet && service) {
          await triggerWaitlistAdded(serviceClient as any, {
            waitlistEntryId: entry.id,
            customerId: validated.customer_id,
            customerName: `${customer.first_name} ${customer.last_name}`,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            petName: pet.name,
            serviceName: service.name,
            requestedDate: validated.requested_date,
            timePreference: validated.time_preference,
            position,
          });
        }
      } catch (notifError) {
        console.error('[Waitlist API] Waitlist added notification error:', notifError);
      }
    });

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
