/**
 * Revenue Chart Component
 * Task 0052: Stacked bar chart showing revenue breakdown
 */

'use client';

import { useEffect, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartWrapper } from './ChartWrapper';
import { CHART_COLORS, CHART_CONFIG, formatCurrency } from './index';

interface RevenueChartProps {
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface RevenueDataPoint {
  period: string;
  services: number;
  addons: number;
  memberships: number;
  avgBookingValue: number;
}

export function RevenueChart({ dateRange }: RevenueChartProps) {
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenueData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/admin/analytics/charts/revenue?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch revenue data');
        }

        const result = await response.json();
        setRevenueData(result.data);
      } catch (err) {
        console.error('Error fetching revenue data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chart');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevenueData();
  }, [dateRange]);

  return (
    <ChartWrapper height={400} isLoading={isLoading} error={error}>
      <ComposedChart data={revenueData} margin={CHART_CONFIG.margin}>
        <CartesianGrid {...CHART_CONFIG.grid} />
        <XAxis dataKey="period" {...CHART_CONFIG.axis} />
        <YAxis
          yAxisId="left"
          {...CHART_CONFIG.axis}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          {...CHART_CONFIG.axis}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip
          {...CHART_CONFIG.tooltip}
          formatter={(value: number, name: string) => {
            const labels: Record<string, string> = {
              services: 'Services',
              addons: 'Add-ons',
              memberships: 'Memberships',
              avgBookingValue: 'Avg Booking',
            };
            return [formatCurrency(value), labels[name] || name];
          }}
        />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="services"
          stackId="revenue"
          fill={CHART_COLORS.primary}
          name="Services"
        />
        <Bar
          yAxisId="left"
          dataKey="addons"
          stackId="revenue"
          fill={CHART_COLORS.info}
          name="Add-ons"
        />
        <Bar
          yAxisId="left"
          dataKey="memberships"
          stackId="revenue"
          fill={CHART_COLORS.success}
          name="Memberships"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="avgBookingValue"
          stroke={CHART_COLORS.warning}
          strokeWidth={2}
          dot={{ fill: CHART_COLORS.warning, r: 4 }}
          name="Avg Booking"
        />
      </ComposedChart>
    </ChartWrapper>
  );
}
