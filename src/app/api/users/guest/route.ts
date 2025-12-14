/**
 * POST /api/users/guest - Create guest user account during booking flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { guestInfoSchema } from '@/lib/booking/validation';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[Guest User API] Request body:', body);

    const validated = guestInfoSchema.parse(body);
    console.log('[Guest User API] Validated data:', validated);

    // Use service role client to bypass RLS for guest user creation
    const supabase = createServiceRoleClient();
    console.log('[Guest User API] Service role client created');

    // Check if email already exists (case-insensitive)
    console.log('[Guest User API] Checking for existing email:', validated.email);
    const { data: existingUsers } = await (supabase as any)
      .from('users')
      .select('*')
      .ilike('email', validated.email);

    console.log('[Guest User API] Existing users check:', existingUsers?.length || 0);

    if (existingUsers && existingUsers.length > 0) {
      console.log('[Guest User API] Email already exists, returning existing user');
      const existingUser = existingUsers[0];
      return NextResponse.json({
        user: {
          id: existingUser.id,
          email: existingUser.email,
          first_name: existingUser.first_name,
          last_name: existingUser.last_name,
          role: existingUser.role,
        },
        isExisting: true,
      });
    }

    // Create guest user
    console.log('[Guest User API] Creating new user...');
    const insertData = {
      email: validated.email.toLowerCase(),
      first_name: validated.firstName,
      last_name: validated.lastName,
      phone: validated.phone || null,
      role: 'customer',
      avatar_url: null,
      preferences: {},
    };
    console.log('[Guest User API] Insert data:', insertData);

    const { data: user, error: insertError } = await (supabase as any)
      .from('users')
      .insert(insertData)
      .select()
      .single();

    console.log('[Guest User API] Insert result:', { user: !!user, error: !!insertError });

    if (insertError || !user) {
      console.error('Error creating guest user:', insertError);
      console.error('Insert error details:', {
        message: insertError?.message,
        details: insertError?.details,
        hint: insertError?.hint,
        code: insertError?.code,
      });
      return NextResponse.json(
        { error: insertError?.message || 'Failed to create guest account' },
        { status: 500 }
      );
    }

    // TODO: Send welcome email with account claim instructions

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating guest user:', error);
    return NextResponse.json(
      { error: 'Failed to create guest account' },
      { status: 500 }
    );
  }
}
