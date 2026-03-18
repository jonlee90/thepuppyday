/**
 * Chart Wrapper Component
 * Task 0049: Responsive chart container with loading state
 */

'use client';

import { ResponsiveContainer } from 'recharts';
import { useAdminStore } from '@/stores/admin-store';

interface ChartWrapperProps {
  children: React.ReactNode;
  height?: number;
  mobileHeight?: number;
  isLoading?: boolean;
  error?: string | null;
}

export function ChartWrapper({
  children,
  height = 300,
  mobileHeight,
  isLoading = false,
  error = null,
}: ChartWrapperProps) {
  const isMobile = useAdminStore((s) => s.currentBreakpoint === 'mobile');
  const effectiveHeight = (isMobile && mobileHeight) ? mobileHeight : height;

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg animate-pulse"
        style={{ height: effectiveHeight }}
      >
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-red-50 rounded-lg"
        style={{ height: effectiveHeight }}
      >
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={effectiveHeight}>
      {children}
    </ResponsiveContainer>
  );
}
