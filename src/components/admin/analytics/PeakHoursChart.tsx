/**
 * Peak Hours Chart Component
 * Heatmap grid and bar chart showing busiest times
 */

'use client';

import { useEffect, useState } from 'react';
import { Clock, Calendar, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartWrapper } from './charts/ChartWrapper';
import { CHART_COLORS, CHART_CONFIG, formatNumber } from './charts/index';

interface PeakHoursChartProps {
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface PeakHoursData {
  heatmap: { day: number; hour: number; count: number }[];
  byHour: { hour: number; count: number }[];
  busiestDay: string;
  busiestHour: number;
  totalAppointments: number;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatHour(hour: number): string {
  if (hour === 0 || hour === 12) return hour === 0 ? '12 AM' : '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

/**
 * Get heatmap cell color based on intensity (0-1)
 */
function getHeatmapColor(intensity: number): string {
  if (intensity === 0) return '#F3F4F6'; // gray-100
  if (intensity < 0.2) return '#EAE0D5'; // light cream
  if (intensity < 0.4) return '#D5C8B8'; // medium cream
  if (intensity < 0.6) return '#8B9399'; // light charcoal
  if (intensity < 0.8) return '#5E6B73'; // medium charcoal
  return '#434E54'; // full charcoal
}

export function PeakHoursChart({ dateRange }: PeakHoursChartProps) {
  const [data, setData] = useState<PeakHoursData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPeakHours = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/admin/analytics/charts/peak-hours?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch peak hours data');
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        console.error('Error fetching peak hours:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPeakHours();
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card bg-gray-100 shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-300 rounded w-3/4" />
            </div>
          ))}
        </div>
        <div className="card bg-gray-100 shadow-sm p-6 animate-pulse">
          <div className="h-64 bg-gray-300 rounded" />
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

  if (!data) {
    return (
      <div className="card bg-white shadow-sm p-6">
        <p className="text-gray-500">No peak hours data available for this period.</p>
      </div>
    );
  }

  // Calculate max count for heatmap intensity
  const maxCount = Math.max(...data.heatmap.map((h) => h.count), 1);

  // Build heatmap grid: rows = days, columns = hours
  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Busiest Day</div>
          </div>
          <div className="text-2xl font-bold text-[#434E54]">{data.busiestDay}</div>
        </div>

        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Busiest Hour</div>
          </div>
          <div className="text-2xl font-bold text-[#434E54]">{formatHour(data.busiestHour)}</div>
        </div>

        <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-sm font-medium text-gray-600">Total Appointments</div>
          </div>
          <div className="text-2xl font-bold text-[#434E54]">
            {formatNumber(data.totalAppointments)}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="card bg-white shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-[#434E54]" />
          <h3 className="text-lg font-semibold text-[#434E54]">Weekly Heatmap</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Appointment density by day and hour
        </p>

        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour labels */}
            <div className="flex mb-1">
              <div className="w-12 shrink-0" />
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-xs text-gray-500 px-0.5"
                >
                  {formatHour(hour).replace(' AM', 'a').replace(' PM', 'p')}
                </div>
              ))}
            </div>

            {/* Heatmap rows */}
            {DAY_LABELS.map((dayLabel, dayIndex) => (
              <div key={dayLabel} className="flex mb-1 items-center">
                <div className="w-12 shrink-0 text-xs text-gray-600 font-medium pr-2 text-right">
                  {dayLabel}
                </div>
                {hours.map((hour) => {
                  const cell = data.heatmap.find(
                    (h) => h.day === dayIndex && h.hour === hour
                  );
                  const count = cell?.count || 0;
                  const intensity = maxCount > 0 ? count / maxCount : 0;

                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className="flex-1 aspect-square mx-0.5 rounded-sm cursor-default transition-transform hover:scale-110"
                      style={{ backgroundColor: getHeatmapColor(intensity) }}
                      title={`${dayLabel} ${formatHour(hour)}: ${count} appointments`}
                    />
                  );
                })}
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center justify-end gap-1 mt-3">
              <span className="text-xs text-gray-500 mr-1">Less</span>
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
                <div
                  key={intensity}
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: getHeatmapColor(intensity) }}
                />
              ))}
              <span className="text-xs text-gray-500 ml-1">More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments by Hour Bar Chart */}
      <div className="card bg-white shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#434E54]" />
          <h3 className="text-lg font-semibold text-[#434E54]">Appointments by Hour</h3>
        </div>

        <ChartWrapper height={280}>
          <BarChart data={data.byHour} margin={CHART_CONFIG.margin}>
            <CartesianGrid {...CHART_CONFIG.grid} />
            <XAxis
              dataKey="hour"
              {...CHART_CONFIG.axis}
              tickFormatter={(hour) => formatHour(hour)}
            />
            <YAxis {...CHART_CONFIG.axis} />
            <Tooltip
              contentStyle={CHART_CONFIG.tooltip.contentStyle}
              labelStyle={CHART_CONFIG.tooltip.labelStyle}
              itemStyle={CHART_CONFIG.tooltip.itemStyle}
              formatter={(value: number) => [formatNumber(value), 'Appointments']}
              labelFormatter={(hour) => formatHour(hour as number)}
            />
            <Bar
              dataKey="count"
              fill={CHART_COLORS.primary}
              radius={[4, 4, 0, 0]}
              name="Appointments"
            />
          </BarChart>
        </ChartWrapper>
      </div>
    </div>
  );
}
