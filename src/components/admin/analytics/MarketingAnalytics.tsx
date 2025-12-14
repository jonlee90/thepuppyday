/**
 * Marketing Analytics Component
 * Task 0060: Marketing campaign and reminder performance metrics
 */

'use client';

import { useEffect, useState } from 'react';
import { Send, MousePointerClick, Calendar, DollarSign, Target } from 'lucide-react';
import { ChartWrapper } from './charts/ChartWrapper';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, Line } from 'recharts';
import { CHART_COLORS, CHART_CONFIG, formatCurrency, formatNumber, formatPercentage } from './charts/index';

interface MarketingAnalyticsProps {
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface MarketingMetrics {
  remindersSent: {
    count: number;
    sms: number;
    email: number;
  };
  clickThroughRate: {
    clicks: number;
    sent: number;
    percentage: number;
  };
  bookingConversion: {
    bookings: number;
    clicks: number;
    percentage: number;
  };
  revenue: {
    total: number;
    fromReminders: number;
    percentage: number;
  };
  costPerAcquisition: {
    totalCost: number;
    totalBookings: number;
    cpa: number;
  };
  byChannel: {
    channel: string;
    sent: number;
    clicks: number;
    bookings: number;
    revenue: number;
    cost: number;
  }[];
}

export function MarketingAnalytics({ dateRange }: MarketingAnalyticsProps) {
  const [metrics, setMetrics] = useState<MarketingMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketingMetrics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/admin/analytics/marketing?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch marketing metrics');
        }

        const result = await response.json();
        setMetrics(result.data);
      } catch (err) {
        console.error('Error fetching marketing metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketingMetrics();
  }, [dateRange]);

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
        <p className="text-gray-500">No marketing data available for this period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Reminders Sent */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Reminders Sent</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatNumber(metrics.remindersSent.count)}
          </div>
          <div className="text-sm text-gray-500">
            {formatNumber(metrics.remindersSent.sms)} SMS, {formatNumber(metrics.remindersSent.email)} Email
          </div>
        </div>

        {/* Click-Through Rate */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-100 rounded-lg">
              <MousePointerClick className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Click-Through</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatPercentage(metrics.clickThroughRate.percentage)}
          </div>
          <div className="text-sm text-gray-500">
            {formatNumber(metrics.clickThroughRate.clicks)} clicks
          </div>
        </div>

        {/* Booking Conversion */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Conversion</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatPercentage(metrics.bookingConversion.percentage)}
          </div>
          <div className="text-sm text-gray-500">
            {formatNumber(metrics.bookingConversion.bookings)} bookings
          </div>
        </div>

        {/* Revenue from Reminders */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-yellow-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Revenue</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatCurrency(metrics.revenue.fromReminders)}
          </div>
          <div className="text-sm text-gray-500">
            {formatPercentage(metrics.revenue.percentage)} of total
          </div>
        </div>

        {/* Cost Per Acquisition */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-orange-100 rounded-lg">
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">CPA</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatCurrency(metrics.costPerAcquisition.cpa)}
          </div>
          <div className="text-sm text-gray-500">
            Cost: {formatCurrency(metrics.costPerAcquisition.totalCost)}
          </div>
        </div>
      </div>

      {/* Channel Performance Chart */}
      {metrics.byChannel && metrics.byChannel.length > 0 && (
        <div className="card bg-white shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[#434E54]" />
            <h3 className="text-lg font-bold text-[#434E54]">Channel Performance</h3>
          </div>

          <ChartWrapper height={350}>
            <ComposedChart data={metrics.byChannel} margin={CHART_CONFIG.margin}>
              <CartesianGrid {...CHART_CONFIG.grid} />
              <XAxis dataKey="channel" {...CHART_CONFIG.axis} />
              <YAxis yAxisId="left" {...CHART_CONFIG.axis} />
              <YAxis yAxisId="right" orientation="right" {...CHART_CONFIG.axis} />
              <Tooltip
                {...CHART_CONFIG.tooltip}
                formatter={(value: number, name: string) => {
                  if (name === 'Revenue' || name === 'Cost') return formatCurrency(value);
                  return formatNumber(value);
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="sent" name="Sent" fill={CHART_COLORS.info} radius={[8, 8, 0, 0]} />
              <Bar yAxisId="left" dataKey="clicks" name="Clicks" fill={CHART_COLORS.purple} radius={[8, 8, 0, 0]} />
              <Bar yAxisId="left" dataKey="bookings" name="Bookings" fill={CHART_COLORS.success} radius={[8, 8, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ChartWrapper>
        </div>
      )}

      {/* Channel Breakdown Table */}
      {metrics.byChannel && metrics.byChannel.length > 0 && (
        <div className="card bg-white shadow-md p-6">
          <h3 className="text-lg font-bold text-[#434E54] mb-4">Channel Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Sent</th>
                  <th>CTR</th>
                  <th>Bookings</th>
                  <th>Conv Rate</th>
                  <th>Revenue</th>
                  <th>Cost</th>
                  <th>ROI</th>
                </tr>
              </thead>
              <tbody>
                {metrics.byChannel.map((channel, index) => {
                  const ctr = channel.sent > 0 ? (channel.clicks / channel.sent) * 100 : 0;
                  const convRate = channel.clicks > 0 ? (channel.bookings / channel.clicks) * 100 : 0;
                  const roi = channel.cost > 0 ? ((channel.revenue - channel.cost) / channel.cost) * 100 : 0;

                  return (
                    <tr key={index}>
                      <td className="font-medium">{channel.channel}</td>
                      <td>{formatNumber(channel.sent)}</td>
                      <td>{formatPercentage(ctr)}</td>
                      <td>{formatNumber(channel.bookings)}</td>
                      <td>{formatPercentage(convRate)}</td>
                      <td>{formatCurrency(channel.revenue)}</td>
                      <td>{formatCurrency(channel.cost)}</td>
                      <td>
                        <span
                          className={`font-semibold ${
                            roi > 0 ? 'text-green-600' : roi < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}
                        >
                          {formatPercentage(roi)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Marketing Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-purple-50 to-white shadow-sm p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Engagement Quality</div>
          <div className="text-2xl font-bold text-[#434E54] mb-1">
            {formatPercentage(metrics.clickThroughRate.percentage)}
          </div>
          <p className="text-xs text-gray-500">
            Recipients are engaging with {formatPercentage(metrics.clickThroughRate.percentage)} of reminders sent
          </p>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-white shadow-sm p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Booking Efficiency</div>
          <div className="text-2xl font-bold text-[#434E54] mb-1">
            {formatPercentage(metrics.bookingConversion.percentage)}
          </div>
          <p className="text-xs text-gray-500">
            Clicks converting to actual bookings, showing strong intent
          </p>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-white shadow-sm p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">Cost Efficiency</div>
          <div className="text-2xl font-bold text-[#434E54] mb-1">
            {formatCurrency(metrics.costPerAcquisition.cpa)}
          </div>
          <p className="text-xs text-gray-500">
            Average cost to acquire each booking through marketing
          </p>
        </div>
      </div>
    </div>
  );
}
