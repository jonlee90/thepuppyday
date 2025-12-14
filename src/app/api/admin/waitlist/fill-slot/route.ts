/**
 * Admin Waitlist Fill Slot API Route
 * POST /api/admin/waitlist/fill-slot
 *
 * Creates slot offer and sends SMS notifications to selected waitlist customers.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

// Import based on environment
const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
const { sendWaitlistOfferSMS } = useMocks
  ? require('@/mocks/twilio/waitlist-sms')
  : require('@/lib/twilio/waitlist-sms');

export const dynamic = 'force-dynamic';

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

    // Parse request body
    const body = await request.json();
    const {
      service_id,
      appointment_date,
      appointment_time,
      waitlist_entry_ids,
      discount_percentage = 10,
      response_window_hours = 2,
    } = body;

    // Validate required fields
    if (
      !service_id ||
      !appointment_date ||
      !appointment_time ||
      !waitlist_entry_ids ||
      waitlist_entry_ids.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: service_id, appointment_date, appointment_time, waitlist_entry_ids',
        },
        { status: 400 }
      );
    }

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + response_window_hours);

    // Create slot offer record
    const { data: slotOffer, error: offerError } = await (supabase as any)
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
    const { data: entries, error: entriesError } = await (supabase as any)
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

    // Send SMS to each customer
    let notificationsSent = 0;
    let notificationsFailed = 0;

    for (const entry of entries) {
      if (!entry.customer?.phone) {
        console.warn(`No phone number for customer ${entry.customer_id}`);
        notificationsFailed++;
        continue;
      }

      try {
        const result = await sendWaitlistOfferSMS(supabase, {
          customerName: `${entry.customer.first_name} ${entry.customer.last_name}`,
          customerPhone: entry.customer.phone,
          customerId: entry.customer_id,
          petName: entry.pet?.name || 'your pet',
          serviceName: entry.service?.name || 'grooming',
          appointmentDate: appointment_date,
          appointmentTime: appointment_time,
          discountPercentage: discount_percentage,
          responseWindowHours: response_window_hours,
          offerId: slotOffer.id,
        });

        if (result.success) {
          notificationsSent++;

          // Update waitlist entry
          await (supabase as any)
            .from('waitlist')
            .update({
              status: 'notified',
              notified_at: new Date().toISOString(),
              offer_expires_at: expiresAt.toISOString(),
              offer_id: slotOffer.id,
            })
            .eq('id', entry.id);
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
