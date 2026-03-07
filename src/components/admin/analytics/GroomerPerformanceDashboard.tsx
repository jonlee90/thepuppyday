'use client';

import { useState, useEffect } from 'react';
import { GroomerSelector } from './GroomerSelector';
import {
  TrendingUp,
  Star,
  DollarSign,
  Package,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, ResponsiveContainer } from 'recharts';
import { ChartWrapper } from './charts/ChartWrapper';
import { CHART_CONFIG } from './charts/index';

interface GroomerPerformanceData {
  groomer_id: string;
  groomer_name: string;
  metrics: {
    appointments_completed: number;
    appointments_trend: number;
    average_rating: number;
    rating_trend: number;
    revenue_total: number;
    revenue_per_appointment: number;
    revenue_trend: number;
    addon_attachment_rate: number;
    addon_trend: number;
    completion_rate: number;
    completion_rate_trend: number;
  };
  trends: {
    dates: string[];
    appointments: number[];
    revenue: number[];
    ratings: number[];
  };
}

interface GroomerPerformanceDashboardProps {
  dateRange: {
    start: string;
    end: string;
  };
}

export function GroomerPerformanceDashboard({ dateRange }: GroomerPerformanceDashboardProps) {
  const [selectedGroomerId, setSelectedGroomerId] = useState<string | null>(null);
  const [data, setData] = useState<GroomerPerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedGroomerId, dateRange]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
      });

      if (selectedGroomerId) {
        params.append('groomerId', selectedGroomerId);
      }

      const response = await fetch(`/api/admin/analytics/groomers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch performance data');

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return <TrendingUp className="w-4 h-4 text-[#6BCB77]" />;
    } else if (trend < 0) {
      return <TrendingUp className="w-4 h-4 text-[#EF4444] rotate-180" />;
    }
    return null;
  };

  const getTrendText = (trend: number) => {
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend.toFixed(1)}%`;
  };

  // Transform parallel arrays to Recharts data format
  const getChartData = () => {
    if (!data?.trends?.dates) return [];
    return data.trends.dates.map((date: string, i: number) => ({
      date,
      appointments: data.trends.appointments[i] ?? 0,
      revenue: data.trends.revenue[i] ?? 0,
      rating: data.trends.ratings[i] ?? 0,
    }));
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <GroomerSelector
          onGroomerChange={setSelectedGroomerId}
          selectedGroomerId={selectedGroomerId}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="skeleton h-4 w-24 mb-4"></div>
              <div className="skeleton h-8 w-32 mb-2"></div>
              <div className="skeleton h-3 w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <GroomerSelector
          onGroomerChange={setSelectedGroomerId}
          selectedGroomerId={selectedGroomerId}
        />

        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#434E54] mb-2">Error Loading Data</h3>
          <p className="text-[#6B7280] mb-4">{error}</p>
          <button
            onClick={fetchPerformanceData}
            className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <GroomerSelector
          onGroomerChange={setSelectedGroomerId}
          selectedGroomerId={selectedGroomerId}
        />

        <div className="bg-white p-12 rounded-xl shadow-sm text-center">
          <Calendar className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#434E54] mb-2">No Data Available</h3>
          <p className="text-[#6B7280]">
            Select a groomer to view their performance metrics
          </p>
        </div>
      </div>
    );
  }

  const { metrics, trends } = data;

  return (
    <div className="space-y-6">
      {/* Groomer Selector */}
      <GroomerSelector
        onGroomerChange={setSelectedGroomerId}
        selectedGroomerId={selectedGroomerId}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Appointments Completed */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
              <Calendar className="w-5 h-5 text-[#434E54]" />
            </div>
            <h3 className="text-sm font-medium text-[#6B7280]">Appointments Completed</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-[#434E54]">
              {metrics.appointments_completed}
            </span>
            {getTrendIcon(metrics.appointments_trend)}
          </div>
          <p className={`text-sm font-medium ${
            metrics.appointments_trend >= 0 ? 'text-[#6BCB77]' : 'text-[#EF4444]'
          }`}>
            {getTrendText(metrics.appointments_trend)} vs previous period
          </p>
        </div>

        {/* Average Rating */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
              <Star className="w-5 h-5 text-[#434E54]" />
            </div>
            <h3 className="text-sm font-medium text-[#6B7280]">Average Rating</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-[#434E54]">
              {metrics.average_rating.toFixed(1)}
            </span>
            <span className="text-lg text-[#9CA3AF]">/ 5.0</span>
            {getTrendIcon(metrics.rating_trend)}
          </div>
          <p className={`text-sm font-medium ${
            metrics.rating_trend >= 0 ? 'text-[#6BCB77]' : 'text-[#EF4444]'
          }`}>
            {getTrendText(metrics.rating_trend)} vs previous period
          </p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
              <DollarSign className="w-5 h-5 text-[#434E54]" />
            </div>
            <h3 className="text-sm font-medium text-[#6B7280]">Total Revenue</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-[#434E54]">
              ${metrics.revenue_total.toLocaleString()}
            </span>
            {getTrendIcon(metrics.revenue_trend)}
          </div>
          <p className={`text-sm font-medium ${
            metrics.revenue_trend >= 0 ? 'text-[#6BCB77]' : 'text-[#EF4444]'
          }`}>
            {getTrendText(metrics.revenue_trend)} vs previous period
          </p>
        </div>

        {/* Avg Revenue per Appointment */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
              <DollarSign className="w-5 h-5 text-[#434E54]" />
            </div>
            <h3 className="text-sm font-medium text-[#6B7280]">Avg Revenue / Appointment</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-[#434E54]">
              ${metrics.revenue_per_appointment.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-[#9CA3AF]">
            Based on {metrics.appointments_completed} appointments
          </p>
        </div>

        {/* Add-on Attachment Rate */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
              <Package className="w-5 h-5 text-[#434E54]" />
            </div>
            <h3 className="text-sm font-medium text-[#6B7280]">Add-on Attachment Rate</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-[#434E54]">
              {metrics.addon_attachment_rate.toFixed(1)}%
            </span>
            {getTrendIcon(metrics.addon_trend)}
          </div>
          <p className={`text-sm font-medium ${
            metrics.addon_trend >= 0 ? 'text-[#6BCB77]' : 'text-[#EF4444]'
          }`}>
            {getTrendText(metrics.addon_trend)} vs previous period
          </p>
        </div>

        {/* On-Time Percentage */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
              <Clock className="w-5 h-5 text-[#434E54]" />
            </div>
            <h3 className="text-sm font-medium text-[#6B7280]">Completion Rate</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-[#434E54]">
              {metrics.completion_rate.toFixed(1)}%
            </span>
            {getTrendIcon(metrics.completion_rate_trend)}
          </div>
          <p className={`text-sm font-medium ${
            metrics.completion_rate_trend >= 0 ? 'text-[#6BCB77]' : 'text-[#EF4444]'
          }`}>
            {getTrendText(metrics.completion_rate_trend)} vs previous period
          </p>
        </div>
      </div>

      {/* Performance Trends Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Trend */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-[#434E54] mb-4">
            Appointments Trend
          </h3>
          <ChartWrapper height={256}>
            <LineChart data={getChartData()} margin={CHART_CONFIG.margin}>
              <CartesianGrid {...CHART_CONFIG.grid} />
              <XAxis dataKey="date" {...CHART_CONFIG.axis} />
              <YAxis {...CHART_CONFIG.axis} />
              <Tooltip {...CHART_CONFIG.tooltip} />
              <defs>
                <linearGradient id="fillAppointments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#434E54" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#434E54" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="appointments" fill="url(#fillAppointments)" stroke="none" />
              <Line type="monotone" dataKey="appointments" stroke="#434E54" strokeWidth={2} dot={{ r: 4, fill: '#434E54', strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ChartWrapper>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-[#434E54] mb-4">
            Revenue Trend
          </h3>
          <ChartWrapper height={256}>
            <LineChart data={getChartData()} margin={CHART_CONFIG.margin}>
              <CartesianGrid {...CHART_CONFIG.grid} />
              <XAxis dataKey="date" {...CHART_CONFIG.axis} />
              <YAxis {...CHART_CONFIG.axis} tickFormatter={(v) => `$${v.toLocaleString()}`} />
              <Tooltip {...CHART_CONFIG.tooltip} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6BCB77" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#6BCB77" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="revenue" fill="url(#fillRevenue)" stroke="none" />
              <Line type="monotone" dataKey="revenue" stroke="#6BCB77" strokeWidth={2} dot={{ r: 4, fill: '#6BCB77', strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ChartWrapper>
        </div>

        {/* Rating Trend */}
        <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2">
          <h3 className="text-lg font-semibold text-[#434E54] mb-4">
            Rating Trend
          </h3>
          <ChartWrapper height={256}>
            <LineChart data={getChartData()} margin={CHART_CONFIG.margin}>
              <CartesianGrid {...CHART_CONFIG.grid} />
              <XAxis dataKey="date" {...CHART_CONFIG.axis} />
              <YAxis {...CHART_CONFIG.axis} domain={[0, 5]} />
              <Tooltip {...CHART_CONFIG.tooltip} formatter={(value: number) => [value.toFixed(1), 'Rating']} />
              <defs>
                <linearGradient id="fillRating" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFB347" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#FFB347" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="rating" fill="url(#fillRating)" stroke="none" />
              <Line type="monotone" dataKey="rating" stroke="#FFB347" strokeWidth={2} dot={{ r: 4, fill: '#FFB347', strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ChartWrapper>
        </div>
      </div>
    </div>
  );
}
