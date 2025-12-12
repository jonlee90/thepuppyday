/**
 * Membership Page
 * View membership plans and current membership status
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Fetch memberships and user's current membership
async function getMembershipData(userId: string) {
  const supabase = await createServerSupabaseClient();

  // Get available memberships
  const { data: memberships } = await (supabase as any)
    .from('memberships')
    .select('*')
    .eq('is_active', true)
    .order('monthly_price', { ascending: true });

  // Get user's current membership
  const { data: customerMembership } = await (supabase as any)
    .from('customer_memberships')
    .select('*, memberships(*)')
    .eq('customer_id', userId)
    .eq('status', 'active')
    .single();

  return {
    memberships: memberships || [],
    currentMembership: customerMembership,
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

// Format date for display
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// Sample membership plans if none in database
const samplePlans = [
  {
    id: '1',
    name: 'Basic',
    description: 'Perfect for occasional grooming',
    monthly_price: 49,
    grooms_per_period: 1,
    discount_percent: 10,
    features: ['1 grooming session/month', '10% off add-ons', 'Priority booking'],
    is_popular: false,
  },
  {
    id: '2',
    name: 'Premium',
    description: 'Best value for regular grooming',
    monthly_price: 89,
    grooms_per_period: 2,
    discount_percent: 15,
    features: ['2 grooming sessions/month', '15% off add-ons', 'Priority booking', 'Free nail trims', 'Complimentary bandana'],
    is_popular: true,
  },
  {
    id: '3',
    name: 'Ultimate',
    description: 'Unlimited pampering for your pup',
    monthly_price: 149,
    grooms_per_period: 4,
    discount_percent: 20,
    features: ['4 grooming sessions/month', '20% off add-ons', 'VIP priority booking', 'Free nail trims', 'Free teeth brushing', 'Complimentary bandana', 'Birthday special'],
    is_popular: false,
  },
];

export default async function MembershipPage() {
  const userData = await getUserInfo();

  if (!userData) {
    return null;
  }

  const { memberships, currentMembership } = await getMembershipData(userData.id);
  const displayPlans = memberships.length > 0 ? memberships : samplePlans;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-[#434E54]">Membership Plans</h1>
          <p className="text-[#434E54]/60 mt-2">
            Save on every grooming visit with our membership plans.
            Choose the plan that fits your pup&apos;s needs.
          </p>
        </div>

        {/* Current Membership Banner */}
        {currentMembership && (
          <div className="bg-[#434E54] text-white rounded-xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-white/70 text-sm mb-1">Current Plan</p>
                <h2 className="text-xl font-bold">
                  {currentMembership.memberships?.name || 'Membership'}
                </h2>
                <p className="text-white/70 mt-1">
                  Renews on {formatDate(currentMembership.current_period_end)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {currentMembership.grooms_remaining !== undefined && (
                  <div className="text-center">
                    <p className="text-3xl font-bold">{currentMembership.grooms_remaining}</p>
                    <p className="text-white/70 text-sm">Grooms Left</p>
                  </div>
                )}
                <button className="px-5 py-2.5 rounded-lg bg-white text-[#434E54] font-semibold text-sm
                                 hover:bg-white/90 transition-colors">
                  Manage
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayPlans.map((plan: any) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={currentMembership?.memberships?.id === plan.id}
            />
          ))}
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#434E54]/10">
            <h2 className="font-bold text-[#434E54]">Frequently Asked Questions</h2>
          </div>
          <div className="divide-y divide-[#434E54]/10">
            <FAQItem
              question="Can I change my plan?"
              answer="Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle."
            />
            <FAQItem
              question="What if I don't use all my grooms?"
              answer="Unused grooms do not roll over to the next month. We encourage you to schedule appointments regularly to get the most value from your membership."
            />
            <FAQItem
              question="Can I cancel my membership?"
              answer="You can cancel your membership at any time. Your benefits will remain active until the end of your current billing period."
            />
            <FAQItem
              question="Are there any additional fees?"
              answer="No hidden fees! The monthly price covers your included grooms. Add-on services are available at a discounted rate."
            />
          </div>
        </div>

        {/* Contact CTA */}
        <div className="text-center py-8">
          <p className="text-[#434E54]/60 mb-4">
            Have questions about our membership plans?
          </p>
          <a
            href="tel:6572522903"
            className="inline-flex items-center gap-2 text-[#434E54] font-semibold hover:underline"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            Call us at (657) 252-2903
          </a>
        </div>
      </div>
    </Suspense>
  );
}

// Plan Card Component
function PlanCard({ plan, isCurrentPlan }: { plan: any; isCurrentPlan?: boolean }) {
  const features = plan.features || [
    `${plan.grooms_per_period} grooming session${plan.grooms_per_period > 1 ? 's' : ''}/month`,
    `${plan.discount_percent}% off add-ons`,
    'Priority booking',
  ];

  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border overflow-hidden relative
        ${plan.is_popular ? 'border-[#434E54] ring-1 ring-[#434E54]' : 'border-[#434E54]/10'}
        ${isCurrentPlan ? 'ring-2 ring-[#434E54]/30' : ''}
      `}
    >
      {/* Popular badge */}
      {plan.is_popular && (
        <div className="absolute top-0 right-0 bg-[#434E54] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
          MOST POPULAR
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
          CURRENT PLAN
        </div>
      )}

      <div className="p-6">
        {/* Plan name */}
        <h3 className="text-xl font-bold text-[#434E54] mb-1">{plan.name}</h3>
        <p className="text-sm text-[#434E54]/60 mb-4">{plan.description}</p>

        {/* Price */}
        <div className="mb-6">
          <span className="text-4xl font-bold text-[#434E54]">${plan.monthly_price}</span>
          <span className="text-[#434E54]/60">/month</span>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-6">
          {features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start gap-2 text-sm text-[#434E54]">
              <svg className="w-5 h-5 text-[#434E54] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200
            ${isCurrentPlan
              ? 'bg-[#EAE0D5] text-[#434E54] cursor-default'
              : plan.is_popular
                ? 'bg-[#434E54] text-white hover:bg-[#434E54]/90 shadow-md hover:shadow-lg'
                : 'bg-[#EAE0D5] text-[#434E54] hover:bg-[#EAE0D5]/70'
            }
          `}
          disabled={isCurrentPlan}
        >
          {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
        </button>
      </div>
    </div>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="px-6 py-4">
      <h3 className="font-semibold text-[#434E54] mb-2">{question}</h3>
      <p className="text-sm text-[#434E54]/70">{answer}</p>
    </div>
  );
}
