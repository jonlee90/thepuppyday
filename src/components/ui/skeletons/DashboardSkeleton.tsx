/**
 * Skeleton loader for dashboard page
 */

import { Skeleton } from './Skeleton';
import { AppointmentCardSkeleton } from './AppointmentCardSkeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Greeting skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loyalty Card Skeleton */}
          <LoyaltyCardSkeleton />

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#434E54]/10">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-3">
              <AppointmentCardSkeleton />
              <AppointmentCardSkeleton />
            </div>
          </div>
        </div>

        {/* Sidebar - 1 column on large screens */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <QuickActionsSkeleton />

          {/* Membership Status (optional) */}
          <MembershipSkeleton />
        </div>
      </div>
    </div>
  );
}

export function LoyaltyCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-[#434E54]/10">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-5 w-24" />
      </div>

      {/* Paw stamps grid */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="w-10 h-10 rounded-full mx-auto" />
        ))}
      </div>

      {/* Progress bar */}
      <Skeleton className="h-2 w-full rounded-full mb-3" />

      {/* Progress text */}
      <Skeleton className="h-4 w-32 mx-auto" />
    </div>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#434E54]/10">
      <Skeleton className="h-6 w-28 mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function MembershipSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#434E54]/10">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}
