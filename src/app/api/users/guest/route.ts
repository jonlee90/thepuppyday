/**
 * POST /api/users/guest - Create guest user account during booking flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/mocks/supabase/store';
import { guestInfoSchema } from '@/lib/booking/validation';
import type { User } from '@/types/database';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = guestInfoSchema.parse(body);

    const store = getMockStore();

    // Check if email already exists (case-insensitive)
    const existingUsers = (store
      .select('users') as unknown as User[])
      .filter((u) => u.email.toLowerCase() === validated.email.toLowerCase());

    if (existingUsers.length > 0) {
      return NextResponse.json(
        {
          error: 'An account with this email already exists. Please log in.',
          code: 'EMAIL_EXISTS',
        },
        { status: 409 }
      );
    }

    // Create guest user
    const user = store.insert('users', {
      email: validated.email.toLowerCase(),
      first_name: validated.firstName,
      last_name: validated.lastName,
      phone: validated.phone || null,
      role: 'customer',
      avatar_url: null,
      preferences: {},
    }) as unknown as User;

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
