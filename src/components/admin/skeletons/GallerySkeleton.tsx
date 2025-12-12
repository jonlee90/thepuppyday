/**
 * Gallery grid skeleton loader
 */

import { Skeleton } from '@/components/ui/skeletons/Skeleton';

export function GallerySkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with filters and button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter tabs skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-16 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>

        {/* Upload button skeleton */}
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <GalleryImageSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function GalleryImageSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image skeleton with aspect ratio */}
      <div className="relative aspect-square bg-gray-100">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Info skeleton */}
      <div className="p-3 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}
