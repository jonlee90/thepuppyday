/**
 * Waitlist Dashboard Loading Skeleton
 * Task 0073: Clean & Elegant Professional loading state for waitlist
 */

'use client';

export function WaitlistSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-32 bg-[#EAE0D5] rounded" />
              <div className="h-8 w-8 bg-[#EAE0D5] rounded-lg" />
            </div>
            <div className="h-10 w-24 bg-[#EAE0D5] rounded" />
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-4 w-20 bg-[#EAE0D5] rounded mb-2" />
              <div className="h-10 bg-[#EAE0D5] rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Table Header */}
        <div className="bg-[#F8EEE5] px-6 py-4">
          <div className="grid grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-4 bg-[#EAE0D5] rounded" />
            ))}
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="px-6 py-4">
              <div className="grid grid-cols-6 gap-4 items-center">
                <div className="h-4 bg-[#EAE0D5] rounded" />
                <div className="h-4 bg-[#EAE0D5] rounded" />
                <div className="h-4 bg-[#EAE0D5] rounded" />
                <div className="h-4 bg-[#EAE0D5] rounded" />
                <div className="h-6 w-20 bg-[#EAE0D5] rounded-full" />
                <div className="h-8 w-24 bg-[#EAE0D5] rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between px-6">
        <div className="h-4 w-32 bg-[#EAE0D5] rounded" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-10 bg-[#EAE0D5] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
