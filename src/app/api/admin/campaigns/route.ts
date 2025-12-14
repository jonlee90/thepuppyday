/**
 * Admin Marketing Campaigns API Route
 * GET /api/admin/campaigns - List campaigns with filtering, pagination, sorting
 * POST /api/admin/campaigns - Create new campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import type { MarketingCampaign, CreateCampaignInput, CampaignStatus } from '@/types/marketing';

/**
 * GET /api/admin/campaigns
 * List campaigns with optional filtering, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireAdmin(supabase);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    const offset = (page - 1) * limit;

    // In mock mode, query from mock store
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();

      // Get all campaigns
      let campaigns = store.select('marketing_campaigns', {
        order: { column: sortBy, ascending: sortOrder === 'asc' },
      }) as unknown as MarketingCampaign[];

      // Apply status filter
      if (status) {
        campaigns = campaigns.filter((campaign) => campaign.status === status);
      }

      // Get total count
      const totalCount = campaigns.length;

      // Apply pagination
      const paginatedCampaigns = campaigns.slice(offset, offset + limit);

      // Enrich with creator data
      const enrichedCampaigns = paginatedCampaigns.map((campaign) => ({
        ...campaign,
        created_by_user: store.selectById('users', campaign.created_by),
      }));

      return NextResponse.json({
        data: enrichedCampaigns,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    }

    // Production Supabase query
    let query = (supabase as any)
      .from('marketing_campaigns')
      .select(
        `
        *,
        created_by_user:users!created_by(id, first_name, last_name, email)
      `,
        { count: 'exact' }
      )
      .range(offset, offset + limit - 1);

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query;

    if (error) {
      console.error('[Admin API] Error fetching campaigns:', error);
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('[Admin API] Error in campaigns route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/campaigns
 * Create a new marketing campaign
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireAdmin(supabase);

    // Parse request body
    const body: CreateCampaignInput = await request.json();

    // Validate required fields
    if (!body.name || !body.type || !body.channel) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, channel' },
        { status: 400 }
      );
    }

    // Validate segment_criteria
    if (!body.segment_criteria || typeof body.segment_criteria !== 'object') {
      return NextResponse.json(
        { error: 'Invalid or missing segment_criteria' },
        { status: 400 }
      );
    }

    // Validate message_content
    if (!body.message_content || typeof body.message_content !== 'object') {
      return NextResponse.json(
        { error: 'Invalid or missing message_content' },
        { status: 400 }
      );
    }

    // In mock mode, insert into mock store
    if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
      const { getMockStore } = await import('@/mocks/supabase/store');
      const store = getMockStore();

      const newCampaign: Partial<MarketingCampaign> = {
        name: body.name,
        description: body.description || null,
        type: body.type,
        status: 'draft' as CampaignStatus,
        channel: body.channel,
        segment_criteria: body.segment_criteria,
        message_content: body.message_content,
        ab_test_config: body.ab_test_config || null,
        scheduled_at: body.scheduled_at || null,
        sent_at: null,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      };

      const inserted = store.insert('marketing_campaigns', newCampaign);

      // Enrich with creator data
      const enriched = {
        ...inserted,
        created_by_user: store.selectById('users', user.id),
      };

      return NextResponse.json(enriched, { status: 201 });
    }

    // Production Supabase insert
    const { data, error } = await (supabase as any)
      .from('marketing_campaigns')
      .insert({
        name: body.name,
        description: body.description || null,
        type: body.type,
        status: 'draft',
        channel: body.channel,
        segment_criteria: body.segment_criteria,
        message_content: body.message_content,
        ab_test_config: body.ab_test_config || null,
        scheduled_at: body.scheduled_at || null,
        created_by: user.id,
      })
      .select(
        `
        *,
        created_by_user:users!created_by(id, first_name, last_name, email)
      `
      )
      .single();

    if (error) {
      console.error('[Admin API] Error creating campaign:', error);
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[Admin API] Error in campaigns POST route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
