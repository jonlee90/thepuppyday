/**
 * Customer Account API
 * DELETE /api/customer/account - Delete the authenticated user's account
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function DELETE() {
  try {
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase.auth.admin.deleteUser(user.id);

    if (error) {
      console.error('[Account API] Delete user error:', error);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Account API] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
