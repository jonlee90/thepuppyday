/**
 * Admin API - Test Notification Sending
 * POST /api/admin/notifications/templates/[id]/test - Send test notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { isValidUUID } from '@/lib/utils/validation';
import { createTemplateEngine } from '@/lib/notifications/template-engine';
import { getEmailProvider, getSMSProvider } from '@/lib/notifications/providers';
import { createNotificationLogger } from '@/lib/notifications/logger';

interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  channel: 'email' | 'sms';
  subject_template: string | null;
  html_template: string | null;
  text_template: string;
}

/**
 * POST /api/admin/notifications/templates/[id]/test
 * Send a test notification with sample data
 * Body: {
 *   recipient_email?: string,
 *   recipient_phone?: string,
 *   sample_data: Record<string, unknown>,
 *   channel?: 'email' | 'sms' (optional, defaults to template's channel)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireAdmin(supabase);
    const { id } = await params;

    // Security: Validate UUID format to prevent injection
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID format' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { recipient_email, recipient_phone, sample_data, channel } = body;

    if (!sample_data || typeof sample_data !== 'object') {
      return NextResponse.json(
        { error: 'sample_data is required and must be an object' },
        { status: 400 }
      );
    }

    // Fetch template
    const { data: template, error } = (await (supabase as any)
      .from('notification_templates')
      .select('id, name, type, channel, subject_template, html_template, text_template')
      .eq('id', id)
      .single()) as {
      data: NotificationTemplate | null;
      error: Error | null;
    };

    if (error || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Determine channel (use provided or default to template's channel)
    const sendChannel: 'email' | 'sms' = channel || template.channel;

    // Validate recipient based on channel
    let recipient: string;
    if (sendChannel === 'email') {
      if (!recipient_email) {
        return NextResponse.json(
          { error: 'recipient_email is required for email channel' },
          { status: 400 }
        );
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipient_email)) {
        return NextResponse.json(
          { error: 'Invalid email address format' },
          { status: 400 }
        );
      }
      recipient = recipient_email;
    } else {
      if (!recipient_phone) {
        return NextResponse.json(
          { error: 'recipient_phone is required for SMS channel' },
          { status: 400 }
        );
      }
      recipient = recipient_phone;
    }

    // Create template engine and render templates
    const engine = createTemplateEngine();

    const rendered_subject = template.subject_template
      ? `[TEST] ${engine.render(template.subject_template, sample_data)}`
      : undefined;

    const rendered_html = template.html_template
      ? engine.render(template.html_template, sample_data)
      : undefined;

    const rendered_text = engine.render(template.text_template, sample_data);

    // Create logger
    const logger = createNotificationLogger(supabase);

    // Create log entry for test notification
    const logId = await logger.create({
      customerId: user.id, // Log under admin user
      type: template.type,
      channel: sendChannel,
      recipient,
      subject: rendered_subject,
      content: rendered_text,
      status: 'pending',
      templateId: template.id,
      templateData: sample_data,
      retryCount: 0,
      isTest: true, // Mark as test
    });

    // Send the notification
    let sendResult: { success: boolean; messageId?: string; error?: string };

    try {
      if (sendChannel === 'email') {
        if (!rendered_subject || !rendered_html) {
          throw new Error('Email requires subject and HTML content');
        }

        const emailProvider = getEmailProvider();
        sendResult = await emailProvider.send({
          to: recipient,
          subject: rendered_subject,
          html: rendered_html,
          text: rendered_text,
        });
      } else {
        const smsProvider = getSMSProvider();
        sendResult = await smsProvider.send({
          to: recipient,
          body: rendered_text,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendResult = { success: false, error: errorMessage };
    }

    // Update log entry with result
    if (sendResult.success) {
      await logger.update(logId, {
        status: 'sent',
        sentAt: new Date(),
        messageId: sendResult.messageId,
      });

      return NextResponse.json({
        success: true,
        message: `Test notification sent successfully to ${recipient}`,
        log_id: logId,
        message_id: sendResult.messageId,
      });
    } else {
      await logger.update(logId, {
        status: 'failed',
        errorMessage: sendResult.error || 'Unknown error',
      });

      return NextResponse.json(
        {
          success: false,
          error: sendResult.error || 'Failed to send test notification',
          log_id: logId,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Admin API] Error sending test notification:', error);
    const message = error instanceof Error ? error.message : 'Failed to send test notification';

    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
