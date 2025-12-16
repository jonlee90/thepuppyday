/**
 * Admin API - Notification Template Detail Management
 * GET /api/admin/notifications/templates/[id] - Get template by ID
 * PUT /api/admin/notifications/templates/[id] - Update template
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

interface TemplateVariable {
  name: string;
  description?: string;
  required?: boolean;
}

/**
 * GET /api/admin/notifications/templates/[id]
 * Get single notification template with full details
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

    // Fetch template with all fields
    const { data: template, error } = (await (supabase as any)
      .from('notification_templates')
      .select('*')
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

    return NextResponse.json({ template });
  } catch (error) {
    console.error('[Admin API] Error fetching notification template:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch template';

    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/notifications/templates/[id]
 * Update notification template
 * Validates that all required variables are present in templates
 */
export async function PUT(
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

    const body = await request.json();
    const {
      subject_template,
      html_template,
      text_template,
      variables,
      is_active,
      change_reason,
    } = body;

    // Fetch current template to get version
    const { data: currentTemplate, error: fetchError } = (await (supabase as any)
      .from('notification_templates')
      .select('*')
      .eq('id', id)
      .single()) as {
      data: NotificationTemplate | null;
      error: Error | null;
    };

    if (fetchError || !currentTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Partial<NotificationTemplate> & {
      updated_by: string;
      version: number;
    } = {
      updated_by: user.id,
      version: currentTemplate.version + 1,
    };

    // Update templates if provided
    if (subject_template !== undefined) {
      updateData.subject_template = subject_template;
    }
    if (html_template !== undefined) {
      updateData.html_template = html_template;
    }
    if (text_template !== undefined) {
      updateData.text_template = text_template;
    }

    // Validate variables if provided
    if (variables !== undefined) {
      if (!Array.isArray(variables)) {
        return NextResponse.json(
          { error: 'Variables must be an array' },
          { status: 400 }
        );
      }

      // Validate variable structure
      for (const variable of variables) {
        if (
          typeof variable !== 'object' ||
          !variable.name ||
          typeof variable.name !== 'string'
        ) {
          return NextResponse.json(
            { error: 'Each variable must have a name' },
            { status: 400 }
          );
        }
      }

      updateData.variables = variables as any;
    }

    // Validate templates contain all required variables
    const finalSubjectTemplate =
      subject_template !== undefined ? subject_template : currentTemplate.subject_template;
    const finalHtmlTemplate =
      html_template !== undefined ? html_template : currentTemplate.html_template;
    const finalTextTemplate =
      text_template !== undefined ? text_template : currentTemplate.text_template;
    const finalVariables = (variables !== undefined
      ? variables
      : currentTemplate.variables) as TemplateVariable[];

    // Extract variables from templates using Handlebars syntax
    const extractVariables = (template: string | null): string[] => {
      if (!template) return [];
      const regex = /\{\{([^}]+)\}\}/g;
      const matches: string[] = [];
      let match;
      while ((match = regex.exec(template)) !== null) {
        const variablePath = match[1].trim();
        // Skip business context variables
        if (!variablePath.startsWith('business.')) {
          // Get base variable name (before any dot notation)
          const baseName = variablePath.split('.')[0];
          if (!matches.includes(baseName)) {
            matches.push(baseName);
          }
        }
      }
      return matches;
    };

    // Get all variables used in templates
    const usedVariables = new Set<string>([
      ...extractVariables(finalSubjectTemplate),
      ...extractVariables(finalHtmlTemplate),
      ...extractVariables(finalTextTemplate),
    ]);

    // Check that all required variables in the variables array are used
    const requiredVariables = finalVariables.filter((v) => v.required !== false);
    const missingVariables = requiredVariables.filter(
      (v) => !usedVariables.has(v.name)
    );

    if (missingVariables.length > 0) {
      return NextResponse.json(
        {
          error: `Required variables are not used in templates: ${missingVariables.map((v) => v.name).join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    // Save current version to history before updating
    const { error: historyError } = await (supabase as any)
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
        change_reason: change_reason || 'Template updated',
      });

    if (historyError) {
      console.error('[Admin API] Error saving template history:', historyError);
      throw new Error('Failed to save template history');
    }

    // Update template
    const { data: template, error: updateError } = (await (supabase as any)
      .from('notification_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()) as {
      data: NotificationTemplate | null;
      error: Error | null;
    };

    if (updateError || !template) {
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('[Admin API] Error updating notification template:', error);
    const message = error instanceof Error ? error.message : 'Failed to update template';

    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
