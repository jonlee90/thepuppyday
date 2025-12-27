/**
 * Lazy-loaded Chart Components
 * Task 0226: Implement dynamic imports for heavy components
 *
 * Reduces initial bundle size by code-splitting chart libraries
 */

'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

/**
 * Loading fallback for charts
 */
function ChartSkeleton() {
  return (
    <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-gray-400">Loading chart...</div>
    </div>
  );
}

/**
 * Lazy-loaded chart components
 * These are dynamically imported only when needed
 */

// Revenue Chart - Only loads when dashboard needs it
export const RevenueChart = dynamic(
  () => import('./charts/RevenueChart').then((mod) => mod.RevenueChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Charts typically use window API
  }
);

// Appointments Chart
export const AppointmentsChart = dynamic(
  () => import('./charts/AppointmentsChart').then((mod) => mod.AppointmentsChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// Service Distribution Pie Chart
export const ServiceDistributionChart = dynamic(
  () => import('./charts/ServiceDistributionChart').then((mod) => mod.ServiceDistributionChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// Customer Growth Chart
export const CustomerGrowthChart = dynamic(
  () => import('./charts/CustomerGrowthChart').then((mod) => mod.CustomerGrowthChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// Performance Metrics Chart
export const PerformanceMetricsChart = dynamic(
  () => import('./charts/PerformanceMetricsChart').then((mod) => mod.PerformanceMetricsChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

/**
 * Wrapper component with Suspense boundary
 */
export function LazyChart({
  type,
  data
}: {
  type: 'revenue' | 'appointments' | 'services' | 'customers' | 'performance';
  data: any;
}) {
  const ChartComponent = {
    revenue: RevenueChart,
    appointments: AppointmentsChart,
    services: ServiceDistributionChart,
    customers: CustomerGrowthChart,
    performance: PerformanceMetricsChart,
  }[type];

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ChartComponent data={data} />
    </Suspense>
  );
}
