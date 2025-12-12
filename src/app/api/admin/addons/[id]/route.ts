/**
 * Admin API - Add-on Detail Management
 * GET /api/admin/addons/[id] - Get add-on by ID
 * PATCH /api/admin/addons/[id] - Update add-on
 * DELETE /api/admin/addons/[id] - Delete add-on
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { Addon } from '@/types/database';
import {
  isValidUUID,
  validateServiceName,
  validateDescription,
  validatePrice,
  sanitizeText,
} from '@/lib/utils/validation';

/**
 * GET /api/admin/addons/[id]
 * Get single add-on
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    const { id } = await params;

    // Security: Validate UUID format to prevent injection
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid add-on ID format' }, { status: 400 });
    }

    // Fetch add-on
    const { data: addon, error } = (await (supabase as any)
      .from('addons')
      .select('*')
      .eq('id', id)
      .single()) as {
      data: Addon | null;
      error: Error | null;
    };

    if (error || !addon) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 });
    }

    return NextResponse.json({ addon });
  } catch (error) {
    console.error('[Admin API] Error fetching add-on:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch add-on';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/addons/[id]
 * Update add-on
 * Can also update just is_active or display_order for quick toggle/reorder
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    const { id } = await params;

    // Security: Validate UUID format to prevent injection
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid add-on ID format' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      upsell_breeds,
      upsell_prompt,
      is_active,
      display_order,
    } = body;

    // Build update object
    const addonUpdate: Partial<Addon> = {};

    if (name !== undefined) {
      // Security: Validate and sanitize add-on name
      const nameValidation = validateServiceName(name);
      if (!nameValidation.valid) {
        return NextResponse.json(
          { error: nameValidation.error },
          { status: 400 }
        );
      }
      addonUpdate.name = nameValidation.sanitized;
    }

    if (description !== undefined) {
      // Security: Validate and sanitize description
      const descValidation = validateDescription(description);
      if (!descValidation.valid) {
        return NextResponse.json(
          { error: descValidation.error },
          { status: 400 }
        );
      }
      addonUpdate.description = descValidation.sanitized;
    }

    if (price !== undefined) {
      // Security: Validate price
      const priceValidation = validatePrice(price);
      if (!priceValidation.valid) {
        return NextResponse.json(
          { error: priceValidation.error },
          { status: 400 }
        );
      }
      addonUpdate.price = price;
    }

    if (upsell_breeds !== undefined) {
      // Security: Sanitize breed names in array
      if (Array.isArray(upsell_breeds)) {
        addonUpdate.upsell_breeds = upsell_breeds.map((breed) =>
          typeof breed === 'string' ? sanitizeText(breed) : ''
        ).filter(Boolean);
      } else {
        addonUpdate.upsell_breeds = [];
      }
    }

    if (upsell_prompt !== undefined) {
      // Security: Sanitize upsell prompt
      if (upsell_prompt) {
        addonUpdate.upsell_prompt = sanitizeText(upsell_prompt);
      } else {
        addonUpdate.upsell_prompt = upsell_prompt;
      }
    }

    if (is_active !== undefined) {
      addonUpdate.is_active = is_active;
    }

    if (display_order !== undefined) {
      addonUpdate.display_order = display_order;
    }

    // Update add-on
    const { data: addon, error } = (await (supabase as any)
      .from('addons')
      .update(addonUpdate)
      .eq('id', id)
      .select()
      .single()) as {
      data: Addon | null;
      error: Error | null;
    };

    if (error || !addon) {
      return NextResponse.json(
        { error: 'Add-on not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ addon });
  } catch (error) {
    console.error('[Admin API] Error updating add-on:', error);
    const message = error instanceof Error ? error.message : 'Failed to update add-on';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/addons/[id]
 * Delete add-on
 * Security: Check for existing appointments before deletion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);
    const { id } = await params;

    // Security: Validate UUID format to prevent injection
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid add-on ID format' }, { status: 400 });
    }

    // Security: Check for existing appointment add-ons before deletion
    const { data: appointmentAddons, error: apptAddonsError } = (await (supabase as any)
      .from('appointment_addons')
      .select('id')
      .eq('addon_id', id)
      .limit(1)) as {
      data: { id: string }[] | null;
      error: Error | null;
    };

    if (apptAddonsError) {
      throw apptAddonsError;
    }

    if (appointmentAddons && appointmentAddons.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete add-on with existing appointment usage. Please deactivate it instead.',
          code: 'ADDON_IN_USE',
        },
        { status: 409 } // Conflict
      );
    }

    // Delete add-on
    const { error } = await (supabase as any)
      .from('addons')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin API] Error deleting add-on:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete add-on';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
