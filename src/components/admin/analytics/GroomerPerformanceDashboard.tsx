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
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
    on_time_percentage: number;
    on_time_trend: number;
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#434E54',
        padding: 12,
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#EAE0D5',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: '#F5F5F5',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
        },
      },
    },
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
            <h3 className="text-sm font-medium text-[#6B7280]">On-Time Completion</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-[#434E54]">
              {metrics.on_time_percentage.toFixed(1)}%
            </span>
            {getTrendIcon(metrics.on_time_trend)}
          </div>
          <p className={`text-sm font-medium ${
            metrics.on_time_trend >= 0 ? 'text-[#6BCB77]' : 'text-[#EF4444]'
          }`}>
            {getTrendText(metrics.on_time_trend)} vs previous period
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
          <div className="h-64">
            <Line
              data={{
                labels: trends.dates,
                datasets: [
                  {
                    label: 'Appointments',
                    data: trends.appointments,
                    borderColor: '#434E54',
                    backgroundColor: 'rgba(67, 78, 84, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#434E54',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-[#434E54] mb-4">
            Revenue Trend
          </h3>
          <div className="h-64">
            <Line
              data={{
                labels: trends.dates,
                datasets: [
                  {
                    label: 'Revenue',
                    data: trends.revenue,
                    borderColor: '#6BCB77',
                    backgroundColor: 'rgba(107, 203, 119, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#6BCB77',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                  },
                ],
              }}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  tooltip: {
                    ...chartOptions.plugins.tooltip,
                    callbacks: {
                      label: (context: any) => {
                        return `Revenue: $${context.parsed.y.toLocaleString()}`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Rating Trend */}
        <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2">
          <h3 className="text-lg font-semibold text-[#434E54] mb-4">
            Rating Trend
          </h3>
          <div className="h-64">
            <Line
              data={{
                labels: trends.dates,
                datasets: [
                  {
                    label: 'Rating',
                    data: trends.ratings,
                    borderColor: '#FFB347',
                    backgroundColor: 'rgba(255, 179, 71, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#FFB347',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                  },
                ],
              }}
              options={{
                ...chartOptions,
                scales: {
                  ...chartOptions.scales,
                  y: {
                    ...chartOptions.scales.y,
                    min: 0,
                    max: 5,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
