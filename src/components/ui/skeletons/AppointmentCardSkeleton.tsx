/**
 * Skeleton loader for appointment cards
 */

import { Skeleton } from './Skeleton';

export function AppointmentCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-[#434E54]/10">
      <div className="flex gap-4">
        {/* Pet photo skeleton */}
        <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />

        <div className="flex-1 min-w-0">
          {/* Pet name and service */}
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* Service type */}
          <Skeleton className="h-4 w-24 mb-3" />

          {/* Date and time */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppointmentCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <AppointmentCardSkeleton key={i} />
      ))}
    </div>
  );
}
