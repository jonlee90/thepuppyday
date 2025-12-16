/**
 * Admin API - Notification Template Preview
 * POST /api/admin/notifications/templates/[id]/preview - Preview rendered template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { isValidUUID } from '@/lib/utils/validation';
import { createTemplateEngine } from '@/lib/notifications/template-engine';

interface NotificationTemplate {
  id: string;
  name: string;
  channel: 'email' | 'sms';
  subject_template: string | null;
  html_template: string | null;
  text_template: string;
  variables: Array<{ name: string; description?: string; required?: boolean }>;
}

/**
 * POST /api/admin/notifications/templates/[id]/preview
 * Preview a notification template with sample data
 * Body: { sample_data: Record<string, unknown> }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
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
    const { sample_data } = body;

    if (!sample_data || typeof sample_data !== 'object') {
      return NextResponse.json(
        { error: 'sample_data is required and must be an object' },
        { status: 400 }
      );
    }

    // Fetch template
    const { data: template, error } = (await (supabase as any)
      .from('notification_templates')
      .select('id, name, channel, subject_template, html_template, text_template, variables')
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

    // Create template engine
    const engine = createTemplateEngine();

    // Render templates with sample data
    const rendered_subject = template.subject_template
      ? engine.render(template.subject_template, sample_data)
      : undefined;

    const rendered_html = template.html_template
      ? engine.render(template.html_template, sample_data)
      : undefined;

    const rendered_text = engine.render(template.text_template, sample_data);

    // Calculate SMS metrics if applicable
    let character_count: number | undefined;
    let segment_count: number | undefined;

    if (template.channel === 'sms') {
      character_count = rendered_text.length;
      segment_count = engine.calculateSegmentCount(rendered_text);
    }

    // Return preview
    const preview = {
      template_id: template.id,
      template_name: template.name,
      channel: template.channel,
      rendered_subject,
      rendered_html,
      rendered_text,
      character_count,
      segment_count,
      warnings:
        template.channel === 'sms' && character_count && character_count > 160
          ? [`Message is ${character_count} characters (will use ${segment_count} segments)`]
          : undefined,
    };

    return NextResponse.json({ preview });
  } catch (error) {
    console.error('[Admin API] Error previewing template:', error);
    const message = error instanceof Error ? error.message : 'Failed to preview template';

    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
