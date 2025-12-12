/**
 * Loading skeleton for auth pages - Clean & Elegant Professional design
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLoading() {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg animate-pulse">
      {/* Header Skeleton */}
      <div className="text-center mb-8 space-y-3">
        <Skeleton className="h-9 w-48 mx-auto bg-[#EAE0D5]" />
        <Skeleton className="h-5 w-64 mx-auto bg-[#EAE0D5]" />
      </div>

      {/* Form Fields Skeleton */}
      <div className="space-y-5">
        <div>
          <Skeleton className="h-4 w-16 mb-2 bg-[#EAE0D5]" />
          <Skeleton className="h-12 w-full rounded-lg bg-[#EAE0D5]" />
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-2 bg-[#EAE0D5]" />
          <Skeleton className="h-12 w-full rounded-lg bg-[#EAE0D5]" />
        </div>
      </div>

      {/* Link Skeleton */}
      <div className="flex justify-end mt-4">
        <Skeleton className="h-4 w-32 bg-[#EAE0D5]" />
      </div>

      {/* Button Skeleton */}
      <div className="mt-5">
        <Skeleton className="h-12 w-full rounded-lg bg-[#EAE0D5]" />
      </div>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <Skeleton className="h-4 w-12 bg-white" />
        </div>
      </div>

      {/* Bottom Text Skeleton */}
      <div className="flex justify-center gap-2">
        <Skeleton className="h-4 w-32 bg-[#EAE0D5]" />
        <Skeleton className="h-4 w-20 bg-[#EAE0D5]" />
      </div>
    </div>
  );
}
