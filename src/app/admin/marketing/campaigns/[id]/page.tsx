/**
 * Campaign Detail Page
 * Shows campaign details and performance analytics
 * Task 0047: Campaign performance tracking
 */

import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import CampaignPerformance from '@/components/admin/marketing/CampaignPerformance';
import { ArrowLeft, Mail, MessageSquare, Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import type { MarketingCampaign } from '@/types/marketing';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Force dynamic rendering to allow authentication checks
export const dynamic = 'force-dynamic';

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Require admin authentication
  await requireAdmin(supabase);

  // Fetch campaign details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campaign, error } = await (supabase as any)
    .from('marketing_campaigns')
    .select(
      `
      *,
      created_by_user:users!created_by(first_name, last_name)
    `
    )
    .eq('id', id)
    .single();

  if (error || !campaign) {
    notFound();
  }

  const typedCampaign = campaign as MarketingCampaign & {
    created_by_user: { first_name: string; last_name: string };
  };

  // Get channel icon
  const getChannelIcon = (channel: string) => {
    if (channel === 'email') return <Mail className="w-5 h-5" />;
    if (channel === 'sms') return <MessageSquare className="w-5 h-5" />;
    return (
      <div className="flex gap-1">
        <Mail className="w-5 h-5" />
        <MessageSquare className="w-5 h-5" />
      </div>
    );
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'badge-ghost text-gray-600',
      scheduled: 'badge-info text-blue-700',
      sending: 'badge-warning text-yellow-700',
      sent: 'badge-success text-green-700',
      cancelled: 'badge-error text-red-700',
    };

    const labels: Record<string, string> = {
      draft: 'Draft',
      scheduled: 'Scheduled',
      sending: 'Sending',
      sent: 'Sent',
      cancelled: 'Cancelled',
    };

    return (
      <span className={`badge ${styles[status] || 'badge-ghost'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8EEE5] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href="/admin/marketing/campaigns"
          className="btn btn-ghost btn-sm gap-2 hover:bg-[#EAE0D5]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Link>

        {/* Campaign Header */}
        <div className="card bg-white shadow-md">
          <div className="card-body">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-[#434E54]">
                    {typedCampaign.name}
                  </h1>
                  {getStatusBadge(typedCampaign.status)}
                </div>

                {typedCampaign.description && (
                  <p className="text-gray-600 mb-4">{typedCampaign.description}</p>
                )}

                {/* Campaign Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    {getChannelIcon(typedCampaign.channel)}
                    <span className="text-sm capitalize">{typedCampaign.channel}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm">
                      {typedCampaign.type === 'one_time' ? 'One-time' : 'Recurring'}
                    </span>
                  </div>

                  {typedCampaign.scheduled_at && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm">
                        {new Date(typedCampaign.scheduled_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {typedCampaign.sent_at && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm">
                        Sent: {new Date(typedCampaign.sent_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Created By */}
                <p className="text-xs text-gray-500 mt-4">
                  Created by {typedCampaign.created_by_user.first_name}{' '}
                  {typedCampaign.created_by_user.last_name} on{' '}
                  {new Date(typedCampaign.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Analytics */}
        {typedCampaign.status === 'sent' && (
          <CampaignPerformance campaignId={id} />
        )}

        {/* Draft/Scheduled State */}
        {typedCampaign.status !== 'sent' && (
          <div className="card bg-white shadow-md">
            <div className="card-body items-center text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-[#434E54] mb-2">
                Performance Analytics Unavailable
              </h3>
              <p className="text-gray-600 max-w-md">
                Performance metrics will be available after the campaign has been sent.
                {typedCampaign.status === 'draft' && (
                  <> Send the campaign to start tracking engagement and conversions.</>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
