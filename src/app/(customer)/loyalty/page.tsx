/**
 * Loyalty Program Page
 * Shows full punch card, history, and redemption options
 */

import { Suspense } from 'react';
import { LoyaltyPunchCard } from '@/components/customer/loyalty';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/EmptyState';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Fetch loyalty data
async function getLoyaltyData(userId: string) {
  const supabase = await createServerSupabaseClient();

  // Get loyalty data
  const { data: loyaltyData } = await (supabase as any)
    .from('customer_loyalty')
    .select('*')
    .eq('customer_id', userId)
    .single();

  // Get loyalty settings
  const { data: loyaltySettings } = await (supabase as any)
    .from('loyalty_settings')
    .select('*')
    .single();

  // Get loyalty punches for current cycle
  // Join through customer_loyalty to filter by customer_id
  const { data: loyaltyPunches } = await (supabase as any)
    .from('loyalty_punches')
    .select('*, customer_loyalty!inner(customer_id)')
    .eq('customer_loyalty.customer_id', userId)
    .order('created_at', { ascending: false });

  // Get redemptions through customer_loyalty join
  const { data: redemptions } = await (supabase as any)
    .from('loyalty_redemptions')
    .select(`
      *,
      customer_loyalty!inner(customer_id)
    `)
    .eq('customer_loyalty.customer_id', userId)
    .order('redeemed_at', { ascending: false });

  return {
    loyalty: loyaltyData,
    loyaltySettings,
    loyaltyPunches: loyaltyPunches || [],
    redemptions: redemptions || [],
  };
}

// Get user info from session
async function getUserInfo() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const { data: userData } = await (supabase as any)
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return userData;
}

// Transform loyalty punches for display
function transformPunches(punches: any[]) {
  return punches.map((punch) => ({
    punchNumber: punch.punch_number,
    date: punch.created_at,
    serviceName: punch.service_name,
  }));
}

// Format date for display
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function LoyaltyPage() {
  const userData = await getUserInfo();

  if (!userData) {
    return null;
  }

  const data = await getLoyaltyData(userData.id);

  // Calculate loyalty info
  const threshold = data.loyalty?.threshold_override || data.loyaltySettings?.default_threshold || 9;
  const currentPunches = data.loyalty?.current_punches || 0;
  const freeWashesEarned = data.loyalty?.free_washes_earned || 0;
  const freeWashesRedeemed = data.loyalty?.free_washes_redeemed || 0;
  const freeWashesAvailable = freeWashesEarned - freeWashesRedeemed;
  const isCloseToGoal = threshold - currentPunches <= 2;
  const totalVisits = data.loyalty?.total_visits || 0;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#434E54]">Loyalty Rewards</h1>
          <p className="text-[#434E54]/60 mt-1">
            Earn paw stamps with every visit and get free washes!
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Punch Card - Full size */}
          <div className="lg:col-span-2">
            <LoyaltyPunchCard
              currentPunches={currentPunches}
              threshold={threshold}
              freeWashesAvailable={freeWashesAvailable}
              isCloseToGoal={isCloseToGoal}
              punches={transformPunches(data.loyaltyPunches)}
            />
          </div>

          {/* Stats sidebar */}
          <div className="space-y-4">
            {/* Stats card */}
            <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden p-5">
              <h3 className="font-bold text-[#434E54] mb-4">Your Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#434E54]/70">Total Visits</span>
                  <span className="font-bold text-[#434E54]">{totalVisits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#434E54]/70">Free Washes Earned</span>
                  <span className="font-bold text-[#434E54]">{freeWashesEarned}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#434E54]/70">Free Washes Redeemed</span>
                  <span className="font-bold text-[#434E54]">{freeWashesRedeemed}</span>
                </div>
                <div className="pt-3 border-t border-[#434E54]/10 flex items-center justify-between">
                  <span className="font-semibold text-[#434E54]">Available Now</span>
                  <span className="font-bold text-lg text-[#434E54]">{freeWashesAvailable}</span>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden p-5">
              <h3 className="font-bold text-[#434E54] mb-4">How It Works</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#EAE0D5] flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-xs text-[#434E54]">1</span>
                  </div>
                  <p className="text-[#434E54]/70">Visit us for any grooming service</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#EAE0D5] flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-xs text-[#434E54]">2</span>
                  </div>
                  <p className="text-[#434E54]/70">Earn a paw stamp for each visit</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#EAE0D5] flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-xs text-[#434E54]">3</span>
                  </div>
                  <p className="text-[#434E54]/70">
                    Collect {threshold} stamps to earn a <strong>FREE</strong> wash!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visit History */}
        <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#434E54]/10">
            <h3 className="font-bold text-[#434E54]">Visit History</h3>
          </div>

          {data.loyaltyPunches.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No Visits Yet"
              description="Book your first grooming appointment to start earning rewards!"
              action={{
                label: 'Book Now',
                href: '/book',
              }}
            />
          ) : (
            <div className="divide-y divide-[#434E54]/10">
              {data.loyaltyPunches.slice(0, 10).map((punch: any, index: number) => (
                <div
                  key={punch.id || index}
                  className="px-5 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#434E54] flex items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        fill="white"
                        className="w-5 h-5"
                      >
                        <ellipse cx="12" cy="17" rx="3" ry="2.5" />
                        <ellipse cx="6" cy="13" rx="2" ry="2.5" />
                        <ellipse cx="18" cy="13" rx="2" ry="2.5" />
                        <ellipse cx="8" cy="8" rx="2" ry="2" />
                        <ellipse cx="16" cy="8" rx="2" ry="2" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-[#434E54]">
                        {punch.service_name || 'Grooming Visit'}
                      </p>
                      <p className="text-sm text-[#434E54]/60">
                        Paw #{punch.punch_number} • {formatDate(punch.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-[#434E54]/50 bg-[#EAE0D5]/50 px-2 py-1 rounded">
                      +1 Stamp
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Redemption History */}
        {data.redemptions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#434E54]/10">
              <h3 className="font-bold text-[#434E54]">Redemption History</h3>
            </div>
            <div className="divide-y divide-[#434E54]/10">
              {data.redemptions.map((redemption: any, index: number) => (
                <div
                  key={redemption.id || index}
                  className="px-5 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#EAE0D5] flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-[#434E54]">Free Wash Redeemed</p>
                      <p className="text-sm text-[#434E54]/60">
                        {formatDate(redemption.redeemed_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                      Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Suspense>
  );
}
