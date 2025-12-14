/**
 * Reminder Link Tracking Endpoint
 * Task 0039: Track when customers click reminder links
 *
 * Flow:
 * 1. Customer clicks reminder link: /api/track/{trackingId}
 * 2. Update notifications_log.clicked_at timestamp
 * 3. Redirect to booking page with tracking parameter
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
): Promise<NextResponse> {
  try {
    const { trackingId } = await params;

    console.log(`[Tracking] Processing click for tracking ID: ${trackingId}`);

    // Validate tracking ID format (should be UUID)
    if (!trackingId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trackingId)) {
      console.warn(`[Tracking] Invalid tracking ID format: ${trackingId}`);
      return NextResponse.redirect(new URL('/', req.url));
    }

    const supabase = await createServerSupabaseClient();

    // Find notification log entry by tracking_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: notification, error: findError } = await (supabase as any)
      .from('notifications_log')
      .select('id, customer_id, clicked_at')
      .eq('tracking_id', trackingId)
      .maybeSingle();

    if (findError) {
      console.error('[Tracking] Error finding notification:', findError);
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (!notification) {
      console.warn(`[Tracking] No notification found for tracking ID: ${trackingId}`);
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Update clicked_at timestamp if not already set (avoid overwriting first click)
    if (!notification.clicked_at) {
      const now = new Date().toISOString();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('notifications_log')
        .update({ clicked_at: now })
        .eq('id', notification.id);

      if (updateError) {
        console.error('[Tracking] Error updating clicked_at:', updateError);
        // Continue with redirect even if update fails
      } else {
        console.log(`[Tracking] Updated clicked_at for notification ${notification.id}`);
      }
    } else {
      console.log(`[Tracking] Click already tracked for notification ${notification.id}`);
    }

    // Redirect to booking page with tracking parameter
    const bookingUrl = new URL('/book', req.url);
    bookingUrl.searchParams.set('tracking_id', trackingId);

    // If we have customer_id, we could pre-fill customer info
    // but for now just pass the tracking_id for conversion attribution

    console.log(`[Tracking] Redirecting to: ${bookingUrl.pathname}${bookingUrl.search}`);

    return NextResponse.redirect(bookingUrl);
  } catch (error) {
    console.error('[Tracking] Unexpected error:', error);
    // Gracefully redirect to home on any error
    return NextResponse.redirect(new URL('/', req.url));
  }
}
