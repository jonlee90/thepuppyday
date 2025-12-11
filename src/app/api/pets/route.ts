/**
 * GET /api/pets - Fetch authenticated user's pets
 * POST /api/pets - Create a new pet profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMockStore } from '@/mocks/supabase/store';
import { petFormSchema } from '@/lib/booking/validation';
import { getAuthenticatedUserId, getUserIdFromRequest } from '@/lib/auth/mock-auth';
import type { Pet } from '@/types/database';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user (from mock auth or session)
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const store = getMockStore();
    const pets = (store
      .select('pets', {
        column: 'owner_id',
        value: userId,
      }) as unknown as Pet[])
      .filter((pet) => pet.is_active);

    return NextResponse.json({ pets });
  } catch (error) {
    console.error('Error fetching pets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pets' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const validated = petFormSchema.parse(body);

    // Get authenticated user
    const authenticatedUserId = await getAuthenticatedUserId(req);

    // If user is authenticated, prevent owner_id manipulation
    if (authenticatedUserId && body.owner_id && body.owner_id !== authenticatedUserId) {
      return NextResponse.json(
        { error: 'Cannot create pets for other users' },
        { status: 403 }
      );
    }

    // Get final user ID (authenticated user or provided owner_id for guest)
    const userId = await getUserIdFromRequest(req, body.owner_id);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const store = getMockStore();
    const pet = store.insert('pets', {
      owner_id: userId,
      name: validated.name,
      breed_id: validated.breed_id || null,
      breed_custom: validated.breed_custom || null,
      size: validated.size,
      weight: validated.weight || null,
      birth_date: null,
      notes: validated.notes || null,
      medical_info: null,
      photo_url: null,
      is_active: true,
    }) as unknown as Pet;

    return NextResponse.json({ pet });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating pet:', error);
    return NextResponse.json(
      { error: 'Failed to create pet' },
      { status: 500 }
    );
  }
}
