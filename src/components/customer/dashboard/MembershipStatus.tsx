/**
 * Membership Status widget for dashboard
 * Shows current membership plan details and benefits
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface MembershipBenefit {
  label: string;
  included: boolean;
}

interface MembershipStatusProps {
  membership?: {
    planName: string;
    status: 'active' | 'paused' | 'cancelled' | 'expired';
    currentPeriodEnd: string;
    groomsRemaining?: number;
    groomsPerPeriod?: number;
    benefits: MembershipBenefit[];
    monthlyPrice: number;
  } | null;
}

export function MembershipStatus({ membership }: MembershipStatusProps) {
  // No membership
  if (!membership) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#434E54]/10">
          <h3 className="font-bold text-[#434E54]">Membership</h3>
        </div>

        {/* Upgrade CTA */}
        <div className="p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#EAE0D5]/50 flex items-center justify-center">
            <svg className="w-7 h-7 text-[#434E54]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h4 className="font-semibold text-[#434E54] mb-2">Become a Member</h4>
          <p className="text-sm text-[#434E54]/60 mb-4">
            Save on every grooming visit with our membership plans.
          </p>
          <Link
            href="/membership"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg
                     bg-[#434E54] text-white font-semibold text-sm
                     hover:bg-[#434E54]/90 transition-all duration-200
                     shadow-md hover:shadow-lg"
          >
            View Plans
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-700',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#434E54]/10 flex items-center justify-between">
        <h3 className="font-bold text-[#434E54]">Membership</h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[membership.status]}`}>
          {membership.status}
        </span>
      </div>

      {/* Plan details */}
      <div className="p-5">
        {/* Plan name and price */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-bold text-lg text-[#434E54]">{membership.planName}</p>
            <p className="text-sm text-[#434E54]/60">
              Renews {formatDate(membership.currentPeriodEnd)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-[#434E54]">
              ${membership.monthlyPrice}
            </p>
            <p className="text-xs text-[#434E54]/60">/month</p>
          </div>
        </div>

        {/* Grooms remaining (if applicable) */}
        {membership.groomsRemaining !== undefined && membership.groomsPerPeriod && (
          <div className="mb-4 p-3 rounded-lg bg-[#EAE0D5]/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#434E54]">Grooms This Period</span>
              <span className="text-sm font-bold text-[#434E54]">
                {membership.groomsRemaining} of {membership.groomsPerPeriod} remaining
              </span>
            </div>
            <div className="h-2 bg-[#EAE0D5] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(membership.groomsRemaining / membership.groomsPerPeriod) * 100}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-full bg-[#434E54] rounded-full"
              />
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="space-y-2 mb-4">
          {membership.benefits.slice(0, 4).map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              {benefit.included ? (
                <svg className="w-4 h-4 text-[#434E54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-[#434E54]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className={benefit.included ? 'text-[#434E54]' : 'text-[#434E54]/40'}>
                {benefit.label}
              </span>
            </div>
          ))}
        </div>

        {/* Manage link */}
        <Link
          href="/membership"
          className="inline-flex items-center text-sm font-medium text-[#434E54]/70 hover:text-[#434E54] transition-colors"
        >
          Manage Membership
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </motion.div>
  );
}
