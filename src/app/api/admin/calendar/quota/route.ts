/**
 * Google Calendar API Quota Status Endpoint
 * GET endpoint for quota monitoring
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getQuotaStatus } from '@/lib/calendar/quota/tracker';

/**
 * GET /api/admin/calendar/quota
 * Get current API quota status
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get quota status
    const quotaStatus = await getQuotaStatus(supabase);

    return NextResponse.json({
      current: quotaStatus.current,
      limit: quotaStatus.limit,
      percentage: quotaStatus.percentage,
      resetAt: quotaStatus.resetAt,
      timeUntilReset: quotaStatus.timeUntilReset,
      isNearLimit: quotaStatus.isNearLimit,
    });
  } catch (error) {
    console.error('[Quota API] Error fetching quota status:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch quota status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
