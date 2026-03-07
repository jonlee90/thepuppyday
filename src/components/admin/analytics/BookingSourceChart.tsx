/**
 * Booking Source Chart Component
 * Donut chart and stacked area chart for booking source breakdown
 */

'use client';

import { useEffect, useState } from 'react';
import { Globe, Footprints, ShieldCheck } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartWrapper } from './charts/ChartWrapper';
import { CHART_COLORS, CHART_CONFIG, formatNumber, formatPercentage } from './charts/index';

interface BookingSourceChartProps {
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface BookingSourceData {
  sources: { source: string; count: number; percentage: number }[];
  trends: { date: string; online: number; walk_in: number; admin: number }[];
}

const SOURCE_COLORS: Record<string, string> = {
  online: CHART_COLORS.info,
  walk_in: CHART_COLORS.success,
  admin: CHART_COLORS.warning,
};

const SOURCE_LABELS: Record<string, string> = {
  online: 'Online Booking',
  walk_in: 'Walk-in',
  admin: 'Admin Created',
};

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  online: <Globe className="w-4 h-4" />,
  walk_in: <Footprints className="w-4 h-4" />,
  admin: <ShieldCheck className="w-4 h-4" />,
};

export function BookingSourceChart({ dateRange }: BookingSourceChartProps) {
  const [data, setData] = useState<BookingSourceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookingSources = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/admin/analytics/charts/booking-sources?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch booking source data');
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        console.error('Error fetching booking sources:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingSources();
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card bg-gray-100 shadow-sm p-6 animate-pulse">
            <div className="h-64 bg-gray-300 rounded" />
          </div>
          <div className="card bg-gray-100 shadow-sm p-6 animate-pulse">
            <div className="h-64 bg-gray-300 rounded" />
          </div>
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

  if (!data || data.sources.length === 0) {
    return (
      <div className="card bg-white shadow-sm p-6">
        <p className="text-gray-500">No booking source data available for this period.</p>
      </div>
    );
  }

  // Prepare pie data with labels
  const pieData = data.sources.map((s) => ({
    ...s,
    name: SOURCE_LABELS[s.source] || s.source,
    fill: SOURCE_COLORS[s.source] || CHART_COLORS.primary,
  }));

  const totalBookings = data.sources.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="card bg-white shadow-md p-6">
          <h3 className="text-lg font-semibold text-[#434E54] mb-4">Source Distribution</h3>

          <div className="flex flex-col items-center">
            <ChartWrapper height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="name"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CHART_CONFIG.tooltip.contentStyle}
                  formatter={(value: number, name: string) => [
                    `${formatNumber(value)} (${formatPercentage(
                      (value / totalBookings) * 100
                    )})`,
                    name,
                  ]}
                />
              </PieChart>
            </ChartWrapper>

            {/* Legend with icons */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {data.sources.map((source) => (
                <div key={source.source} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: SOURCE_COLORS[source.source] || CHART_COLORS.primary }}
                  />
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    {SOURCE_ICONS[source.source]}
                    <span>{SOURCE_LABELS[source.source] || source.source}</span>
                  </div>
                  <span className="text-sm font-medium text-[#434E54]">
                    {formatNumber(source.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stacked Area Chart - Trends */}
        <div className="card bg-white shadow-md p-6">
          <h3 className="text-lg font-semibold text-[#434E54] mb-4">Source Trends</h3>

          {data.trends.length > 0 ? (
            <ChartWrapper height={300}>
              <AreaChart data={data.trends} margin={CHART_CONFIG.margin}>
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
                <Area
                  type="monotone"
                  dataKey="online"
                  name="Online"
                  stackId="1"
                  stroke={CHART_COLORS.info}
                  fill={CHART_COLORS.info}
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="walk_in"
                  name="Walk-in"
                  stackId="1"
                  stroke={CHART_COLORS.success}
                  fill={CHART_COLORS.success}
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="admin"
                  name="Admin"
                  stackId="1"
                  stroke={CHART_COLORS.warning}
                  fill={CHART_COLORS.warning}
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartWrapper>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              No trend data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
