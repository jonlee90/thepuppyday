/**
 * Breed-based Grooming Reminder Cron Job
 * Task 0037: API endpoint for scheduled breed reminder processing
 *
 * Runs daily at 9 AM (configured in Vercel/cron service)
 * Processes breed-based grooming reminders for eligible pets
 *
 * Usage:
 * - GET/POST /api/cron/breed-reminders
 * - Header: Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { processBreedReminders } from '@/lib/admin/breed-reminder-scheduler';

/**
 * Validate cron secret from request headers
 */
function validateCronSecret(request: NextRequest): boolean {
  // Skip validation in development/mock mode
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Breed Reminders Cron] CRON_SECRET not configured');
    return false;
  }

  if (!authHeader) {
    console.error('[Breed Reminders Cron] No authorization header provided');
    return false;
  }

  // Support both "Bearer <token>" and just "<token>"
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  return token === cronSecret;
}

/**
 * GET /api/cron/breed-reminders
 * Process breed-based grooming reminders
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Breed Reminders Cron] Starting job at:', new Date().toISOString());

    // Validate cron secret
    if (!validateCronSecret(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase client
    const supabase = await createServerSupabaseClient();

    // Process breed reminders
    const stats = await processBreedReminders(supabase);

    console.log('[Breed Reminders Cron] Job completed. Stats:', stats);

    // Return results
    return NextResponse.json({
      success: stats.errors.length === 0,
      timestamp: new Date().toISOString(),
      stats: {
        eligible_count: stats.eligible_count,
        sent_count: stats.sent_count,
        skipped_count: stats.skipped_count,
        error_count: stats.errors.length,
      },
      errors: stats.errors.length > 0 ? stats.errors : undefined,
    });
  } catch (error) {
    console.error('[Breed Reminders Cron] Fatal error:', error);

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
 * POST /api/cron/breed-reminders
 * Same as GET, supports both methods for different cron services
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
