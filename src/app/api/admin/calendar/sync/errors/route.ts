/**
 * Calendar Sync Errors Endpoint
 * GET endpoint for failed sync operations
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/calendar/sync/errors
 * Get list of failed sync operations
 *
 * Query params:
 * - dateFrom (optional) - ISO date string
 * - dateTo (optional) - ISO date string
 * - errorType (optional) - filter by error type
 * - limit (optional) - default 50
 */
export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // FIXED: Critical #3 - Input validation to prevent SQL injection
    const VALID_ERROR_TYPES = ['rate_limit', 'auth', 'network', 'validation', 'unknown'] as const;
    const errorTypeParam = searchParams.get('errorType');
    const errorType = errorTypeParam && VALID_ERROR_TYPES.includes(errorTypeParam as any)
      ? errorTypeParam
      : null;

    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Build query
    let query = supabase
      .from('calendar_sync_retry_queue')
      .select(`
        id,
        appointment_id,
        operation,
        retry_count,
        next_retry_at,
        last_retry_at,
        error_details,
        created_at,
        updated_at,
        appointment:appointments (
          id,
          scheduled_at,
          status,
          pet:pets (
            name
          ),
          customer:users!customer_id (
            first_name,
            last_name
          ),
          service:services (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Execute query
    const { data: retryQueue, error: queryError } = await query;

    if (queryError) {
      throw new Error(`Failed to fetch retry queue: ${queryError.message}`);
    }

    // Get total count (without limit)
    const { count: totalCount } = await supabase
      .from('calendar_sync_retry_queue')
      .select('*', { count: 'exact', head: true });

    // Transform data to match expected format
    const errors = (retryQueue || []).map((entry: any) => {
      // Extract error type from error_details
      const errorDetails = entry.error_details || {};
      const lastError = errorDetails.last_error || errorDetails.message || 'Unknown error';

      // Determine error type from error message
      let detectedErrorType = 'unknown';
      if (typeof lastError === 'string') {
        if (lastError.toLowerCase().includes('rate limit')) {
          detectedErrorType = 'rate_limit';
        } else if (lastError.toLowerCase().includes('auth')) {
          detectedErrorType = 'auth';
        } else if (lastError.toLowerCase().includes('network') || lastError.toLowerCase().includes('timeout')) {
          detectedErrorType = 'network';
        } else if (lastError.toLowerCase().includes('validation')) {
          detectedErrorType = 'validation';
        }
      }

      // Filter by error type if specified
      if (errorType && detectedErrorType !== errorType) {
        return null;
      }

      return {
        id: entry.id,
        appointmentId: entry.appointment_id,
        appointment: entry.appointment ? {
          id: entry.appointment.id,
          scheduled_at: entry.appointment.scheduled_at,
          status: entry.appointment.status,
          pet: Array.isArray(entry.appointment.pet)
            ? entry.appointment.pet[0]
            : entry.appointment.pet,
          customer: Array.isArray(entry.appointment.customer)
            ? entry.appointment.customer[0]
            : entry.appointment.customer,
          service: Array.isArray(entry.appointment.service)
            ? entry.appointment.service[0]
            : entry.appointment.service,
        } : null,
        operation: entry.operation,
        error: lastError,
        errorType: detectedErrorType,
        retryCount: entry.retry_count,
        nextRetryAt: entry.next_retry_at,
        lastRetryAt: entry.last_retry_at,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      };
    }).filter(Boolean); // Remove null entries (filtered out by errorType)

    return NextResponse.json({
      errors,
      total: totalCount || 0,
    });
  } catch (error) {
    console.error('[Sync Errors API] Error fetching sync errors:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch sync errors',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
