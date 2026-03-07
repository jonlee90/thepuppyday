/**
 * Pet Size Chart Component
 * Donut chart for size distribution and bar chart for revenue by size
 */

'use client';

import { useEffect, useState } from 'react';
import { Dog, DollarSign } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartWrapper } from './charts/ChartWrapper';
import {
  CHART_COLORS,
  CHART_PALETTE,
  CHART_CONFIG,
  formatNumber,
  formatCurrency,
  formatPercentage,
} from './charts/index';

interface PetSizeChartProps {
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface PetSizeData {
  sizes: {
    size: string;
    count: number;
    percentage: number;
    revenue: number;
  }[];
}

const SIZE_COLORS = [
  CHART_COLORS.info,     // Small - blue
  CHART_COLORS.success,  // Medium - green
  CHART_COLORS.warning,  // Large - amber
  CHART_COLORS.primary,  // X-Large - charcoal
];

export function PetSizeChart({ dateRange }: PetSizeChartProps) {
  const [data, setData] = useState<PetSizeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPetSizes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/admin/analytics/charts/pet-sizes?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch pet size data');
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        console.error('Error fetching pet sizes:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPetSizes();
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

  if (!data || data.sizes.length === 0) {
    return (
      <div className="card bg-white shadow-sm p-6">
        <p className="text-gray-500">No pet size data available for this period.</p>
      </div>
    );
  }

  // Prepare pie data
  const pieData = data.sizes.map((s, i) => ({
    ...s,
    name: s.size,
    fill: SIZE_COLORS[i] || CHART_PALETTE[i % CHART_PALETTE.length],
  }));

  // Short labels for bar chart x-axis
  const barData = data.sizes.map((s, i) => ({
    ...s,
    shortLabel: s.size.split(' ')[0], // "Small", "Medium", etc.
    fill: SIZE_COLORS[i] || CHART_PALETTE[i % CHART_PALETTE.length],
  }));

  const totalCount = data.sizes.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart - Size Distribution */}
        <div className="card bg-white shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Dog className="w-5 h-5 text-[#434E54]" />
            <h3 className="text-lg font-semibold text-[#434E54]">Size Distribution</h3>
          </div>

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
                      (value / totalCount) * 100
                    )})`,
                    name,
                  ]}
                />
              </PieChart>
            </ChartWrapper>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 mt-4 w-full max-w-sm">
              {data.sizes.map((size, i) => (
                <div key={size.size} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        SIZE_COLORS[i] || CHART_PALETTE[i % CHART_PALETTE.length],
                    }}
                  />
                  <div className="text-sm text-gray-600 truncate">{size.size}</div>
                  <div className="text-sm font-medium text-[#434E54] ml-auto">
                    {formatNumber(size.count)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart - Revenue by Size */}
        <div className="card bg-white shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-[#434E54]" />
            <h3 className="text-lg font-semibold text-[#434E54]">Revenue by Size</h3>
          </div>

          <ChartWrapper height={300}>
            <BarChart data={barData} margin={CHART_CONFIG.margin}>
              <CartesianGrid {...CHART_CONFIG.grid} />
              <XAxis dataKey="shortLabel" {...CHART_CONFIG.axis} />
              <YAxis {...CHART_CONFIG.axis} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip
                contentStyle={CHART_CONFIG.tooltip.contentStyle}
                labelStyle={CHART_CONFIG.tooltip.labelStyle}
                itemStyle={CHART_CONFIG.tooltip.itemStyle}
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                labelFormatter={(label) => {
                  const match = data.sizes.find((s) => s.size.startsWith(label as string));
                  return match ? match.size : label;
                }}
              />
              <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartWrapper>
        </div>
      </div>
    </div>
  );
}
