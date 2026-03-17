/**
 * Loyalty Program Settings Page
 *
 * Admin page for managing all loyalty program settings including
 * punch card configuration, earning rules, redemption rules, and referral program.
 *
 * Tasks 0192-0201: Complete loyalty program configuration
 */

export const dynamic = 'force-dynamic';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { AdminBreadcrumb } from '@/components/admin/shared';
import { PunchCardConfig } from '@/components/admin/settings/loyalty/PunchCardConfig';
import { EarningRulesForm } from '@/components/admin/settings/loyalty/EarningRulesForm';
import { RedemptionRulesForm } from '@/components/admin/settings/loyalty/RedemptionRulesForm';
import { ReferralProgramSettings } from '@/components/admin/settings/loyalty/ReferralProgramSettings';

export const metadata = {
  title: 'Loyalty Program - Settings | Admin',
  description: 'Manage loyalty program punch cards, earning rules, redemption options, and referrals',
};

export default async function LoyaltyProgramPage() {
  const supabase = await createServerSupabaseClient();
  await requireAdmin(supabase);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <AdminBreadcrumb items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'Loyalty Settings' }]} />

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="hidden lg:block text-3xl font-bold text-[#434E54]">Loyalty Program Settings</h1>
        <p className="mt-2 text-[#434E54]/60">
          Configure punch card rewards, earning rules, redemption options, and referral program
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Program Status & Punch Card Configuration */}
        <section>
          <h2 className="text-xl font-semibold text-[#434E54] mb-4">
            Program Status & Punch Card
          </h2>
          <PunchCardConfig />
        </section>

        {/* Earning Rules */}
        <section>
          <h2 className="text-xl font-semibold text-[#434E54] mb-4">
            Earning Rules
          </h2>
          <p className="text-sm text-[#434E54]/60 mb-4">
            Configure how customers earn loyalty punches for their appointments
          </p>
          <EarningRulesForm />
        </section>

        {/* Redemption Rules */}
        <section>
          <h2 className="text-xl font-semibold text-[#434E54] mb-4">
            Redemption Rules
          </h2>
          <p className="text-sm text-[#434E54]/60 mb-4">
            Configure how customers can redeem their completed punch cards for free services
          </p>
          <RedemptionRulesForm />
        </section>

        {/* Referral Program */}
        <section>
          <h2 className="text-xl font-semibold text-[#434E54] mb-4">
            Referral Program
          </h2>
          <p className="text-sm text-[#434E54]/60 mb-4">
            Reward customers for referring friends with bonus loyalty punches
          </p>
          <ReferralProgramSettings />
        </section>
      </div>
    </div>
  );
}
