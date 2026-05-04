/**
 * Breed Revenue / ABV Chart
 * Horizontal bar chart used by Top Revenue and Avg Booking Value tabs.
 */

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import type { BreedMetric } from '@/lib/analytics/breed-aggregation';
import { ChartWrapper } from './ChartWrapper';
import {
  CHART_COLORS,
  CHART_CONFIG,
  formatCurrency,
  formatNumber,
} from './index';

interface BreedRevenueChartProps {
  data: BreedMetric[];
  metric: 'revenue' | 'abv';
  height?: number;
}

const COLOR_KNOWN = CHART_COLORS.primary;
const COLOR_CUSTOM = CHART_COLORS.purple;
const COLOR_OTHER = '#9CA3AF';

function colorFor(m: BreedMetric): string {
  if (m.isOther) return COLOR_OTHER;
  if (m.isCustom) return COLOR_CUSTOM;
  return COLOR_KNOWN;
}

interface TooltipPayload {
  payload: BreedMetric & { value: number };
}

function CustomTooltip({ active, payload, metric }: { active?: boolean; payload?: TooltipPayload[]; metric: 'revenue' | 'abv' }) {
  if (!active || !payload?.length) return null;
  const m = payload[0].payload;
  return (
    <div style={CHART_CONFIG.tooltip.contentStyle}>
      <div style={CHART_CONFIG.tooltip.labelStyle}>
        {m.label}
        {m.isCustom && <span className="ml-1 text-xs text-purple-500">(custom)</span>}
      </div>
      <div style={{ ...CHART_CONFIG.tooltip.itemStyle, fontSize: 13 }}>
        {metric === 'revenue' ? 'Revenue: ' : 'Avg booking: '}
        <strong style={{ color: '#434E54' }}>{formatCurrency(m.value)}</strong>
      </div>
      <div style={{ ...CHART_CONFIG.tooltip.itemStyle, fontSize: 12 }}>
        {formatNumber(m.appointmentCount)} appts · {formatNumber(m.customerCount)} customers
      </div>
    </div>
  );
}

export function BreedRevenueChart({ data, metric, height = 360 }: BreedRevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg" style={{ height }}>
        <p className="text-gray-500 text-sm">No breed data for this range</p>
      </div>
    );
  }

  const valueKey = metric === 'revenue' ? 'totalRevenue' : 'avgBookingValue';
  const chartData = data.map((m) => ({ ...m, value: m[valueKey] as number }));

  return (
    <ChartWrapper height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid {...CHART_CONFIG.grid} horizontal={false} />
        <XAxis
          type="number"
          {...CHART_CONFIG.axis}
          tickFormatter={(v) => formatCurrency(v)}
        />
        <YAxis
          type="category"
          dataKey="label"
          {...CHART_CONFIG.axis}
          width={140}
          tick={{ ...CHART_CONFIG.axis.tick, fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip metric={metric} />} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={colorFor(entry)} />
          ))}
        </Bar>
      </BarChart>
    </ChartWrapper>
  );
}
