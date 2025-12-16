/**
 * Admin API - Template Version Rollback
 * POST /api/admin/notifications/templates/[id]/rollback - Rollback to previous version
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { isValidUUID } from '@/lib/utils/validation';

interface NotificationTemplate {
  id: string;
  name: string;
  description: string | null;
  type: string;
  trigger_event: string | null;
  channel: 'email' | 'sms';
  subject_template: string | null;
  html_template: string | null;
  text_template: string;
  variables: Array<{ name: string; description?: string; required?: boolean }>;
  is_active: boolean;
  version: number;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface TemplateHistoryEntry {
  id: string;
  template_id: string;
  version: number;
  name: string;
  description: string | null;
  type: string;
  trigger_event: string | null;
  channel: 'email' | 'sms';
  subject_template: string | null;
  html_template: string | null;
  text_template: string;
  variables: Array<{ name: string; description?: string; required?: boolean }>;
  changed_by: string;
  change_reason: string | null;
  created_at: string;
}

/**
 * POST /api/admin/notifications/templates/[id]/rollback
 * Rollback template to a previous version
 * Body: {
 *   version: number,
 *   reason: string
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
    const { version, reason } = body;

    if (typeof version !== 'number' || version < 1) {
      return NextResponse.json(
        { error: 'Valid version number is required' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reason is required for rollback' },
        { status: 400 }
      );
    }

    // Fetch current template
    const { data: currentTemplate, error: currentError } = (await (supabase as any)
      .from('notification_templates')
      .select('*')
      .eq('id', id)
      .single()) as {
      data: NotificationTemplate | null;
      error: Error | null;
    };

    if (currentError || !currentTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if trying to rollback to current version
    if (version === currentTemplate.version) {
      return NextResponse.json(
        { error: 'Cannot rollback to current version' },
        { status: 400 }
      );
    }

    // Fetch historical version
    const { data: historicalVersion, error: historyError } = (await (supabase as any)
      .from('notification_template_history')
      .select('*')
      .eq('template_id', id)
      .eq('version', version)
      .single()) as {
      data: TemplateHistoryEntry | null;
      error: Error | null;
    };

    if (historyError || !historicalVersion) {
      return NextResponse.json(
        { error: `Version ${version} not found in history` },
        { status: 404 }
      );
    }

    // Save current version to history before rollback
    const { error: saveHistoryError } = await (supabase as any)
      .from('notification_template_history')
      .insert({
        template_id: id,
        version: currentTemplate.version,
        name: currentTemplate.name,
        description: currentTemplate.description,
        type: currentTemplate.type,
        trigger_event: currentTemplate.trigger_event,
        channel: currentTemplate.channel,
        subject_template: currentTemplate.subject_template,
        html_template: currentTemplate.html_template,
        text_template: currentTemplate.text_template,
        variables: currentTemplate.variables,
        changed_by: user.id,
        change_reason: `Rolled back to version ${version}: ${reason}`,
      });

    if (saveHistoryError) {
      console.error('[Admin API] Error saving current version to history:', saveHistoryError);
      throw new Error('Failed to save current version to history');
    }

    // Update template with historical data
    const newVersion = currentTemplate.version + 1;
    const updateData = {
      name: historicalVersion.name,
      description: historicalVersion.description,
      type: historicalVersion.type,
      trigger_event: historicalVersion.trigger_event,
      channel: historicalVersion.channel,
      subject_template: historicalVersion.subject_template,
      html_template: historicalVersion.html_template,
      text_template: historicalVersion.text_template,
      variables: historicalVersion.variables,
      version: newVersion,
      updated_by: user.id,
    };

    const { data: updatedTemplate, error: updateError } = (await (supabase as any)
      .from('notification_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()) as {
      data: NotificationTemplate | null;
      error: Error | null;
    };

    if (updateError || !updatedTemplate) {
      console.error('[Admin API] Error updating template:', updateError);
      return NextResponse.json(
        { error: 'Failed to rollback template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Template successfully rolled back to version ${version}`,
      template: updatedTemplate,
      previous_version: currentTemplate.version,
      new_version: newVersion,
    });
  } catch (error) {
    console.error('[Admin API] Error rolling back template:', error);
    const message = error instanceof Error ? error.message : 'Failed to rollback template';

    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
