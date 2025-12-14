/**
 * Analytics Dashboard Component
 * Task 0048: Main dashboard with all analytics sections
 */

'use client';

import { useState } from 'react';
import { DateRangeSelector, DateRangePreset } from './DateRangeSelector';
import { KPIGrid } from './KPIGrid';
import { AppointmentTrendChart } from './charts/AppointmentTrendChart';
import { RevenueChart } from './charts/RevenueChart';
import { ServicePopularityChart } from './charts/ServicePopularityChart';
import { CustomerTypeChart } from './charts/CustomerTypeChart';
import { RetentionChart } from './charts/RetentionChart';
import { OperationalMetricsChart } from './charts/OperationalMetricsChart';
import { ExportMenu } from './ExportMenu';
import ReportCardAnalytics from './ReportCardAnalytics';
import WaitlistAnalytics from './WaitlistAnalytics';
import MarketingAnalytics from './MarketingAnalytics';

interface DateRange {
  start: Date;
  end: Date;
}

export default function AnalyticsDashboard() {
  // Initialize with last 30 days
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  });

  const handleDateRangeChange = (range: DateRange, preset: DateRangePreset) => {
    setDateRange(range);
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

      {/* KPI Grid - Task 0050 */}
      <div className="card bg-white shadow-md p-6">
        <h2 className="text-xl font-bold text-[#434E54] mb-4">Key Performance Indicators</h2>
        <KPIGrid dateRange={dateRange} />
      </div>

      {/* Appointment Trend Chart - Task 0051 */}
      <div className="card bg-white shadow-md p-6">
        <h2 className="text-xl font-bold text-[#434E54] mb-4">Appointment Trends</h2>
        <AppointmentTrendChart dateRange={dateRange} />
      </div>

      {/* Revenue Chart - Task 0052 */}
      <div className="card bg-white shadow-md p-6">
        <h2 className="text-xl font-bold text-[#434E54] mb-4">Revenue Breakdown</h2>
        <RevenueChart dateRange={dateRange} />
      </div>

      {/* Service Popularity Chart - Task 0053 */}
      <div className="card bg-white shadow-md p-6">
        <h2 className="text-xl font-bold text-[#434E54] mb-4">Service Popularity</h2>
        <ServicePopularityChart dateRange={dateRange} />
      </div>

      {/* Customer Analytics - Task 0054 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-white shadow-md p-6">
          <h2 className="text-xl font-bold text-[#434E54] mb-4">Customer Types</h2>
          <CustomerTypeChart dateRange={dateRange} />
        </div>
        <div className="card bg-white shadow-md p-6">
          <h2 className="text-xl font-bold text-[#434E54] mb-4">Customer Retention</h2>
          <RetentionChart dateRange={dateRange} />
        </div>
      </div>

      {/* Operational Metrics - Task 0055 */}
      <div className="card bg-white shadow-md p-6">
        <h2 className="text-xl font-bold text-[#434E54] mb-4">Operational Metrics</h2>
        <OperationalMetricsChart dateRange={dateRange} />
      </div>

      {/* Report Card Analytics - Task 0058 */}
      <div className="card bg-white shadow-md p-6">
        <h2 className="text-xl font-bold text-[#434E54] mb-4">Report Card Performance</h2>
        <ReportCardAnalytics dateRange={dateRange} />
      </div>

      {/* Waitlist Analytics - Task 0059 */}
      <div className="card bg-white shadow-md p-6">
        <h2 className="text-xl font-bold text-[#434E54] mb-4">Waitlist Performance</h2>
        <WaitlistAnalytics dateRange={dateRange} />
      </div>

      {/* Marketing Analytics - Task 0060 */}
      <div className="card bg-white shadow-md p-6">
        <h2 className="text-xl font-bold text-[#434E54] mb-4">Marketing Campaign Performance</h2>
        <MarketingAnalytics dateRange={dateRange} />
      </div>
    </div>
  );
}
