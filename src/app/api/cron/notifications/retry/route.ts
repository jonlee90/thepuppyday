/**
 * Retry Processing Cron Job
 * Task 0114: Process failed notification retries
 *
 * Runs every 5 minutes (configured in vercel.json)
 * Processes pending notification retries using exponential backoff
 *
 * Usage:
 * - GET/POST /api/cron/notifications/retry
 * - Header: Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getNotificationService } from '@/lib/notifications';
import { validateCronSecret } from '@/lib/cron/auth';

/**
 * In-memory lock to prevent concurrent execution
 */
let isProcessing = false;

/**
 * GET /api/cron/notifications/retry
 * Process pending notification retries
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[Retry Processing Cron] Starting job at:', new Date().toISOString());

    // Validate cron secret
    if (!validateCronSecret(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check for concurrent execution
    if (isProcessing) {
      console.warn('[Retry Processing Cron] Job already running, skipping...');
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Job already running',
        timestamp: new Date().toISOString(),
      });
    }

    isProcessing = true;

    // Create service role client (bypasses RLS for system operations)
    const supabase = createServiceRoleClient();

    // Get notification service and process retries
    const notificationService = getNotificationService(supabase);
    const result = await notificationService.processRetries();

    const duration = Date.now() - startTime;

    console.log('[Retry Processing Cron] Job completed. Stats:', {
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      errors: result.errors.length,
      duration_ms: duration,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      duration_ms: duration,
      // Include error details if any (but limit to first 10 for response size)
      errors: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined,
      error_count: result.errors.length,
    });
  } catch (error) {
    console.error('[Retry Processing Cron] Fatal error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } finally {
    isProcessing = false;
  }
}

/**
 * POST /api/cron/notifications/retry
 * Same as GET, supports both methods for different cron services
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
