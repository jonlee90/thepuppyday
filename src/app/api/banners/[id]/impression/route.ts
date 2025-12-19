/**
 * Banner Impression Tracking Endpoint
 * Task 0179: Track banner impressions (views)
 *
 * POST /api/banners/[id]/impression - Track banner impression
 *
 * Public endpoint (no authentication required)
 * - Atomically increments impression_count in promo_banners table
 * - Returns success status
 * - Does not validate banner is active (track all views)
 * - Implements rate limiting (100 impressions per IP per minute)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Rate limit: 100 impressions per IP per minute
const RATE_LIMIT = {
  limit: 100,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * POST /api/banners/[id]/impression
 * Track banner impression
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const bannerId = params.id;

    // Get client IP for rate limiting
    const clientIp = getClientIp(request);
    const rateLimitKey = `banner-impression:${clientIp}`;

    // Check rate limit
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMIT);

    if (!rateLimitResult.allowed) {
      console.warn(
        `[Banner Impression] Rate limit exceeded for IP ${clientIp}:`,
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

    // Atomically increment impression_count using SQL
    // This prevents race conditions when multiple users view simultaneously
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any).rpc(
      'increment_banner_impressions',
      { banner_id: bannerId }
    );

    // If RPC function doesn't exist, fall back to regular update
    if (updateError && updateError.message.includes('function')) {
      console.warn(
        '[Banner Impression] RPC function not found, using fallback update'
      );

      // Fetch current count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: banner } = await (supabase as any)
        .from('promo_banners')
        .select('impression_count')
        .eq('id', bannerId)
        .single();

      if (!banner) {
        return NextResponse.json(
          { error: 'Banner not found' },
          { status: 404 }
        );
      }

      // Increment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: fallbackError } = await (supabase as any)
        .from('promo_banners')
        .update({
          impression_count: (banner.impression_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bannerId);

      if (fallbackError) {
        console.error(
          '[Banner Impression] Failed to update impression count:',
          fallbackError
        );
        // Return success anyway (don't fail silently for user)
      }
    } else if (updateError) {
      console.error('[Banner Impression] Failed to increment impressions:', updateError);
      // Return success anyway (tracking failure shouldn't block user)
    }

    // Log impression event for analytics
    console.log(
      `[Banner Impression] Tracked impression for banner ${bannerId} from IP ${clientIp}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Banner Impression] Error tracking impression:', error);

    // Return success to not block user experience
    return NextResponse.json({ success: true });
  }
}
