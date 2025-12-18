/**
 * Settings Dashboard Skeleton Loader
 * Task 0157: Loading state for settings dashboard
 */

import { Skeleton } from '@/components/ui/skeletons/Skeleton';

export function SettingsDashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <SettingsCardSkeleton key={i} />
      ))}
    </div>
  );
}

function SettingsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-6">
      {/* Header: Icon + Title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Icon skeleton */}
          <Skeleton className="w-12 h-12 rounded-lg" />

          {/* Title skeleton */}
          <Skeleton className="h-6 w-32" />
        </div>

        {/* Arrow skeleton */}
        <Skeleton className="w-5 h-5" />
      </div>

      {/* Description skeleton */}
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />

      {/* Status and summary */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
