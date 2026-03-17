import { Metadata } from 'next';
import { CampaignList } from '@/components/admin/marketing/CampaignList';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Campaign Builder | Marketing - The Puppy Day',
  description: 'Create and manage marketing campaigns for customer engagement.',
};

/**
 * Marketing Campaigns Page
 * /admin/marketing/campaigns
 *
 * Admin dashboard for creating, viewing, and managing marketing campaigns.
 * Supports email, SMS, and multi-channel campaigns with customer segmentation.
 */

export const dynamic = 'force-dynamic';
export default async function CampaignsPage() {
  const supabase = await createServerSupabaseClient();

  // Check admin authorization
  const admin = await requireAdmin(supabase);
  if (!admin) {
    redirect('/login');
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="hidden lg:block text-3xl font-bold text-[#434E54] mb-2">
          Campaign Builder
        </h1>
        <p className="text-[#434E54]/60">
          Create and manage targeted marketing campaigns to engage customers via email and SMS
        </p>
      </div>

      {/* Campaign List */}
      <CampaignList />
    </div>
  );
}
