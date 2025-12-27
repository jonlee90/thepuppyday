/**
 * Webhook Renewal Cron Job
 * Scheduled endpoint to renew expiring Google Calendar webhooks
 * Called daily by Vercel Cron or external scheduler
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { renewExpiringWebhooks } from '@/lib/calendar/webhook/renewal';

/**
 * GET /api/cron/calendar-webhook-renewal
 * Renew expiring webhooks (called by Vercel Cron daily)
 *
 * Security: Requires CRON_SECRET in Authorization header or query param
 *
 * Vercel Cron Configuration (vercel.json):
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/cron/calendar-webhook-renewal",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret for security
    const authorized = await verifyCronSecret(request);

    if (!authorized) {
      console.warn('Unauthorized webhook renewal cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting scheduled webhook renewal cron job...');

    // Create Supabase client (use service role for cron jobs)
    const supabase = await createServerSupabaseClient();

    // Renew expiring webhooks
    const summary = await renewExpiringWebhooks(supabase);

    const duration = Date.now() - startTime;

    console.log('Webhook renewal cron job completed:', {
      total: summary.total,
      renewed: summary.renewed,
      failed: summary.failed,
      skipped: summary.skipped,
      duration_ms: duration,
    });

    return NextResponse.json({
      success: true,
      summary: {
        total: summary.total,
        renewed: summary.renewed,
        failed: summary.failed,
        skipped: summary.skipped,
      },
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Webhook renewal cron job error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Verify cron secret for security
 * Checks Authorization header or query parameter
 *
 * @param request - Next.js request
 * @returns True if authorized
 */
async function verifyCronSecret(request: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;

  // If no CRON_SECRET configured, allow in development mode only
  if (!cronSecret) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      console.warn('CRON_SECRET not configured, allowing in development mode');
      return true;
    }
    console.error('CRON_SECRET not configured in production');
    return false;
  }

  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    if (token === cronSecret) {
      return true;
    }
  }

  // Check query parameter (fallback)
  const searchParams = request.nextUrl.searchParams;
  const secretParam = searchParams.get('secret');
  if (secretParam === cronSecret) {
    return true;
  }

  return false;
}

/**
 * POST /api/cron/calendar-webhook-renewal
 * Alternative POST endpoint for cron jobs that require POST method
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
