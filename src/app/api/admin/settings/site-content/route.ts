/**
 * Admin API - Site Content Management
 * GET /api/admin/settings/site-content - Fetch all site content sections
 * PUT /api/admin/settings/site-content - Update a specific site content section
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import {
  HeroContentSchema,
  SeoSettingsSchema,
  BusinessInfoSchema,
  type HeroContent,
  type SeoSettings,
  type BusinessInfo,
} from '@/types/settings';
import { logSettingsChange } from '@/lib/admin/audit-log';
import { z } from 'zod';

/**
 * Site content section type
 */
type SiteContentSection = 'hero' | 'seo' | 'business_info';

/**
 * Schema for validating section parameter
 */
const SectionSchema = z.enum(['hero', 'seo', 'business_info']);

/**
 * GET /api/admin/settings/site-content
 * Fetch all site content sections with last_updated timestamps
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    await requireAdmin(supabase);

    // Fetch all site content sections
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: siteContent, error } = (await (supabase as any)
      .from('site_content')
      .select('*')
      .in('section', ['hero', 'seo', 'business_info'])) as {
      data: Array<{
        id: string;
        section: string;
        content: Record<string, unknown>;
        updated_at: string;
      }> | null;
      error: Error | null;
    };

    if (error) {
      throw error;
    }

    // Transform array to object keyed by section
    const contentBySection = (siteContent || []).reduce((acc, item) => {
      acc[item.section as SiteContentSection] = {
        content: item.content,
        last_updated: item.updated_at,
      };
      return acc;
    }, {} as Record<SiteContentSection, { content: Record<string, unknown>; last_updated: string }>);

    return NextResponse.json({
      hero: contentBySection.hero || { content: null, last_updated: null },
      seo: contentBySection.seo || { content: null, last_updated: null },
      business_info: contentBySection.business_info || { content: null, last_updated: null },
    });
  } catch (error) {
    console.error('[Admin API] Error fetching site content:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to fetch site content';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/settings/site-content
 * Update a specific site content section
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireAdmin(supabase);

    const body = await request.json();
    const { section, data: contentData } = body;

    // Validate section parameter
    const sectionValidation = SectionSchema.safeParse(section);
    if (!sectionValidation.success) {
      return NextResponse.json(
        { error: 'Invalid section. Must be one of: hero, seo, business_info' },
        { status: 400 }
      );
    }

    const validSection = sectionValidation.data;

    // Validate content data based on section
    let validatedContent: HeroContent | SeoSettings | BusinessInfo;
    let validationResult;

    switch (validSection) {
      case 'hero':
        validationResult = HeroContentSchema.safeParse(contentData);
        if (!validationResult.success) {
          return NextResponse.json(
            {
              error: 'Invalid hero content data',
              details: validationResult.error.format(),
            },
            { status: 400 }
          );
        }
        validatedContent = validationResult.data;
        break;

      case 'seo':
        validationResult = SeoSettingsSchema.safeParse(contentData);
        if (!validationResult.success) {
          return NextResponse.json(
            {
              error: 'Invalid SEO settings data',
              details: validationResult.error.format(),
            },
            { status: 400 }
          );
        }
        validatedContent = validationResult.data;
        break;

      case 'business_info':
        validationResult = BusinessInfoSchema.safeParse(contentData);
        if (!validationResult.success) {
          return NextResponse.json(
            {
              error: 'Invalid business info data',
              details: validationResult.error.format(),
            },
            { status: 400 }
          );
        }
        validatedContent = validationResult.data;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid section parameter' },
          { status: 400 }
        );
    }

    // Check if section already exists and get old value for audit log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = (await (supabase as any)
      .from('site_content')
      .select('id, content')
      .eq('section', validSection)
      .maybeSingle()) as {
      data: { id: string; content: Record<string, unknown> } | null;
    };

    // Store old value for audit logging
    const oldValue = existing?.content || null;

    let result;

    if (existing) {
      // Update existing section
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: updateError } = (await (supabase as any)
        .from('site_content')
        .update({
          content: validatedContent,
          updated_at: new Date().toISOString(),
        })
        .eq('section', validSection)
        .select()
        .single()) as {
        data: {
          id: string;
          section: string;
          content: Record<string, unknown>;
          updated_at: string;
        } | null;
        error: Error | null;
      };

      if (updateError || !data) {
        throw updateError || new Error('Failed to update site content');
      }

      result = data;
    } else {
      // Insert new section
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: insertError } = (await (supabase as any)
        .from('site_content')
        .insert({
          section: validSection,
          content: validatedContent,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()) as {
        data: {
          id: string;
          section: string;
          content: Record<string, unknown>;
          updated_at: string;
        } | null;
        error: Error | null;
      };

      if (insertError || !data) {
        throw insertError || new Error('Failed to create site content');
      }

      result = data;
    }

    // Log the settings change (fire-and-forget)
    // Use section name as the setting key (e.g., "hero", "seo", "business_info")
    await logSettingsChange(
      supabase,
      user.id,
      'site_content',
      validSection,
      oldValue,
      validatedContent
    );

    return NextResponse.json({
      section: result.section,
      content: result.content,
      updated_at: result.updated_at,
    });
  } catch (error) {
    console.error('[Admin API] Error updating site content:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to update site content';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
