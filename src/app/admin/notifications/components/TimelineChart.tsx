'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { TimelineDataPoint } from '@/types/notifications-dashboard';

interface TimelineChartProps {
  data: TimelineDataPoint[];
}

export function TimelineChart({ data }: TimelineChartProps) {
  // Format data for Recharts
  const chartData = data.map((point) => ({
    date: format(parseISO(point.date), 'MMM dd'),
    fullDate: point.date,
    Sent: point.sent,
    Delivered: point.delivered,
    Failed: point.failed,
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#434E54]">Timeline</h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Notifications activity over time
        </p>
      </div>

      <div className="w-full" style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{
                color: '#434E54',
                fontWeight: 600,
                marginBottom: '8px',
              }}
              itemStyle={{
                color: '#6B7280',
                fontSize: '14px',
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px',
              }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="Sent"
              stroke="#434E54"
              strokeWidth={2}
              dot={{ fill: '#434E54', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Delivered"
              stroke="#6BCB77"
              strokeWidth={2}
              dot={{ fill: '#6BCB77', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Failed"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ fill: '#EF4444', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
