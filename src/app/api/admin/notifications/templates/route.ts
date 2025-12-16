/**
 * Admin API - Notification Templates Management
 * GET /api/admin/notifications/templates - List all templates with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

interface NotificationTemplate {
  id: string;
  name: string;
  description: string | null;
  type: string;
  trigger_event: string | null;
  channel: 'email' | 'sms';
  is_active: boolean;
  version: number;
  variables: Array<{ name: string; description?: string; required?: boolean }>;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/admin/notifications/templates
 * List all notification templates with optional filtering
 * Query params:
 * - type: Filter by notification type
 * - trigger_event: Filter by trigger event
 * - active_only: Show only active templates (boolean)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const triggerEvent = searchParams.get('trigger_event');
    const activeOnly = searchParams.get('active_only') === 'true';

    // Build query
    let query = (supabase as any)
      .from('notification_templates')
      .select(
        'id, name, description, type, trigger_event, channel, is_active, version, variables, created_at, updated_at'
      );

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }

    if (triggerEvent) {
      query = query.eq('trigger_event', triggerEvent);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // Order by name ascending
    query = query.order('name', { ascending: true });

    const { data: templates, error } = (await query) as {
      data: NotificationTemplate[] | null;
      error: Error | null;
    };

    if (error) {
      throw error;
    }

    // Extract just variable names (not full descriptions) for list view
    const simplifiedTemplates = (templates || []).map((template) => ({
      ...template,
      variables: Array.isArray(template.variables)
        ? template.variables.map((v) => (typeof v === 'object' && v !== null ? v.name : v))
        : [],
    }));

    return NextResponse.json({ templates: simplifiedTemplates });
  } catch (error) {
    console.error('[Admin API] Error fetching notification templates:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch templates';

    // Check for unauthorized error
    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
