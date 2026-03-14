/**
 * Analytics Dashboard Component
 * Main dashboard with all analytics sections wrapped in error boundaries
 */

'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { DateRangeSelector, DateRangePreset } from './DateRangeSelector';
import { KPIGrid } from './KPIGrid';
import { ExportMenu } from './ExportMenu';
import { AnalyticsErrorBoundary } from './AnalyticsErrorBoundary';

// Loading skeleton for chart components
const ChartSkeleton = () => (
  <div className="animate-pulse bg-base-200 rounded-xl h-64" />
);

// Dynamic imports for heavy chart/analytics components
const AppointmentTrendChart = dynamic(
  () => import('./charts/AppointmentTrendChart').then((mod) => ({ default: mod.AppointmentTrendChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
const RevenueChart = dynamic(
  () => import('./charts/RevenueChart').then((mod) => ({ default: mod.RevenueChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
const ServicePopularityChart = dynamic(
  () => import('./charts/ServicePopularityChart').then((mod) => ({ default: mod.ServicePopularityChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
const CustomerTypeChart = dynamic(
  () => import('./charts/CustomerTypeChart').then((mod) => ({ default: mod.CustomerTypeChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
const RetentionChart = dynamic(
  () => import('./charts/RetentionChart').then((mod) => ({ default: mod.RetentionChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
const OperationalMetricsChart = dynamic(
  () => import('./charts/OperationalMetricsChart').then((mod) => ({ default: mod.OperationalMetricsChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
const BookingSourceChart = dynamic(
  () => import('./BookingSourceChart').then((mod) => ({ default: mod.BookingSourceChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
const PetSizeChart = dynamic(
  () => import('./PetSizeChart').then((mod) => ({ default: mod.PetSizeChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
const PeakHoursChart = dynamic(
  () => import('./PeakHoursChart').then((mod) => ({ default: mod.PeakHoursChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
const GroomerPerformanceDashboard = dynamic(
  () => import('./GroomerPerformanceDashboard').then((mod) => ({ default: mod.GroomerPerformanceDashboard })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
const GroomerLeaderboard = dynamic(
  () => import('./GroomerLeaderboard').then((mod) => ({ default: mod.GroomerLeaderboard })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
const GroomerComparisonTable = dynamic(
  () => import('./GroomerComparisonTable').then((mod) => ({ default: mod.GroomerComparisonTable })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
const ReportCardAnalytics = dynamic(
  () => import('./ReportCardAnalytics').then((mod) => ({ default: mod.ReportCardAnalytics })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
const WaitlistAnalytics = dynamic(
  () => import('./WaitlistAnalytics').then((mod) => ({ default: mod.WaitlistAnalytics })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
const MarketingAnalytics = dynamic(
  () => import('./MarketingAnalytics').then((mod) => ({ default: mod.MarketingAnalytics })),
  { loading: () => <ChartSkeleton />, ssr: false }
);
const LoyaltyAnalytics = dynamic(
  () => import('./LoyaltyAnalytics').then((mod) => ({ default: mod.LoyaltyAnalytics })),
  { loading: () => <ChartSkeleton />, ssr: false }
);

interface DateRange {
  start: Date;
  end: Date;
}

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  });

  // Lift customer data fetch to dashboard level (eliminates duplicate fetch)
  const [customerData, setCustomerData] = useState<{ customerTypes: any[]; retentionMetrics: any } | null>(null);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [customerError, setCustomerError] = useState<string | null>(null);

  // Loyalty program enabled state
  const [loyaltyEnabled, setLoyaltyEnabled] = useState<boolean>(true);

  useEffect(() => {
    const controller = new AbortController();
    const fetchCustomerData = async () => {
      setCustomerLoading(true);
      setCustomerError(null);
      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });
        const response = await fetch(`/api/admin/analytics/charts/customers?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Failed to fetch customer data');
        const result = await response.json();
        setCustomerData(result.data);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setCustomerError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setCustomerLoading(false);
      }
    };
    fetchCustomerData();
    return () => controller.abort();
  }, [dateRange]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/settings/loyalty', { signal: controller.signal })
      .then((res) => res.ok ? res.json() : null)
      .then((result) => {
        if (result?.data?.is_enabled !== undefined) {
          setLoyaltyEnabled(result.data.is_enabled);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const handleDateRangeChange = (range: DateRange, preset: DateRangePreset) => {
    setDateRange(range);
  };

  const groomerDateRange = {
    start: dateRange.start.toISOString(),
    end: dateRange.end.toISOString(),
  };

  return (
    <div className="space-y-6">
      {/* Header with Date Range and Export */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <DateRangeSelector value={dateRange} onChange={handleDateRangeChange} />
        </div>
        <ExportMenu dateRange={dateRange} />
      </div>

      {/* KPIs */}
      <AnalyticsErrorBoundary sectionName="KPIs">
        <div className="card bg-white shadow-md p-6">
          <h2 className="text-xl font-bold text-[#434E54] mb-4">Key Performance Indicators</h2>
          <KPIGrid dateRange={dateRange} />
        </div>
      </AnalyticsErrorBoundary>

      {/* Appointment Trends */}
      <AnalyticsErrorBoundary sectionName="Appointment Trends">
        <div className="card bg-white shadow-md p-6">
          <h2 className="text-xl font-bold text-[#434E54] mb-4">Appointment Trends</h2>
          <AppointmentTrendChart dateRange={dateRange} />
        </div>
      </AnalyticsErrorBoundary>

      {/* Revenue */}
      <AnalyticsErrorBoundary sectionName="Revenue">
        <div className="card bg-white shadow-md p-6">
          <h2 className="text-xl font-bold text-[#434E54] mb-4">Revenue Breakdown</h2>
          <RevenueChart dateRange={dateRange} />
        </div>
      </AnalyticsErrorBoundary>

      {/* Service Popularity */}
      <AnalyticsErrorBoundary sectionName="Service Popularity">
        <div className="card bg-white shadow-md p-6">
          <h2 className="text-xl font-bold text-[#434E54] mb-4">Service Popularity</h2>
          <ServicePopularityChart dateRange={dateRange} />
        </div>
      </AnalyticsErrorBoundary>

      {/* Booking Sources */}
      <AnalyticsErrorBoundary sectionName="Booking Sources">
        <div className="card bg-white shadow-md p-6">
          <h2 className="text-xl font-bold text-[#434E54] mb-4">Booking Sources</h2>
          <BookingSourceChart dateRange={dateRange} />
        </div>
      </AnalyticsErrorBoundary>

      {/* Pet Sizes */}
      <AnalyticsErrorBoundary sectionName="Pet Size Distribution">
        <div className="card bg-white shadow-md p-6">
          <h2 className="text-xl font-bold text-[#434E54] mb-4">Pet Size Distribution</h2>
          <PetSizeChart dateRange={dateRange} />
        </div>
      </AnalyticsErrorBoundary>

      {/* Customer Types + Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsErrorBoundary sectionName="Customer Types">
          <div className="card bg-white shadow-md p-6">
            <h2 className="text-xl font-bold text-[#434E54] mb-4">Customer Types</h2>
            <CustomerTypeChart
              dateRange={dateRange}
              customerData={customerData?.customerTypes}
              isLoading={customerLoading}
              error={customerError}
            />
          </div>
        </AnalyticsErrorBoundary>
        <AnalyticsErrorBoundary sectionName="Customer Retention">
          <div className="card bg-white shadow-md p-6">
            <h2 className="text-xl font-bold text-[#434E54] mb-4">Customer Retention</h2>
            <RetentionChart
              dateRange={dateRange}
              retentionMetrics={customerData?.retentionMetrics}
              isLoading={customerLoading}
              error={customerError}
            />
          </div>
        </AnalyticsErrorBoundary>
      </div>

      {/* Peak Hours */}
      <AnalyticsErrorBoundary sectionName="Peak Hours">
        <div className="card bg-white shadow-md p-6">
          <h2 className="text-xl font-bold text-[#434E54] mb-4">Peak Hours</h2>
          <PeakHoursChart dateRange={dateRange} />
        </div>
      </AnalyticsErrorBoundary>

      {/* Operational Metrics */}
      <AnalyticsErrorBoundary sectionName="Operational Metrics">
        <div className="card bg-white shadow-md p-6">
          <h2 className="text-xl font-bold text-[#434E54] mb-4">Operational Metrics</h2>
          <OperationalMetricsChart dateRange={dateRange} />
        </div>
      </AnalyticsErrorBoundary>

      {/* Loyalty — only shown when loyalty program is enabled */}
      {loyaltyEnabled && (
        <AnalyticsErrorBoundary sectionName="Loyalty Analytics">
          <div className="card bg-white shadow-md p-6">
            <h2 className="text-xl font-bold text-[#434E54] mb-4">Loyalty Program</h2>
            <LoyaltyAnalytics dateRange={dateRange} />
          </div>
        </AnalyticsErrorBoundary>
      )}

      {/* Report Cards */}
      <AnalyticsErrorBoundary sectionName="Report Card Performance">
        <div className="card bg-white shadow-md p-6">
          <h2 className="text-xl font-bold text-[#434E54] mb-4">Report Card Performance</h2>
          <ReportCardAnalytics dateRange={dateRange} />
        </div>
      </AnalyticsErrorBoundary>

      {/* Waitlist */}
      <AnalyticsErrorBoundary sectionName="Waitlist Performance">
        <div className="card bg-white shadow-md p-6">
          <h2 className="text-xl font-bold text-[#434E54] mb-4">Waitlist Performance</h2>
          <WaitlistAnalytics dateRange={dateRange} />
        </div>
      </AnalyticsErrorBoundary>

      {/* Marketing */}
      <AnalyticsErrorBoundary sectionName="Marketing">
        <div className="card bg-white shadow-md p-6">
          <h2 className="text-xl font-bold text-[#434E54] mb-4">Marketing Campaign Performance</h2>
          <MarketingAnalytics dateRange={dateRange} />
        </div>
      </AnalyticsErrorBoundary>

      {/* Groomer Performance */}
      <AnalyticsErrorBoundary sectionName="Groomer Performance">
        <div className="card bg-white shadow-md p-6">
          <h2 className="text-xl font-bold text-[#434E54] mb-4">Groomer Performance</h2>
          <GroomerPerformanceDashboard dateRange={groomerDateRange} />
        </div>
      </AnalyticsErrorBoundary>

      {/* Groomer Leaderboard */}
      <AnalyticsErrorBoundary sectionName="Groomer Leaderboard">
        <div className="card bg-white shadow-md p-6">
          <GroomerLeaderboard dateRange={groomerDateRange} />
        </div>
      </AnalyticsErrorBoundary>

      {/* Groomer Comparison */}
      <AnalyticsErrorBoundary sectionName="Groomer Comparison">
        <div className="card bg-white shadow-md p-6">
          <GroomerComparisonTable dateRange={groomerDateRange} />
        </div>
      </AnalyticsErrorBoundary>
    </div>
  );
}
