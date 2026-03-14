/**
 * Admin API - Email Base Shell
 * GET /api/admin/notifications/templates/email-shell
 * Returns the base email HTML template for client-side preview wrapping.
 */

import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const templatePath = join(
      process.cwd(),
      'src/lib/notifications/templates/email-base.html'
    );
    const html = readFileSync(templatePath, 'utf-8');

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load template';
    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
