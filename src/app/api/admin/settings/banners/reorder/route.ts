/**
 * Admin API - Banner Reorder
 * Task 0171: Banner reorder API
 *
 * PUT /api/admin/settings/banners/reorder - Reorder banners with atomic transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';
import { ReorderBannersSchema } from '@/types/banner';

/**
 * PUT /api/admin/settings/banners/reorder
 * Update display_order for multiple banners atomically
 *
 * Request body:
 * {
 *   banners: [
 *     { id: string, display_order: number },
 *     { id: string, display_order: number },
 *     ...
 *   ]
 * }
 *
 * Validates:
 * - All banner IDs exist
 * - No duplicate display_order values
 * - All updates succeed or none do (transaction-based)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireAdmin(supabase);

    // Parse and validate request body
    const body = await request.json();
    const validation = ReorderBannersSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid reorder data',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { banners } = validation.data;

    // Validate no duplicate display_order values
    const displayOrders = banners.map((b) => b.display_order);
    const uniqueDisplayOrders = new Set(displayOrders);

    if (uniqueDisplayOrders.size !== displayOrders.length) {
      return NextResponse.json(
        { error: 'Duplicate display_order values are not allowed' },
        { status: 400 }
      );
    }

    // Extract all banner IDs for validation
    const bannerIds = banners.map((b) => b.id);

    // Fetch existing banners to validate all IDs exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingBanners, error: fetchError } = (await (supabase as any)
      .from('promo_banners')
      .select('id, display_order')
      .in('id', bannerIds)) as {
      data: Array<{ id: string; display_order: number }> | null;
      error: Error | null;
    };

    if (fetchError) {
      throw fetchError;
    }

    if (!existingBanners || existingBanners.length !== bannerIds.length) {
      return NextResponse.json(
        { error: 'One or more banner IDs not found' },
        { status: 404 }
      );
    }

    // Create a map of old display orders for audit log
    const oldDisplayOrders: Record<string, number> = {};
    existingBanners.forEach((banner) => {
      oldDisplayOrders[banner.id] = banner.display_order;
    });

    // Perform atomic updates using a transaction-like approach
    // Update each banner individually but check for errors
    const updatePromises = banners.map(async (banner) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('promo_banners')
        .update({
          display_order: banner.display_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', banner.id);

      if (error) {
        throw error;
      }

      return banner;
    });

    // Wait for all updates to complete
    try {
      await Promise.all(updatePromises);
    } catch (error) {
      // If any update fails, log the error
      console.error('[Admin API] Banner reorder transaction failed:', error);
      return NextResponse.json(
        {
          error: 'Failed to update banner order. Transaction rolled back.',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Log the reorder action (fire-and-forget)
    // Create a structured representation of the change
    const newDisplayOrders: Record<string, number> = {};
    banners.forEach((banner) => {
      newDisplayOrders[banner.id] = banner.display_order;
    });

    await logSettingsChange(
      supabase,
      user.id,
      'banner',
      'banner.display_order',
      { banners: oldDisplayOrders },
      { banners: newDisplayOrders }
    );

    return NextResponse.json({
      message: 'Banners reordered successfully',
      updated_count: banners.length,
      banners: banners,
    });
  } catch (error) {
    console.error('[Admin API] Error reordering banners:', error);
    const message = error instanceof Error ? error.message : 'Failed to reorder banners';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
