/**
 * Admin API - Banner Management (List & Create)
 * Task 0169: Banner API routes (GET, POST)
 *
 * GET /api/admin/settings/banners - Fetch all banners with status filtering
 * POST /api/admin/settings/banners - Create new banner
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { logSettingsChange } from '@/lib/admin/audit-log';
import {
  CreateBannerSchema,
  computeBannerStatus,
  filterBannersByStatus,
  type BannerWithStatus,
  type BannerStatusFilter,
} from '@/types/banner';
import type { PromoBanner } from '@/types/database';

/**
 * GET /api/admin/settings/banners
 * Fetch all banners with computed status field and optional filtering
 *
 * Query params:
 * - status: 'all' | 'active' | 'scheduled' | 'expired' | 'draft'
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Get status filter from query params
    const { searchParams } = new URL(request.url);
    const statusFilter = (searchParams.get('status') || 'all') as BannerStatusFilter;

    // Validate status filter
    const validStatuses: BannerStatusFilter[] = ['all', 'active', 'scheduled', 'expired', 'draft'];
    if (!validStatuses.includes(statusFilter)) {
      return NextResponse.json(
        { error: `Invalid status filter. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch all banners from database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: banners, error } = (await (supabase as any)
      .from('promo_banners')
      .select('*')
      .order('display_order', { ascending: true })) as {
      data: PromoBanner[] | null;
      error: Error | null;
    };

    if (error) {
      throw error;
    }

    // Compute status for each banner
    const bannersWithStatus: BannerWithStatus[] = (banners || []).map((banner) => ({
      ...banner,
      status: computeBannerStatus(banner.is_active, banner.start_date, banner.end_date),
    }));

    // Apply status filtering
    const filteredBanners = filterBannersByStatus(bannersWithStatus, statusFilter);

    return NextResponse.json({
      banners: filteredBanners,
      total: filteredBanners.length,
      filter: statusFilter,
    });
  } catch (error) {
    console.error('[Admin API] Error fetching banners:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch banners';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings/banners
 * Create a new banner with auto-assigned display_order
 *
 * Request body:
 * {
 *   image_url: string;
 *   alt_text: string;
 *   click_url?: string | null;
 *   start_date?: string | null;
 *   end_date?: string | null;
 *   is_active?: boolean;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireAdmin(supabase);

    // Parse and validate request body
    const body = await request.json();
    const validation = CreateBannerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid banner data',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const bannerData = validation.data;

    // Validate date logic: end_date must be after start_date
    if (bannerData.start_date && bannerData.end_date) {
      const start = new Date(bannerData.start_date);
      const end = new Date(bannerData.end_date);
      if (end <= start) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Get the maximum display_order to auto-assign next value
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: maxOrderData } = (await (supabase as any)
      .from('promo_banners')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle()) as {
      data: { display_order: number } | null;
    };

    const nextDisplayOrder = maxOrderData ? maxOrderData.display_order + 1 : 0;

    // Create the banner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newBanner, error: insertError } = (await (supabase as any)
      .from('promo_banners')
      .insert({
        image_url: bannerData.image_url,
        alt_text: bannerData.alt_text,
        click_url: bannerData.click_url || null,
        start_date: bannerData.start_date || null,
        end_date: bannerData.end_date || null,
        is_active: bannerData.is_active || false,
        display_order: nextDisplayOrder,
        click_count: 0,
        impression_count: 0,
      })
      .select()
      .single()) as {
      data: PromoBanner | null;
      error: Error | null;
    };

    if (insertError || !newBanner) {
      throw insertError || new Error('Failed to create banner');
    }

    // Log the creation (fire-and-forget)
    await logSettingsChange(
      supabase,
      user.id,
      'banner',
      `banner.${newBanner.id}`,
      null,
      {
        image_url: newBanner.image_url,
        alt_text: newBanner.alt_text,
        click_url: newBanner.click_url,
        start_date: newBanner.start_date,
        end_date: newBanner.end_date,
        is_active: newBanner.is_active,
        display_order: newBanner.display_order,
      }
    );

    // Compute status for response
    const bannerWithStatus: BannerWithStatus = {
      ...newBanner,
      status: computeBannerStatus(newBanner.is_active, newBanner.start_date, newBanner.end_date),
    };

    return NextResponse.json(
      {
        banner: bannerWithStatus,
        message: 'Banner created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Admin API] Error creating banner:', error);
    const message = error instanceof Error ? error.message : 'Failed to create banner';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
