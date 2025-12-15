/**
 * Notification Center Loading Skeleton
 * Task 0073: Clean & Elegant Professional loading state for notifications
 */

'use client';

export function NotificationSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-24 bg-[#EAE0D5] rounded" />
              <div className="h-8 w-8 bg-[#EAE0D5] rounded-lg" />
            </div>
            <div className="h-8 w-20 bg-[#EAE0D5] rounded mb-2" />
            <div className="h-3 w-28 bg-[#EAE0D5] rounded" />
          </div>
        ))}
      </div>

      {/* Bulk Actions Skeleton */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-48 bg-[#EAE0D5] rounded" />
          <div className="h-10 w-36 bg-[#434E54]/20 rounded-lg" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i}>
              <div className="h-4 w-20 bg-[#EAE0D5] rounded mb-2" />
              <div className="h-10 bg-[#EAE0D5] rounded-lg" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <div className="h-9 w-24 bg-[#EAE0D5] rounded-lg" />
          <div className="h-9 w-28 bg-[#434E54]/20 rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Table Header */}
        <div className="bg-[#F8EEE5] px-6 py-4">
          <div className="grid grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-4 bg-[#EAE0D5] rounded" />
            ))}
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="px-6 py-4 hover:bg-[#F8EEE5]/30 cursor-pointer">
              <div className="grid grid-cols-7 gap-4 items-center">
                <div className="h-4 bg-[#EAE0D5] rounded" />
                <div className="h-4 bg-[#EAE0D5] rounded" />
                <div className="h-6 w-16 bg-[#EAE0D5] rounded-full" />
                <div className="h-4 bg-[#EAE0D5] rounded" />
                <div className="h-4 bg-[#EAE0D5] rounded" />
                <div className="h-6 w-20 bg-[#EAE0D5] rounded-full" />
                <div className="h-4 bg-[#EAE0D5] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between px-6">
        <div className="h-4 w-40 bg-[#EAE0D5] rounded" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-10 bg-[#EAE0D5] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
