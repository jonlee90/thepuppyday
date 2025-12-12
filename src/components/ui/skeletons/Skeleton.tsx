/**
 * Base skeleton component with pulse animation
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[#EAE0D5]',
        className
      )}
    />
  );
}
