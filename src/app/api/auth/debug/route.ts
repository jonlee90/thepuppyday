/**
 * Debug endpoint to check auth state
 * Access at: http://localhost:3001/api/auth/debug
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // Get user
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
        hasSession: !!session,
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
        session: sessionError?.message || null,
        user: userError?.message || null,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
