/**
 * Waitlist Analytics Component
 * Task 0059: Waitlist performance metrics and conversion tracking
 */

'use client';

import { useEffect, useState } from 'react';
import { Users, CheckCircle, Clock, TrendingUp, MessageSquare } from 'lucide-react';
import { ChartWrapper } from './charts/ChartWrapper';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS, CHART_CONFIG, formatNumber, formatPercentage } from './charts/index';

interface WaitlistAnalyticsProps {
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface WaitlistMetrics {
  activeCount: number;
  fillRate: {
    filled: number;
    total: number;
    percentage: number;
  };
  responseRate: {
    responded: number;
    total: number;
    percentage: number;
  };
  avgWaitTime: number; // in days
  conversionRate: {
    booked: number;
    total: number;
    percentage: number;
  };
  trends: {
    date: string;
    active: number;
    filled: number;
    conversion: number;
  }[];
}

export function WaitlistAnalytics({ dateRange }: WaitlistAnalyticsProps) {
  const [metrics, setMetrics] = useState<WaitlistMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWaitlistMetrics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/admin/analytics/waitlist?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch waitlist metrics');
        }

        const result = await response.json();
        setMetrics(result.data);
      } catch (err) {
        console.error('Error fetching waitlist metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWaitlistMetrics();
  }, [dateRange]);

  const formatDays = (days: number): string => {
    if (days < 1) return `${Math.round(days * 24)} hrs`;
    return `${days.toFixed(1)} days`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card bg-gray-100 shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        {/* Skeleton for chart */}
        <div className="card bg-gray-100 shadow-sm p-6 animate-pulse">
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 shadow-sm p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="card bg-white shadow-sm p-6">
        <p className="text-gray-500">No waitlist data available for this period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Waitlist */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Active</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatNumber(metrics.activeCount)}
          </div>
          <div className="text-sm text-gray-500">Currently waiting</div>
        </div>

        {/* Fill Rate */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Fill Rate</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatPercentage(metrics.fillRate.percentage)}
          </div>
          <div className="text-sm text-gray-500">
            {formatNumber(metrics.fillRate.filled)} of {formatNumber(metrics.fillRate.total)} filled
          </div>
        </div>

        {/* Response Rate */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Response Rate</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatPercentage(metrics.responseRate.percentage)}
          </div>
          <div className="text-sm text-gray-500">
            {formatNumber(metrics.responseRate.responded)} responded
          </div>
        </div>

        {/* Average Wait Time */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Avg Wait</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatDays(metrics.avgWaitTime)}
          </div>
          <div className="text-sm text-gray-500">Until slot offered</div>
        </div>

        {/* Conversion to Booking */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-teal-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Conversion</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatPercentage(metrics.conversionRate.percentage)}
          </div>
          <div className="text-sm text-gray-500">
            {formatNumber(metrics.conversionRate.booked)} bookings
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      {metrics.trends && metrics.trends.length > 0 && (
        <div className="card bg-white shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#434E54]" />
            <h3 className="text-lg font-bold text-[#434E54]">Waitlist Trends</h3>
          </div>

          <ChartWrapper height={300}>
            <LineChart data={metrics.trends} margin={CHART_CONFIG.margin}>
              <CartesianGrid {...CHART_CONFIG.grid} />
              <XAxis
                dataKey="date"
                {...CHART_CONFIG.axis}
                tickFormatter={(date) => {
                  const d = new Date(date);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis {...CHART_CONFIG.axis} />
              <Tooltip
                {...CHART_CONFIG.tooltip}
                labelFormatter={(label) => {
                  const d = new Date(label);
                  return d.toLocaleDateString();
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="active"
                name="Active Waitlist"
                stroke={CHART_COLORS.info}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="filled"
                name="Slots Filled"
                stroke={CHART_COLORS.success}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="conversion"
                name="Conversions"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ChartWrapper>
        </div>
      )}

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-white shadow-sm p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Slot Utilization</div>
          <div className="text-2xl font-bold text-[#434E54] mb-1">
            {formatPercentage(metrics.fillRate.percentage)}
          </div>
          <p className="text-xs text-gray-500">
            Waitlist is helping fill {formatPercentage(metrics.fillRate.percentage)} of otherwise empty slots
          </p>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-white shadow-sm p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Customer Engagement</div>
          <div className="text-2xl font-bold text-[#434E54] mb-1">
            {formatPercentage(metrics.responseRate.percentage)}
          </div>
          <p className="text-xs text-gray-500">
            Customers are responding to slot offers within the waitlist period
          </p>
        </div>

        <div className="card bg-gradient-to-br from-teal-50 to-white shadow-sm p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Booking Success</div>
          <div className="text-2xl font-bold text-[#434E54] mb-1">
            {formatPercentage(metrics.conversionRate.percentage)}
          </div>
          <p className="text-xs text-gray-500">
            Waitlist entries converting to confirmed bookings
          </p>
        </div>
      </div>
    </div>
  );
}
