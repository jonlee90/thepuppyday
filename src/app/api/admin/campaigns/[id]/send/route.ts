/**
 * Campaign Send API Route
 * POST /api/admin/campaigns/[id]/send
 * Task 0046: Send campaign to audience
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import {
  getAudienceFromSegment,
  createCampaignSends,
  sendCampaignNotifications,
} from '@/lib/admin/campaign-sender';
import type { MarketingCampaign } from '@/types/marketing';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/admin/campaigns/[id]/send
 * Send a campaign to its target audience
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user } = await requireAdmin(supabase);

    const { id } = await context.params;

    // Get campaign details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campaign, error: campaignError } = await (supabase as any)
      .from('marketing_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Validate and update campaign status atomically to prevent race conditions
    // Only update if status is 'draft' or 'scheduled'
    console.log(`[Campaign Send API] Starting send for campaign: ${campaign.name}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedCampaign, error: updateError } = await (supabase as any)
      .from('marketing_campaigns')
      .update({ status: 'sending', updated_at: new Date().toISOString() })
      .eq('id', id)
      .in('status', ['draft', 'scheduled']) // Only update if in valid status
      .select()
      .single();

    if (updateError || !updatedCampaign) {
      console.error('[Campaign Send API] Failed to update campaign status:', updateError);
      return NextResponse.json(
        {
          error:
            'Campaign cannot be sent. It may have already been sent or is being sent by another user.',
        },
        { status: 409 } // Conflict status
      );
    }

    // Get audience from segment criteria
    const audience = await getAudienceFromSegment(supabase, campaign.segment_criteria);

    if (audience.length === 0) {
      console.log('[Campaign Send API] No audience members found for segment criteria');

      // Update campaign back to draft
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('marketing_campaigns')
        .update({ status: 'draft' })
        .eq('id', id);

      return NextResponse.json(
        { error: 'No customers match the segment criteria' },
        { status: 400 }
      );
    }

    console.log(`[Campaign Send API] Found ${audience.length} audience members`);

    // Determine A/B test config
    const abTestEnabled = campaign.ab_test_config?.enabled || false;
    const splitPercentage = campaign.ab_test_config?.split_percentage || 50;

    // Create campaign_sends records for tracking
    const createResult = await createCampaignSends(
      supabase,
      campaign as MarketingCampaign,
      audience,
      abTestEnabled,
      splitPercentage
    );

    if (!createResult.success) {
      console.error('[Campaign Send API] Failed to create campaign_sends:', createResult.error);

      // Update campaign back to draft
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('marketing_campaigns')
        .update({ status: 'draft' })
        .eq('id', id);

      return NextResponse.json(
        { error: 'Failed to create send records' },
        { status: 500 }
      );
    }

    // Send notifications (Email/SMS)
    const sendResult = await sendCampaignNotifications(
      supabase,
      campaign as MarketingCampaign,
      audience,
      abTestEnabled,
      splitPercentage
    );

    // Update campaign status to 'sent' and set sent_at timestamp
    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('marketing_campaigns')
      .update({
        status: 'sent',
        sent_at: now,
      })
      .eq('id', id);

    console.log(`[Campaign Send API] Campaign sent successfully. Sent: ${sendResult.sent_count}, Skipped: ${sendResult.skipped_count}`);

    return NextResponse.json({
      success: true,
      sent_count: sendResult.sent_count,
      skipped_count: sendResult.skipped_count,
      total_audience: audience.length,
      errors: sendResult.errors,
    });
  } catch (error) {
    console.error('[Campaign Send API] Error in send route:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
