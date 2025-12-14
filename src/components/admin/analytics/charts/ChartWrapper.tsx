/**
 * Chart Wrapper Component
 * Task 0049: Responsive chart container with loading state
 */

'use client';

import { ResponsiveContainer } from 'recharts';

interface ChartWrapperProps {
  children: React.ReactNode;
  height?: number;
  isLoading?: boolean;
  error?: string | null;
}

export function ChartWrapper({
  children,
  height = 300,
  isLoading = false,
  error = null,
}: ChartWrapperProps) {
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg animate-pulse"
        style={{ height }}
      >
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-red-50 rounded-lg"
        style={{ height }}
      >
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  );
}
