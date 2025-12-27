/**
 * Google Calendar Webhook Endpoint
 * Receives push notifications from Google Calendar when events change
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, type AppSupabaseClient } from '@/lib/supabase/server';
import { processWebhookNotification } from '@/lib/calendar/webhook/processor';

/**
 * POST /api/admin/calendar/webhook
 * Receives webhook notifications from Google Calendar
 *
 * Google Calendar sends notifications with these headers:
 * - X-Goog-Channel-ID: Channel UUID we registered
 * - X-Goog-Resource-ID: Resource ID from Google
 * - X-Goog-Resource-State: State (sync, exists, not_exists)
 * - X-Goog-Message-Number: Sequence number
 *
 * We must respond within 5 seconds to acknowledge receipt
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Extract webhook headers
    const channelId = request.headers.get('x-goog-channel-id');
    const resourceId = request.headers.get('x-goog-resource-id');
    const resourceState = request.headers.get('x-goog-resource-state');
    const messageNumber = request.headers.get('x-goog-message-number');

    console.log('Received webhook notification:', {
      channelId,
      resourceId,
      resourceState,
      messageNumber,
      timestamp: new Date().toISOString(),
    });

    // Validate required headers
    if (!channelId || !resourceId || !resourceState) {
      console.warn('Invalid webhook notification: missing required headers');
      return NextResponse.json(
        { error: 'Missing required webhook headers' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createServerSupabaseClient();

    // Verify webhook channel exists in database
    // @ts-expect-error - AppSupabaseClient union type issue
    const { data: connection, error: connectionError } = await supabase
      .from('calendar_connections')
      .select('id, webhook_channel_id, webhook_resource_id, calendar_id')
      .eq('webhook_channel_id', channelId)
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      console.warn('Webhook notification for unknown or inactive channel:', channelId);
      return NextResponse.json(
        { error: 'Unknown or inactive webhook channel' },
        { status: 404 }
      );
    }

    // Verify resource ID matches
    if (connection.webhook_resource_id !== resourceId) {
      console.warn('Webhook resource ID mismatch:', {
        expected: connection.webhook_resource_id,
        received: resourceId,
      });
      return NextResponse.json(
        { error: 'Resource ID mismatch' },
        { status: 400 }
      );
    }

    // Handle different resource states
    if (resourceState === 'sync') {
      // Initial sync notification - acknowledge but don't process
      console.log('Received sync notification (initial webhook registration)');
      return NextResponse.json({ success: true, message: 'Sync acknowledged' });
    }

    if (resourceState === 'not_exists') {
      // Calendar deleted or access revoked
      console.warn('Calendar no longer exists or access revoked:', {
        connectionId: connection.id,
      });

      // Deactivate connection
      // @ts-expect-error - AppSupabaseClient union type issue
      await supabase
        .from('calendar_connections')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);

      // Log to sync log
      // @ts-expect-error - AppSupabaseClient union type issue
      await supabase
        .from('calendar_sync_log')
        .insert({
          connection_id: connection.id,
          sync_type: 'webhook',
          operation: 'delete',
          status: 'failed',
          error_message: 'Calendar no longer exists or access revoked',
          error_code: 'CALENDAR_NOT_EXISTS',
          details: { resource_state: resourceState },
        });

      return NextResponse.json({ success: true, message: 'Calendar access revoked' });
    }

    // Resource state is 'exists' - changes detected
    // Queue webhook processing in background (non-blocking)
    // We respond immediately to meet the 5-second deadline
    processWebhookInBackground(connection.id, resourceState, supabase);

    const duration = Date.now() - startTime;

    console.log(`Webhook acknowledged in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Webhook received',
      duration_ms: duration,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);

    // Always return 200 OK to prevent Google from retrying
    // Log the error but acknowledge receipt
    return NextResponse.json({
      success: true,
      message: 'Webhook received with error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Process webhook notification in background
 * This is non-blocking to ensure fast response to Google
 *
 * @param connectionId - Calendar connection ID
 * @param resourceState - Resource state from webhook
 * @param supabase - Supabase client
 */
async function processWebhookInBackground(
  connectionId: string,
  resourceState: string,
  supabase: AppSupabaseClient
): Promise<void> {
  try {
    console.log(`Processing webhook for connection ${connectionId} in background...`);

    await processWebhookNotification(supabase, connectionId, resourceState);

    console.log(`Webhook processing completed for connection ${connectionId}`);
  } catch (error) {
    console.error('Background webhook processing error:', error);

    // Log error to sync log
    // @ts-expect-error - AppSupabaseClient union type issue
    await supabase
      .from('calendar_sync_log')
      .insert({
        connection_id: connectionId,
        sync_type: 'webhook',
        operation: 'update',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_code: 'WEBHOOK_PROCESSING_ERROR',
      });
  }
}

/**
 * GET /api/admin/calendar/webhook
 * Health check endpoint for webhook URL verification
 */
export async function GET() {
  return NextResponse.json({
    message: 'Google Calendar Webhook Endpoint',
    status: 'active',
  });
}
