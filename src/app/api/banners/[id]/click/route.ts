/**
 * Banner Click Tracking Endpoint
 * Task 0177: Banner click tracking endpoint
 *
 * GET /api/banners/[id]/click - Track banner click and redirect
 *
 * Public endpoint (no authentication required)
 * - Atomically increments click_count in promo_banners table
 * - Redirects to banner's click_url with utm_source parameter
 * - Validates banner is active before tracking
 * - Implements rate limiting (100 clicks per IP per minute)
 * - Returns 404 if banner not found or not active
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import type { PromoBanner } from '@/types/database';

// Rate limit: 100 clicks per IP per minute
const RATE_LIMIT = {
  limit: 100,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * GET /api/banners/[id]/click
 * Track banner click and redirect to click_url
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const bannerId = params.id;

    // Get client IP for rate limiting
    const clientIp = getClientIp(request);
    const rateLimitKey = `banner-click:${clientIp}`;

    // Check rate limit
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMIT);

    if (!rateLimitResult.allowed) {
      console.warn(
        `[Banner Click] Rate limit exceeded for IP ${clientIp}:`,
        `${rateLimitResult.currentCount}/${rateLimitResult.limit}`
      );
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Fetch banner and verify it's active
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: banner, error: fetchError } = (await (supabase as any)
      .from('promo_banners')
      .select('*')
      .eq('id', bannerId)
      .single()) as {
      data: PromoBanner | null;
      error: Error | null;
    };

    if (fetchError || !banner) {
      console.warn(`[Banner Click] Banner not found: ${bannerId}`);
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    // Verify banner is active
    if (!banner.is_active) {
      console.warn(`[Banner Click] Banner not active: ${bannerId}`);
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    // Verify banner has a click URL
    if (!banner.click_url) {
      console.warn(`[Banner Click] Banner has no click URL: ${bannerId}`);
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    // Atomically increment click_count using SQL
    // This prevents race conditions when multiple users click simultaneously
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any).rpc(
      'increment_banner_clicks',
      { banner_id: bannerId }
    );

    // If RPC function doesn't exist, fall back to regular update
    if (updateError && updateError.message.includes('function')) {
      console.warn(
        '[Banner Click] RPC function not found, using fallback update'
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: fallbackError } = await (supabase as any)
        .from('promo_banners')
        .update({
          click_count: banner.click_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bannerId);

      if (fallbackError) {
        console.error('[Banner Click] Failed to update click count:', fallbackError);
        // Continue with redirect even if tracking fails
      }
    } else if (updateError) {
      console.error('[Banner Click] Failed to increment clicks:', updateError);
      // Continue with redirect even if tracking fails
    }

    // Build redirect URL with UTM parameter
    const redirectUrl = new URL(banner.click_url);
    redirectUrl.searchParams.set('utm_source', 'thepuppyday');

    // Log click event for analytics
    console.log(
      `[Banner Click] Tracked click for banner ${bannerId} from IP ${clientIp}, ` +
        `redirecting to ${redirectUrl.toString()}`
    );

    // Redirect to banner's click_url (302 temporary redirect)
    return NextResponse.redirect(redirectUrl.toString(), { status: 302 });
  } catch (error) {
    console.error('[Banner Click] Error tracking click:', error);

    // Return generic error (don't expose internal details)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
