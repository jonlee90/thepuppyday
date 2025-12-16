/**
 * Admin API - Notification Template Version History
 * GET /api/admin/notifications/templates/[id]/history - Get template version history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { isValidUUID } from '@/lib/utils/validation';

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
  // Joined user data
  user?: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

/**
 * GET /api/admin/notifications/templates/[id]/history
 * Get version history for a notification template
 */
export async function GET(
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

    // Verify template exists
    const { data: template, error: templateError } = (await (supabase as any)
      .from('notification_templates')
      .select('id')
      .eq('id', id)
      .single()) as {
      data: { id: string } | null;
      error: Error | null;
    };

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Fetch version history with user information
    const { data: history, error } = (await (supabase as any)
      .from('notification_template_history')
      .select(
        `
        id,
        template_id,
        version,
        name,
        description,
        type,
        trigger_event,
        channel,
        subject_template,
        html_template,
        text_template,
        variables,
        changed_by,
        change_reason,
        created_at,
        user:users!changed_by (
          email,
          first_name,
          last_name
        )
      `
      )
      .eq('template_id', id)
      .order('version', { ascending: false })) as {
      data: TemplateHistoryEntry[] | null;
      error: Error | null;
    };

    if (error) {
      throw error;
    }

    // Format the response to include user info inline
    const formattedHistory = (history || []).map((entry) => ({
      id: entry.id,
      template_id: entry.template_id,
      version: entry.version,
      name: entry.name,
      description: entry.description,
      type: entry.type,
      trigger_event: entry.trigger_event,
      channel: entry.channel,
      subject_template: entry.subject_template,
      html_template: entry.html_template,
      text_template: entry.text_template,
      variables: entry.variables,
      changed_by: entry.changed_by,
      changed_by_email: entry.user?.email || 'Unknown',
      changed_by_name: entry.user
        ? `${entry.user.first_name} ${entry.user.last_name}`.trim() || entry.user.email
        : 'Unknown',
      change_reason: entry.change_reason,
      created_at: entry.created_at,
    }));

    return NextResponse.json({ history: formattedHistory });
  } catch (error) {
    console.error('[Admin API] Error fetching template history:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch template history';

    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
