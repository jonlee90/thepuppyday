/**
 * Phase 8: Unsubscribe API
 * GET /api/unsubscribe?token=xxx - Process unsubscribe from email links
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { validateUnsubscribeToken } from '@/lib/notifications/unsubscribe';
import { disableMarketing, disableNotificationChannel } from '@/lib/notifications/preferences';

function buildRedirect(req: NextRequest, pathname: string, params?: Record<string, string>) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return NextResponse.redirect(url);
}

/**
 * Process unsubscribe request
 * Validates token, updates preferences, and redirects to confirmation page
 */
export async function GET(req: NextRequest) {
  try {
    // Get token from query parameters
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return buildRedirect(req, '/unsubscribe/error', { reason: 'missing_token' });
    }

    // Validate token
    const payload = validateUnsubscribeToken(token);

    if (!payload) {
      return buildRedirect(req, '/unsubscribe/error', { reason: 'invalid_token' });
    }

    const { userId, notificationType, channel } = payload;

    // Use service role client to update preferences
    const supabase = createServiceRoleClient();

    // Log the unsubscribe action
    try {
      await supabase.from('notifications_log').insert({
        customer_id: userId,
        type: notificationType,
        channel: channel,
        recipient: 'unsubscribe',
        content: `User unsubscribed from ${notificationType} via ${channel}`,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('[Unsubscribe] Failed to log unsubscribe action:', logError);
      // Non-fatal, continue
    }

    // Update preferences based on notification type
    let result: { success: boolean; error?: string };

    if (notificationType === 'marketing') {
      // Disable all marketing communications
      result = await disableMarketing(supabase, userId);
    } else {
      // Disable specific notification type and channel
      result = await disableNotificationChannel(supabase, userId, notificationType, channel);
    }

    if (!result.success) {
      console.error('[Unsubscribe] Failed to update preferences:', result.error);
      return buildRedirect(req, '/unsubscribe/error', { reason: 'update_failed' });
    }

    // Success - redirect to confirmation page with details
    return buildRedirect(req, '/unsubscribe/success', { type: notificationType, channel });
  } catch (error) {
    console.error('[Unsubscribe] Error processing unsubscribe:', error);
    return buildRedirect(req, '/unsubscribe/error', { reason: 'server_error' });
  }
}
