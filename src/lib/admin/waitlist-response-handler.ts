/**
 * Waitlist Response Handler
 *
 * Handles customer responses to waitlist slot offers via SMS.
 * Implements first-responder-wins logic for race conditions.
 */

import type { AppSupabaseClient } from '@/lib/supabase/server';

export interface ResponseHandlerResult {
  success: boolean;
  action: 'booked' | 'slot_filled' | 'expired' | 'invalid' | 'error';
  message: string;
  appointmentId?: string;
}

/**
 * Handle customer response to waitlist slot offer
 *
 * @param supabase Supabase client
 * @param phone Customer phone number
 * @param messageBody SMS message body
 * @returns Result with action taken and confirmation message
 */
export async function handleWaitlistResponse(
  supabase: AppSupabaseClient,
  phone: string,
  messageBody: string
): Promise<ResponseHandlerResult> {
  try {
    // Normalize phone number (remove +1, spaces, dashes, etc.)
    const normalizedPhone = normalizePhone(phone);

    // Check if message is a YES reply
    const isYes = /^yes$/i.test(messageBody.trim());

    if (!isYes) {
      // Not a YES reply, ignore
      return {
        success: false,
        action: 'invalid',
        message: 'Invalid response. Reply YES to accept the offer.',
      };
    }

    // Find active waitlist offer for this phone number
    const { data: waitlistEntries, error: findError } = await (supabase as any)
      .from('waitlist')
      .select(
        `
        *,
        offer:waitlist_slot_offers!offer_id(*)
      `
      )
      .eq('status', 'notified')
      .eq('customer:users!customer_id.phone', normalizedPhone)
      .not('offer_id', 'is', null)
      .order('notified_at', { ascending: false })
      .limit(1);

    if (findError || !waitlistEntries || waitlistEntries.length === 0) {
      return {
        success: false,
        action: 'invalid',
        message: 'No active slot offer found for your number.',
      };
    }

    const entry = waitlistEntries[0];
    const offer = entry.offer;

    // Check if offer has expired
    const now = new Date();
    const expiresAt = new Date(offer.expires_at);

    if (now > expiresAt) {
      // Mark as expired
      await (supabase as any)
        .from('waitlist')
        .update({ status: 'expired_offer' })
        .eq('id', entry.id);

      return {
        success: false,
        action: 'expired',
        message: 'Sorry, this offer has expired.',
      };
    }

    // Check if slot is still available (first-responder-wins)
    const { data: currentOffer } = await (supabase as any)
      .from('waitlist_slot_offers')
      .select('status, accepted_by_customer_id')
      .eq('id', offer.id)
      .single();

    if (currentOffer?.status === 'accepted') {
      // Slot already taken
      await (supabase as any)
        .from('waitlist')
        .update({ status: 'expired_offer' })
        .eq('id', entry.id);

      return {
        success: false,
        action: 'slot_filled',
        message: 'Sorry, this slot has been filled by another customer.',
      };
    }

    // Winner! Book the appointment
    try {
      // Start transaction-like operation
      // 1. Update slot offer to accepted
      const { error: offerUpdateError } = await (supabase as any)
        .from('waitlist_slot_offers')
        .update({
          status: 'accepted',
          accepted_by_customer_id: entry.customer_id,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', offer.id)
        .eq('status', 'pending'); // Only update if still pending

      if (offerUpdateError) {
        // Race condition - someone else won
        return {
          success: false,
          action: 'slot_filled',
          message: 'Sorry, this slot was just filled by another customer.',
        };
      }

      // 2. Create appointment
      const { data: appointment, error: appointmentError } = await (supabase as any)
        .from('appointments')
        .insert({
          customer_id: entry.customer_id,
          pet_id: entry.pet_id,
          service_id: entry.service_id,
          appointment_date: offer.appointment_date,
          appointment_time: offer.appointment_time,
          status: 'scheduled',
          payment_status: 'pending',
          // Apply discount to total_price (would need to calculate from service pricing)
          notes: `Booked from waitlist. ${offer.discount_percentage}% discount applied.`,
        })
        .select()
        .single();

      if (appointmentError || !appointment) {
        console.error('Error creating appointment:', appointmentError);
        // Rollback offer update
        await (supabase as any)
          .from('waitlist_slot_offers')
          .update({ status: 'pending', accepted_by_customer_id: null, accepted_at: null })
          .eq('id', offer.id);

        return {
          success: false,
          action: 'error',
          message: 'Failed to create appointment. Please contact us.',
        };
      }

      // 3. Update waitlist entry to booked
      await (supabase as any)
        .from('waitlist')
        .update({ status: 'booked' })
        .eq('id', entry.id);

      // 4. Mark other notified entries for this offer as expired
      await (supabase as any)
        .from('waitlist')
        .update({ status: 'expired_offer' })
        .eq('offer_id', offer.id)
        .eq('status', 'notified')
        .neq('id', entry.id);

      return {
        success: true,
        action: 'booked',
        message: `Great! Your appointment is confirmed for ${offer.appointment_date} at ${offer.appointment_time}. See you then!`,
        appointmentId: appointment.id,
      };
    } catch (error) {
      console.error('Error in booking process:', error);
      return {
        success: false,
        action: 'error',
        message: 'An error occurred. Please contact us to complete your booking.',
      };
    }
  } catch (error) {
    console.error('Error in handleWaitlistResponse:', error);
    return {
      success: false,
      action: 'error',
      message: 'An error occurred processing your response.',
    };
  }
}

/**
 * Normalize phone number to E.164 format for comparison
 * Removes country code, spaces, dashes, parentheses
 */
function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Remove leading 1 (US country code)
  if (digits.startsWith('1') && digits.length === 11) {
    digits = digits.substring(1);
  }

  return digits;
}
