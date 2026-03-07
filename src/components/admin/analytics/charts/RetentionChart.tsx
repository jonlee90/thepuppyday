/**
 * Retention Chart Component
 * Task 0054: Line chart showing customer retention rate over time
 */

'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartWrapper } from './ChartWrapper';
import { CHART_COLORS, CHART_CONFIG, formatPercentage } from './index';

interface RetentionDataPoint {
  period: string;
  rate: number;
}

interface RetentionMetrics {
  retentionData: RetentionDataPoint[];
  lifetimeValue: number;
  churnRate: number;
}

interface RetentionChartProps {
  dateRange: {
    start: Date;
    end: Date;
  };
  retentionMetrics?: RetentionMetrics | null;
  isLoading?: boolean;
  error?: string | null;
}

export function RetentionChart({ dateRange, retentionMetrics: propMetrics, isLoading: propLoading, error: propError }: RetentionChartProps) {
  const [selfMetrics, setSelfMetrics] = useState<RetentionMetrics | null>(null);
  const [selfLoading, setSelfLoading] = useState(propMetrics === undefined);
  const [selfError, setSelfError] = useState<string | null>(null);

  const metrics = propMetrics !== undefined ? propMetrics : selfMetrics;
  const isLoading = propMetrics !== undefined ? (propLoading ?? false) : selfLoading;
  const error = propMetrics !== undefined ? (propError ?? null) : selfError;

  useEffect(() => {
    if (propMetrics !== undefined) return;

    const fetchRetentionData = async () => {
      setSelfLoading(true);
      setSelfError(null);

      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/admin/analytics/charts/customers?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch retention data');
        }

        const result = await response.json();
        setSelfMetrics(result.data.retentionMetrics);
      } catch (err) {
        console.error('Error fetching retention data:', err);
        setSelfError(err instanceof Error ? err.message : 'Failed to load chart');
      } finally {
        setSelfLoading(false);
      }
    };

    fetchRetentionData();
  }, [dateRange, propMetrics]);

  if (isLoading) {
    return <ChartWrapper height={300} isLoading={true}><div /></ChartWrapper>;
  }

  if (error) {
    return <ChartWrapper height={300} error={error}><div /></ChartWrapper>;
  }

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Lifetime Value</div>
          <div className="text-2xl font-bold text-[#434E54]">
            ${metrics?.lifetimeValue.toFixed(0) || 0}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Churn Rate</div>
          <div className="text-2xl font-bold text-red-600">
            {metrics?.churnRate.toFixed(1) || 0}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <ChartWrapper height={250}>
        {metrics && (
          <LineChart data={metrics.retentionData} margin={CHART_CONFIG.margin}>
            <CartesianGrid {...CHART_CONFIG.grid} />
            <XAxis dataKey="period" {...CHART_CONFIG.axis} />
            <YAxis {...CHART_CONFIG.axis} tickFormatter={(value) => `${value}%`} />
            <Tooltip
              {...CHART_CONFIG.tooltip}
              formatter={(value: number) => formatPercentage(value)}
            />
            <Line
              type="monotone"
              dataKey="rate"
              name="Retention Rate"
              stroke={CHART_COLORS.success}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.success }}
            />
          </LineChart>
        )}
      </ChartWrapper>
    </div>
  );
}
