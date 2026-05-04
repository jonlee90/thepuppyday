/**
 * Breed Visit Frequency Chart
 * Grouped horizontal bar — actual avg weeks vs grooming_frequency_weeks benchmark.
 * Color coded: green=on-cadence, amber=overdue, blue=frequent, red=very overdue.
 */

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import type { BreedMetric } from '@/lib/analytics/breed-aggregation';
import { ChartWrapper } from './ChartWrapper';
import { CHART_CONFIG } from './index';

interface BreedFrequencyChartProps {
  data: BreedMetric[];
  height?: number;
}

const COLOR_ON_CADENCE = '#10b981';
const COLOR_OVERDUE = '#f59e0b';
const COLOR_VERY_OVERDUE = '#ef4444';
const COLOR_FREQUENT = '#3b82f6';
const COLOR_BENCHMARK = '#9CA3AF';

function actualColor(gap: number | null): string {
  if (gap == null) return COLOR_ON_CADENCE;
  if (gap > 4) return COLOR_VERY_OVERDUE;
  if (gap > 1) return COLOR_OVERDUE;
  if (gap < -1) return COLOR_FREQUENT;
  return COLOR_ON_CADENCE;
}

function gapLabel(gap: number | null): string {
  if (gap == null) return '—';
  if (gap > 0) return `+${gap.toFixed(1)}w overdue`;
  if (gap < 0) return `${gap.toFixed(1)}w frequent`;
  return 'On cadence';
}

interface TooltipPayload {
  payload: BreedMetric;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const m = payload[0].payload;
  return (
    <div style={CHART_CONFIG.tooltip.contentStyle}>
      <div style={CHART_CONFIG.tooltip.labelStyle}>{m.label}</div>
      <div style={{ ...CHART_CONFIG.tooltip.itemStyle, fontSize: 13 }}>
        Actual: <strong style={{ color: actualColor(m.cadenceGap) }}>{m.avgVisitWeeks?.toFixed(1)}w</strong>
      </div>
      <div style={{ ...CHART_CONFIG.tooltip.itemStyle, fontSize: 13 }}>
        Benchmark: <strong style={{ color: '#434E54' }}>{m.benchmarkWeeks}w</strong>
      </div>
      <div style={{ ...CHART_CONFIG.tooltip.itemStyle, fontSize: 12 }}>
        {gapLabel(m.cadenceGap)} · {m.customerCount} customers
      </div>
    </div>
  );
}

export function BreedFrequencyChart({ data, height = 360 }: BreedFrequencyChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-6" style={{ height }}>
        <p className="text-gray-500 text-sm">Insufficient data</p>
        <p className="text-gray-400 text-xs mt-1">Need breeds with a benchmark and ≥2 rebooking pets</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ChartWrapper height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          barCategoryGap="20%"
        >
          <CartesianGrid {...CHART_CONFIG.grid} horizontal={false} />
          <XAxis
            type="number"
            {...CHART_CONFIG.axis}
            tickFormatter={(v) => `${v}w`}
          />
          <YAxis
            type="category"
            dataKey="label"
            {...CHART_CONFIG.axis}
            width={140}
            tick={{ ...CHART_CONFIG.axis.tick, fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="avgVisitWeeks" name="Actual avg" radius={[0, 6, 6, 0]}>
            {data.map((entry, i) => (
              <Cell key={`actual-${i}`} fill={actualColor(entry.cadenceGap)} />
            ))}
          </Bar>
          <Bar dataKey="benchmarkWeeks" name="Benchmark" radius={[0, 6, 6, 0]} fill={COLOR_BENCHMARK} />
        </BarChart>
      </ChartWrapper>

      <div className="flex flex-wrap gap-3 text-xs text-gray-600 pt-1 border-t border-gray-100">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: COLOR_ON_CADENCE }} />
          On cadence (±1w)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: COLOR_OVERDUE }} />
          Overdue (1–4w)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: COLOR_VERY_OVERDUE }} />
          Very overdue (4w+)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: COLOR_FREQUENT }} />
          Frequent
        </span>
      </div>
    </div>
  );
}
