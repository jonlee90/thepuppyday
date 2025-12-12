/**
 * Admin API - Add-ons Management
 * GET /api/admin/addons - List all add-ons
 * POST /api/admin/addons - Create new add-on
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { Addon } from '@/types/database';
import {
  validateServiceName,
  validateDescription,
  validatePrice,
  sanitizeText,
} from '@/lib/utils/validation';

/**
 * GET /api/admin/addons
 * List all add-ons ordered by display_order
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Fetch all add-ons ordered by display_order
    const { data: addons, error } = (await (supabase as any)
      .from('addons')
      .select('*')
      .order('display_order', { ascending: true })) as {
      data: Addon[] | null;
      error: Error | null;
    };

    if (error) {
      throw error;
    }

    return NextResponse.json({ addons: addons || [] });
  } catch (error) {
    console.error('[Admin API] Error fetching add-ons:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch add-ons';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/addons
 * Create new add-on
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const body = await request.json();
    const {
      name,
      description,
      price,
      upsell_breeds = [],
      upsell_prompt,
      is_active = true,
    } = body;

    // Security: Validate and sanitize add-on name
    const nameValidation = validateServiceName(name);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      );
    }

    // Security: Validate and sanitize description
    const descValidation = validateDescription(description);
    if (!descValidation.valid) {
      return NextResponse.json(
        { error: descValidation.error },
        { status: 400 }
      );
    }

    // Security: Validate price
    const priceValidation = validatePrice(price);
    if (!priceValidation.valid) {
      return NextResponse.json(
        { error: priceValidation.error },
        { status: 400 }
      );
    }

    // Security: Sanitize breed names in array
    const sanitizedBreeds = Array.isArray(upsell_breeds)
      ? upsell_breeds.map((breed) =>
          typeof breed === 'string' ? sanitizeText(breed) : ''
        ).filter(Boolean)
      : [];

    // Security: Sanitize upsell prompt
    const sanitizedPrompt = upsell_prompt ? sanitizeText(upsell_prompt) : null;

    // Get the next display_order
    const { data: existingAddons } = (await (supabase as any)
      .from('addons')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)) as {
      data: { display_order: number }[] | null;
    };

    const display_order = existingAddons?.[0]?.display_order
      ? existingAddons[0].display_order + 1
      : 1;

    // Create add-on with sanitized values
    const { data: addon, error: addonError } = (await (supabase as any)
      .from('addons')
      .insert({
        name: nameValidation.sanitized,
        description: descValidation.sanitized || null,
        price,
        upsell_breeds: sanitizedBreeds,
        upsell_prompt: sanitizedPrompt,
        is_active,
        display_order,
      })
      .select()
      .single()) as {
      data: Addon | null;
      error: Error | null;
    };

    if (addonError || !addon) {
      throw addonError || new Error('Failed to create add-on');
    }

    return NextResponse.json({ addon }, { status: 201 });
  } catch (error) {
    console.error('[Admin API] Error creating add-on:', error);
    const message = error instanceof Error ? error.message : 'Failed to create add-on';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
