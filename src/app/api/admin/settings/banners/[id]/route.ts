/**
 * Admin API - Individual Banner Management
 * Task 0170: Banner individual API routes
 *
 * GET /api/admin/settings/banners/[id] - Get single banner with analytics
 * PUT /api/admin/settings/banners/[id] - Update banner (partial)
 * DELETE /api/admin/settings/banners/[id] - Delete banner (soft-delete if has analytics)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';
import {
  UpdateBannerSchema,
  computeBannerStatus,
  calculateClickThroughRate,
  type BannerWithAnalytics,
} from '@/types/banner';
import type { PromoBanner } from '@/types/database';

/**
 * GET /api/admin/settings/banners/[id]
 * Fetch single banner with click analytics
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    const bannerId = params.id;

    // Fetch banner from database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: banner, error } = (await (supabase as any)
      .from('promo_banners')
      .select('*')
      .eq('id', bannerId)
      .single()) as {
      data: PromoBanner | null;
      error: Error | null;
    };

    if (error) {
      if (error.message.includes('No rows found')) {
        return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
      }
      throw error;
    }

    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    // Compute status and analytics
    const bannerWithAnalytics: BannerWithAnalytics = {
      ...banner,
      status: computeBannerStatus(banner.is_active, banner.start_date, banner.end_date),
      click_through_rate: calculateClickThroughRate(
        banner.impression_count || 0,
        banner.click_count
      ),
    };

    return NextResponse.json({ banner: bannerWithAnalytics });
  } catch (error) {
    console.error('[Admin API] Error fetching banner:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch banner';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/settings/banners/[id]
 * Update banner with partial updates and validation
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireAdmin(supabase);

    const bannerId = params.id;

    // Fetch existing banner for audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingBanner, error: fetchError } = (await (supabase as any)
      .from('promo_banners')
      .select('*')
      .eq('id', bannerId)
      .single()) as {
      data: PromoBanner | null;
      error: Error | null;
    };

    if (fetchError || !existingBanner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = UpdateBannerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid banner data',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Validate date logic if both dates are being updated or exist
    const newStartDate = updateData.start_date !== undefined
      ? updateData.start_date
      : existingBanner.start_date;
    const newEndDate = updateData.end_date !== undefined
      ? updateData.end_date
      : existingBanner.end_date;

    if (newStartDate && newEndDate) {
      const start = new Date(newStartDate);
      const end = new Date(newEndDate);
      if (end <= start) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Prepare update object (only include provided fields)
    const updateObject: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.image_url !== undefined) {
      updateObject.image_url = updateData.image_url;
    }
    if (updateData.alt_text !== undefined) {
      updateObject.alt_text = updateData.alt_text;
    }
    if (updateData.click_url !== undefined) {
      updateObject.click_url = updateData.click_url;
    }
    if (updateData.start_date !== undefined) {
      updateObject.start_date = updateData.start_date;
    }
    if (updateData.end_date !== undefined) {
      updateObject.end_date = updateData.end_date;
    }
    if (updateData.is_active !== undefined) {
      updateObject.is_active = updateData.is_active;
    }

    // Update banner in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedBanner, error: updateError } = (await (supabase as any)
      .from('promo_banners')
      .update(updateObject)
      .eq('id', bannerId)
      .select()
      .single()) as {
      data: PromoBanner | null;
      error: Error | null;
    };

    if (updateError || !updatedBanner) {
      throw updateError || new Error('Failed to update banner');
    }

    // Log the update (fire-and-forget)
    await logSettingsChange(
      supabase,
      user.id,
      'banner',
      `banner.${bannerId}`,
      {
        image_url: existingBanner.image_url,
        alt_text: existingBanner.alt_text,
        click_url: existingBanner.click_url,
        start_date: existingBanner.start_date,
        end_date: existingBanner.end_date,
        is_active: existingBanner.is_active,
      },
      {
        image_url: updatedBanner.image_url,
        alt_text: updatedBanner.alt_text,
        click_url: updatedBanner.click_url,
        start_date: updatedBanner.start_date,
        end_date: updatedBanner.end_date,
        is_active: updatedBanner.is_active,
      }
    );

    // Compute status for response
    const bannerWithAnalytics: BannerWithAnalytics = {
      ...updatedBanner,
      status: computeBannerStatus(
        updatedBanner.is_active,
        updatedBanner.start_date,
        updatedBanner.end_date
      ),
      click_through_rate: calculateClickThroughRate(
        updatedBanner.impression_count || 0,
        updatedBanner.click_count
      ),
    };

    return NextResponse.json({
      banner: bannerWithAnalytics,
      message: 'Banner updated successfully',
    });
  } catch (error) {
    console.error('[Admin API] Error updating banner:', error);
    const message = error instanceof Error ? error.message : 'Failed to update banner';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/settings/banners/[id]
 * Alias for PUT - Update banner (partial)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context);
}

/**
 * DELETE /api/admin/settings/banners/[id]
 * Delete banner with soft-delete logic if analytics data exists
 *
 * Soft-delete (set is_active=false) if:
 * - click_count > 0 OR impression_count > 0
 *
 * Hard-delete otherwise (permanently remove record)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireAdmin(supabase);

    const bannerId = params.id;

    // Fetch existing banner to check analytics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingBanner, error: fetchError } = (await (supabase as any)
      .from('promo_banners')
      .select('*')
      .eq('id', bannerId)
      .single()) as {
      data: PromoBanner | null;
      error: Error | null;
    };

    if (fetchError || !existingBanner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    // Check if banner has analytics data
    const hasAnalytics =
      existingBanner.click_count > 0 || (existingBanner.impression_count || 0) > 0;

    let deletionType: 'soft' | 'hard';

    if (hasAnalytics) {
      // Soft-delete: Set is_active to false to preserve analytics
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('promo_banners')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bannerId);

      if (updateError) {
        throw updateError;
      }

      deletionType = 'soft';
    } else {
      // Hard-delete: Permanently remove record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase as any)
        .from('promo_banners')
        .delete()
        .eq('id', bannerId);

      if (deleteError) {
        throw deleteError;
      }

      deletionType = 'hard';
    }

    // Log the deletion (fire-and-forget)
    await logSettingsChange(
      supabase,
      user.id,
      'banner',
      `banner.${bannerId}`,
      {
        image_url: existingBanner.image_url,
        alt_text: existingBanner.alt_text,
        click_url: existingBanner.click_url,
        start_date: existingBanner.start_date,
        end_date: existingBanner.end_date,
        is_active: existingBanner.is_active,
        display_order: existingBanner.display_order,
        click_count: existingBanner.click_count,
        impression_count: existingBanner.impression_count || 0,
      },
      null
    );

    return NextResponse.json({
      message: `Banner ${deletionType === 'soft' ? 'deactivated' : 'deleted'} successfully`,
      deletion_type: deletionType,
      reason: hasAnalytics
        ? 'Banner has analytics data (preserved for reporting)'
        : 'No analytics data',
    });
  } catch (error) {
    console.error('[Admin API] Error deleting banner:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete banner';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
