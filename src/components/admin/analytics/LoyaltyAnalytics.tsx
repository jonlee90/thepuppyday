/**
 * Loyalty Analytics Component
 * Punch card program metrics, distribution, trends, and top customers
 */

'use client';

import { useEffect, useState } from 'react';
import { Award, Stamp, Gift, TrendingUp, Crown } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartWrapper } from './charts/ChartWrapper';
import { CHART_COLORS, CHART_CONFIG, formatNumber, formatPercentage } from './charts/index';

interface LoyaltyAnalyticsProps {
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface LoyaltyMetrics {
  activePrograms: number;
  totalPunchesEarned: number;
  totalRedemptions: number;
  redemptionRate: number;
  punchDistribution: { punches: number; count: number }[];
  trends: { date: string; punches: number; redemptions: number }[];
  topCustomers: { name: string; punches: number; redemptions: number }[];
}

export function LoyaltyAnalytics({ dateRange }: LoyaltyAnalyticsProps) {
  const [metrics, setMetrics] = useState<LoyaltyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoyaltyMetrics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/admin/analytics/loyalty?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch loyalty metrics');
        }

        const result = await response.json();
        setMetrics(result.data);
      } catch (err) {
        console.error('Error fetching loyalty metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoyaltyMetrics();
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card bg-gray-100 shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-300 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-300 rounded w-1/3" />
            </div>
          ))}
        </div>
        {/* Skeleton for charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card bg-gray-100 shadow-sm p-6 animate-pulse">
            <div className="h-64 bg-gray-300 rounded" />
          </div>
          <div className="card bg-gray-100 shadow-sm p-6 animate-pulse">
            <div className="h-64 bg-gray-300 rounded" />
          </div>
        </div>
        {/* Skeleton for table */}
        <div className="card bg-gray-100 shadow-sm p-6 animate-pulse">
          <div className="h-48 bg-gray-300 rounded" />
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
        <p className="text-gray-500">No loyalty data available for this period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Programs */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Active Programs</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatNumber(metrics.activePrograms)}
          </div>
          <div className="text-sm text-gray-500">Customers with punch cards</div>
        </div>

        {/* Punches Earned */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <Stamp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Punches Earned</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatNumber(metrics.totalPunchesEarned)}
          </div>
          <div className="text-sm text-gray-500">Total punches this period</div>
        </div>

        {/* Free Washes Redeemed */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-100 rounded-lg">
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Free Washes Redeemed</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatNumber(metrics.totalRedemptions)}
          </div>
          <div className="text-sm text-gray-500">Rewards claimed</div>
        </div>

        {/* Redemption Rate */}
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-teal-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Redemption Rate</div>
          </div>
          <div className="text-3xl font-bold text-[#434E54] mb-1">
            {formatPercentage(metrics.redemptionRate)}
          </div>
          <div className="text-sm text-gray-500">Punches leading to rewards</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Punch Distribution */}
        <div className="card bg-white shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Stamp className="w-5 h-5 text-[#434E54]" />
            <h3 className="text-lg font-semibold text-[#434E54]">Punch Distribution</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Number of customers at each punch count
          </p>

          <ChartWrapper height={280}>
            <BarChart data={metrics.punchDistribution} margin={CHART_CONFIG.margin}>
              <CartesianGrid {...CHART_CONFIG.grid} />
              <XAxis
                dataKey="punches"
                {...CHART_CONFIG.axis}
                label={{ value: 'Punches', position: 'insideBottom', offset: -5, fill: '#6B7280' }}
              />
              <YAxis
                {...CHART_CONFIG.axis}
                label={{ value: 'Customers', angle: -90, position: 'insideLeft', fill: '#6B7280' }}
              />
              <Tooltip
                contentStyle={CHART_CONFIG.tooltip.contentStyle}
                labelStyle={CHART_CONFIG.tooltip.labelStyle}
                itemStyle={CHART_CONFIG.tooltip.itemStyle}
                formatter={(value: number) => [formatNumber(value), 'Customers']}
                labelFormatter={(label) => `${label} Punches`}
              />
              <Bar
                dataKey="count"
                fill={CHART_COLORS.primary}
                radius={[4, 4, 0, 0]}
                name="Customers"
              />
            </BarChart>
          </ChartWrapper>
        </div>

        {/* Trends Over Time */}
        <div className="card bg-white shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#434E54]" />
            <h3 className="text-lg font-semibold text-[#434E54]">Loyalty Trends</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Punches earned vs rewards redeemed over time
          </p>

          {metrics.trends.length > 0 ? (
            <ChartWrapper height={280}>
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
                  contentStyle={CHART_CONFIG.tooltip.contentStyle}
                  labelStyle={CHART_CONFIG.tooltip.labelStyle}
                  itemStyle={CHART_CONFIG.tooltip.itemStyle}
                  labelFormatter={(label) => {
                    const d = new Date(label);
                    return d.toLocaleDateString();
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="punches"
                  name="Punches Earned"
                  stroke={CHART_COLORS.success}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="redemptions"
                  name="Redemptions"
                  stroke={CHART_COLORS.purple}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartWrapper>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              No trend data available
            </div>
          )}
        </div>
      </div>

      {/* Top Loyal Customers */}
      {metrics.topCustomers.length > 0 && (
        <div className="card bg-white shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-[#434E54]" />
            <h3 className="text-lg font-semibold text-[#434E54]">Top Loyal Customers</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-gray-600 font-medium">Rank</th>
                  <th className="text-gray-600 font-medium">Customer</th>
                  <th className="text-gray-600 font-medium text-right">Punches</th>
                  <th className="text-gray-600 font-medium text-right">Redemptions</th>
                  <th className="text-gray-600 font-medium">Progress</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topCustomers.map((customer, index) => (
                  <tr key={customer.name} className="border-b border-gray-100 hover:bg-gray-50">
                    <td>
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#EAE0D5] text-[#434E54] text-sm font-medium">
                        {index + 1}
                      </div>
                    </td>
                    <td className="font-medium text-[#434E54]">{customer.name}</td>
                    <td className="text-right text-[#434E54]">
                      {formatNumber(customer.punches)}
                    </td>
                    <td className="text-right text-[#434E54]">
                      {formatNumber(customer.redemptions)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#434E54] rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((customer.punches % 10) * 10, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {customer.punches % 10}/10
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
