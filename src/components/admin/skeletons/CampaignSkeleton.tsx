/**
 * Campaign List Loading Skeleton
 * Task 0073: Clean & Elegant Professional loading state for marketing campaigns
 */

'use client';

export function CampaignSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header with Create Button Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-[#EAE0D5] rounded-lg" />
        <div className="h-10 w-40 bg-[#434E54]/20 rounded-lg" />
      </div>

      {/* Performance Summary Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-24 bg-[#EAE0D5] rounded" />
              <div className="h-6 w-6 bg-[#EAE0D5] rounded" />
            </div>
            <div className="h-8 w-20 bg-[#EAE0D5] rounded mb-2" />
            <div className="h-3 w-16 bg-[#EAE0D5] rounded" />
          </div>
        ))}
      </div>

      {/* Campaign Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-6 w-64 bg-[#EAE0D5] rounded mb-2" />
                <div className="h-4 w-48 bg-[#EAE0D5] rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-16 bg-[#EAE0D5] rounded-full" />
                <div className="h-6 w-20 bg-[#EAE0D5] rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j}>
                  <div className="h-3 w-16 bg-[#EAE0D5] rounded mb-2" />
                  <div className="h-5 w-12 bg-[#EAE0D5] rounded" />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-24 bg-[#EAE0D5] rounded-lg" />
              <div className="h-9 w-28 bg-[#EAE0D5] rounded-lg" />
              <div className="h-9 w-9 bg-[#EAE0D5] rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-10 bg-[#EAE0D5] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
