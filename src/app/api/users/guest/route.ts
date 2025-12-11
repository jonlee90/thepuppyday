/**
 * POST /api/users/guest - Create guest user account during booking flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { guestInfoSchema } from '@/lib/booking/validation';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = guestInfoSchema.parse(body);

    const supabase = await createServerSupabaseClient();

    // Check if email already exists (case-insensitive)
    const { data: existingUsers } = await supabase
      .from('users')
      .select('*')
      .ilike('email', validated.email);

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        {
          error: 'An account with this email already exists. Please log in.',
          code: 'EMAIL_EXISTS',
        },
        { status: 409 }
      );
    }

    // Create guest user
    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert({
        email: validated.email.toLowerCase(),
        first_name: validated.firstName,
        last_name: validated.lastName,
        phone: validated.phone || null,
        role: 'customer',
        avatar_url: null,
        preferences: {},
      })
      .select()
      .single();

    if (insertError || !user) {
      console.error('Error creating guest user:', insertError);
      return NextResponse.json(
        { error: 'Failed to create guest account' },
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
