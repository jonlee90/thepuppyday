/**
 * Admin Waitlist Fill Slot API Route
 * POST /api/admin/waitlist/fill-slot
 *
 * Creates slot offer and sends SMS notifications to selected waitlist customers.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const fillSlotSchema = z.object({
  service_id: z.string().uuid('service_id must be a valid UUID'),
  appointment_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'appointment_date must be in YYYY-MM-DD format'
    )
    .refine(
      (date) => {
        const parsed = new Date(date);
        return !isNaN(parsed.getTime()) && parsed >= new Date(new Date().setHours(0, 0, 0, 0));
      },
      { message: 'appointment_date must be a valid future date' }
    ),
  appointment_time: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'appointment_time must be in HH:MM format'),
  waitlist_entry_ids: z
    .array(z.string().uuid('Each waitlist entry ID must be a valid UUID'))
    .min(1, 'At least one waitlist entry ID is required')
    .max(10, 'Maximum 10 waitlist entries can be processed at once'),
  discount_percentage: z
    .number()
    .int('discount_percentage must be an integer')
    .min(0, 'discount_percentage must be at least 0')
    .max(100, 'discount_percentage cannot exceed 100')
    .default(10),
  response_window_hours: z
    .number()
    .int('response_window_hours must be an integer')
    .positive('response_window_hours must be positive')
    .max(168, 'response_window_hours cannot exceed 168 (1 week)')
    .default(2),
});

/**
 * POST /api/admin/waitlist/fill-slot
 *
 * Request Body:
 * - service_id: string (required)
 * - appointment_date: string (required, YYYY-MM-DD)
 * - appointment_time: string (required, HH:MM)
 * - waitlist_entry_ids: string[] (required, IDs of waitlist entries to notify)
 * - discount_percentage: number (optional, default: 10)
 * - response_window_hours: number (optional, default: 2)
 *
 * Response:
 * - offer_id: ID of created slot offer
 * - notifications_sent: Number of SMS sent successfully
 * - notifications_failed: Number of SMS that failed
 *
 * Status Codes:
 * - 200: Success
 * - 400: Bad request
 * - 403: Unauthorized
 * - 500: Server error
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check admin authorization
    const admin = await requireAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();

    let validated;
    try {
      validated = fillSlotSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation error',
            details: error.issues.map(issue => ({
              path: issue.path.join('.'),
              message: issue.message,
            }))
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const {
      service_id,
      appointment_date,
      appointment_time,
      waitlist_entry_ids,
      discount_percentage,
      response_window_hours,
    } = validated;

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + response_window_hours);

    // Create slot offer record
    const { data: slotOffer, error: offerError } = await supabase
      .from('waitlist_slot_offers')
      .insert({
        appointment_date,
        appointment_time,
        service_id,
        discount_percentage,
        response_window_hours,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (offerError || !slotOffer) {
      console.error('Error creating slot offer:', offerError);
      return NextResponse.json(
        { error: 'Failed to create slot offer' },
        { status: 500 }
      );
    }

    // Fetch waitlist entries with customer and pet data
    const { data: entries, error: entriesError } = await supabase
      .from('waitlist')
      .select(
        `
        *,
        customer:users!customer_id(id, first_name, last_name, phone),
        pet:pets!pet_id(id, name),
        service:services!service_id(id, name)
      `
      )
      .in('id', waitlist_entry_ids);

    if (entriesError || !entries) {
      console.error('Error fetching waitlist entries:', entriesError);
      return NextResponse.json(
        { error: 'Failed to fetch waitlist entries' },
        { status: 500 }
      );
    }

    // Send SMS to each customer using new notification trigger (Task 0110)
    let notificationsSent = 0;
    let notificationsFailed = 0;

    const { triggerWaitlistNotification } = await import(
      '@/lib/notifications/triggers'
    );

    for (const entry of entries) {
      if (!entry.customer?.phone) {
        console.warn(`No phone number for customer ${entry.customer_id}`);
        notificationsFailed++;
        continue;
      }

      try {
        const result = await triggerWaitlistNotification(supabase, {
          waitlistEntryId: entry.id,
          customerId: entry.customer_id,
          customerPhone: entry.customer.phone,
          petName: entry.pet?.name || 'your pet',
          availableDate: appointment_date,
          availableTime: appointment_time,
          serviceId: service_id,
          expirationHours: response_window_hours,
        });

        if (result.smsSent) {
          notificationsSent++;
          // Note: waitlist entry is updated inside triggerWaitlistNotification
        } else if (result.skipped) {
          console.warn(
            `Notification skipped for ${entry.customer_id}: ${result.skipReason}`
          );
          notificationsFailed++;
        } else {
          notificationsFailed++;
        }
      } catch (error) {
        console.error(`Error sending SMS to ${entry.customer_id}:`, error);
        notificationsFailed++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        offer_id: slotOffer.id,
        notifications_sent: notificationsSent,
        notifications_failed: notificationsFailed,
        expires_at: expiresAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in fill-slot API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
