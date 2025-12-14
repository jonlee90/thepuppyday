/**
 * Retention Chart Component
 * Task 0054: Line chart showing customer retention rate over time
 */

'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartWrapper } from './ChartWrapper';
import { CHART_COLORS, CHART_CONFIG, formatPercentage } from './index';

interface RetentionChartProps {
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface RetentionDataPoint {
  period: string;
  rate: number;
}

interface RetentionMetrics {
  retentionData: RetentionDataPoint[];
  lifetimeValue: number;
  churnRate: number;
}

export function RetentionChart({ dateRange }: RetentionChartProps) {
  const [metrics, setMetrics] = useState<RetentionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRetentionData = async () => {
      setIsLoading(true);
      setError(null);

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
        setMetrics(result.data.retentionMetrics);
      } catch (err) {
        console.error('Error fetching retention data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chart');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRetentionData();
  }, [dateRange]);

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
