/**
 * Banner list loading skeleton
 * Task 0173: Loading states
 */

import { Skeleton } from '@/components/ui/skeletons/Skeleton';

interface BannerSkeletonProps {
  count?: number;
}

export function BannerSkeleton({ count = 3 }: BannerSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Desktop: Table Skeleton */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-[#434E54]/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#434E54]/10 bg-[#EAE0D5]/30">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-1"><Skeleton className="h-4 w-12" /></div>
            <div className="col-span-2"><Skeleton className="h-4 w-20" /></div>
            <div className="col-span-3"><Skeleton className="h-4 w-24" /></div>
            <div className="col-span-2"><Skeleton className="h-4 w-20" /></div>
            <div className="col-span-2"><Skeleton className="h-4 w-16" /></div>
            <div className="col-span-1"><Skeleton className="h-4 w-12" /></div>
            <div className="col-span-1"><Skeleton className="h-4 w-16" /></div>
          </div>
        </div>

        <div className="divide-y divide-[#434E54]/10">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1">
                  <Skeleton className="h-5 w-5" />
                </div>
                <div className="col-span-2">
                  <Skeleton className="h-12 w-24 rounded-lg" />
                </div>
                <div className="col-span-3">
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="col-span-2">
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="col-span-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="col-span-1">
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="col-span-1 flex justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Card Skeleton */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-[#434E54]/10 p-4 space-y-3">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 flex-1 rounded-lg" />
              <Skeleton className="h-8 flex-1 rounded-lg" />
              <Skeleton className="h-8 w-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
