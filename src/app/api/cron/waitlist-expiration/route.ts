/**
 * Waitlist Expiration Cron Job
 * GET /api/cron/waitlist-expiration
 *
 * Processes expired waitlist slot offers.
 * Should be called every 15 minutes via cron job (e.g., Vercel Cron, GitHub Actions).
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { processExpiredOffers, getExpirationStats } from '@/lib/admin/waitlist-expiration';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/waitlist-expiration
 *
 * Query Parameters:
 * - secret: Cron secret key for authentication (optional in dev mode)
 *
 * Response:
 * - expired_offers: Number of offers expired
 * - expired_waitlist_entries: Number of waitlist entries updated
 * - stats: Current offer statistics
 * - errors: Array of error messages (if any)
 *
 * Status Codes:
 * - 200: Success
 * - 401: Unauthorized (invalid cron secret)
 * - 500: Server error
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Verify cron secret (skip in development)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const cronSecret = process.env.CRON_SECRET;

    if (!isDevelopment && cronSecret) {
      if (!secret || secret !== cronSecret) {
        console.warn('⚠️ Unauthorized cron attempt');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('🕐 Running waitlist expiration cron job...');

    const supabase = await createServerSupabaseClient();

    // Process expired offers
    const result = await processExpiredOffers(supabase);

    // Get current stats
    const stats = await getExpirationStats(supabase);

    console.log('✅ Cron job completed');

    return NextResponse.json(
      {
        success: true,
        expired_offers: result.expiredOffers,
        expired_waitlist_entries: result.expiredWaitlistEntries,
        errors: result.errors,
        stats,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error in waitlist expiration cron:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual triggering (same as GET)
 */
export async function POST(request: Request) {
  return GET(request);
}
