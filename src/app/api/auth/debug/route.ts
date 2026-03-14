/**
 * Debug endpoint to check auth state
 * Access at: http://localhost:3001/api/auth/debug
 */

export const dynamic = 'force-dynamic';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user (verified by Supabase Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Get user data from public.users if authenticated
    let userData = null;
    if (user) {
      const { data, error } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      userData = data;
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      auth: {
        hasUser: !!user,
        userId: user?.id || null,
        userEmail: user?.email || null,
      },
      database: {
        userFound: !!userData,
        role: userData?.role || null,
        firstName: userData?.first_name || null,
        lastName: userData?.last_name || null,
      },
      errors: {
        user: userError?.message || null,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
