/**
 * Analytics Dashboard Component
 * Main dashboard with all analytics sections wrapped in error boundaries
 */

'use client';

import { useState, useEffect } from 'react';
import { DateRangeSelector, DateRangePreset } from './DateRangeSelector';
import { KPIGrid } from './KPIGrid';
import { AppointmentTrendChart } from './charts/AppointmentTrendChart';
import { RevenueChart } from './charts/RevenueChart';
import { ServicePopularityChart } from './charts/ServicePopularityChart';
import { CustomerTypeChart } from './charts/CustomerTypeChart';
import { RetentionChart } from './charts/RetentionChart';
import { OperationalMetricsChart } from './charts/OperationalMetricsChart';
import { ExportMenu } from './ExportMenu';
import { ReportCardAnalytics } from './ReportCardAnalytics';
import { WaitlistAnalytics } from './WaitlistAnalytics';
import { MarketingAnalytics } from './MarketingAnalytics';
import { GroomerPerformanceDashboard } from './GroomerPerformanceDashboard';
import { GroomerComparisonTable } from './GroomerComparisonTable';
import { GroomerLeaderboard } from './GroomerLeaderboard';
import { AnalyticsErrorBoundary } from './AnalyticsErrorBoundary';
import { BookingSourceChart } from './BookingSourceChart';
import { PetSizeChart } from './PetSizeChart';
import { PeakHoursChart } from './PeakHoursChart';
import { LoyaltyAnalytics } from './LoyaltyAnalytics';

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

      {/* Loyalty */}
      <AnalyticsErrorBoundary sectionName="Loyalty Analytics">
        <div className="card bg-white shadow-md p-6">
          <h2 className="text-xl font-bold text-[#434E54] mb-4">Loyalty Program</h2>
          <LoyaltyAnalytics dateRange={dateRange} />
        </div>
      </AnalyticsErrorBoundary>

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
