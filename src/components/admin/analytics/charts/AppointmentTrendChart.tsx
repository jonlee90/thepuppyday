/**
 * Appointment Trend Chart Component
 * Task 0051: Line chart showing appointment trends
 */

'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartWrapper } from './ChartWrapper';
import { CHART_COLORS, CHART_CONFIG, formatNumber } from './index';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AppointmentTrendChartProps {
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface ChartDataPoint {
  date: string;
  current: number;
  previous: number;
}

interface TrendData {
  data: ChartDataPoint[];
  granularity: 'daily' | 'weekly' | 'monthly';
  trend: 'up' | 'down' | 'flat';
  change: number;
}

export function AppointmentTrendChart({ dateRange }: AppointmentTrendChartProps) {
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/admin/analytics/charts/appointments-trend?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch appointment trend data');
        }

        const result = await response.json();
        setTrendData(result.data);
      } catch (err) {
        console.error('Error fetching trend data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chart');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendData();
  }, [dateRange]);

  const getTrendIndicator = () => {
    if (!trendData) return null;

    if (trendData.trend === 'up') {
      return {
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'text-green-600',
        label: `+${trendData.change.toFixed(1)}%`,
      };
    } else if (trendData.trend === 'down') {
      return {
        icon: <TrendingDown className="w-5 h-5" />,
        color: 'text-red-600',
        label: `${trendData.change.toFixed(1)}%`,
      };
    } else {
      return {
        icon: <Minus className="w-5 h-5" />,
        color: 'text-gray-600',
        label: '0%',
      };
    }
  };

  const indicator = getTrendIndicator();

  return (
    <div className="space-y-4">
      {/* Trend Indicator */}
      {indicator && !isLoading && !error && (
        <div className="flex items-center gap-2">
          <span className={indicator.color}>{indicator.icon}</span>
          <span className={`font-semibold ${indicator.color}`}>{indicator.label}</span>
          <span className="text-sm text-gray-600">vs previous period</span>
        </div>
      )}

      {/* Chart */}
      <ChartWrapper height={350} isLoading={isLoading} error={error}>
        {trendData && (
          <LineChart data={trendData.data} margin={CHART_CONFIG.margin}>
            <CartesianGrid {...CHART_CONFIG.grid} />
            <XAxis dataKey="date" {...CHART_CONFIG.axis} />
            <YAxis {...CHART_CONFIG.axis} tickFormatter={formatNumber} />
            <Tooltip
              {...CHART_CONFIG.tooltip}
              formatter={(value: number) => formatNumber(value)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="current"
              name="Current Period"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.primary }}
            />
            <Line
              type="monotone"
              dataKey="previous"
              name="Previous Period"
              stroke={CHART_COLORS.secondary}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: CHART_COLORS.secondary }}
            />
          </LineChart>
        )}
      </ChartWrapper>
    </div>
  );
}
