/**
 * Campaign Analytics API Route
 * GET /api/admin/campaigns/[id]/analytics
 * Task 0047: Campaign performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import {
  getCampaignPerformance,
  getABTestComparison,
  getConversionData,
} from '@/lib/admin/campaign-analytics';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/admin/campaigns/[id]/analytics
 * Get performance analytics for a campaign
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireAdmin(supabase);

    const { id } = await context.params;

    // Get campaign to check if it exists and has A/B test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaign, error: campaignError } = await (supabase as any)
      .from('marketing_campaigns')
      .select('id, name, ab_test_config')
      .eq('id', id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    console.log(`[Campaign Analytics API] Getting analytics for campaign: ${campaign.name}`);

    // Get overall performance metrics
    const performance = await getCampaignPerformance(supabase, id);

    if (!performance) {
      return NextResponse.json(
        { error: 'Failed to calculate performance metrics' },
        { status: 500 }
      );
    }

    // Get A/B test comparison if A/B test is enabled
    let abTestComparison = null;
    if (campaign.ab_test_config?.enabled) {
      abTestComparison = await getABTestComparison(supabase, id);
    }

    // Get conversion details
    const conversions = await getConversionData(supabase, id);

    return NextResponse.json({
      performance,
      ab_test_comparison: abTestComparison,
      conversions,
    });
  } catch (error) {
    console.error('[Campaign Analytics API] Error in analytics route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
