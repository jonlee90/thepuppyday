/**
 * Operational Metrics Chart Component
 * Task 0055: Display operational KPIs
 */

'use client';

import { useEffect, useState } from 'react';
import { ChartWrapper } from './ChartWrapper';

interface OperationalMetricsChartProps {
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface OperationalMetrics {
  addonAttachmentRate: number;
  cancellationRate: number;
  noShowRate: number;
  avgAppointmentDuration: number; // in minutes
  groomerProductivity: number; // appointments per day
}

export function OperationalMetricsChart({ dateRange }: OperationalMetricsChartProps) {
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/admin/analytics/charts/operations?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch operational metrics');
        }

        const result = await response.json();
        setMetrics(result.data);
      } catch (err) {
        console.error('Error fetching operational metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card bg-gray-100 shadow-sm p-4 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
          </div>
        ))}
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

  if (!metrics) {
    return null;
  }

  const metricCards = [
    {
      label: 'Add-on Attachment Rate',
      value: `${metrics.addonAttachmentRate.toFixed(1)}%`,
      progress: metrics.addonAttachmentRate,
      color: 'bg-blue-500',
    },
    {
      label: 'Cancellation Rate',
      value: `${metrics.cancellationRate.toFixed(1)}%`,
      progress: metrics.cancellationRate,
      color: 'bg-yellow-500',
    },
    {
      label: 'No-Show Rate',
      value: `${metrics.noShowRate.toFixed(1)}%`,
      progress: metrics.noShowRate,
      color: 'bg-red-500',
    },
    {
      label: 'Avg Appointment Duration',
      value: `${Math.round(metrics.avgAppointmentDuration)} min`,
      progress: Math.min((metrics.avgAppointmentDuration / 120) * 100, 100), // Normalize to 2 hours
      color: 'bg-green-500',
    },
    {
      label: 'Groomer Productivity',
      value: `${metrics.groomerProductivity.toFixed(1)} appts/day`,
      progress: Math.min((metrics.groomerProductivity / 10) * 100, 100), // Normalize to 10 per day
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metricCards.map((metric, index) => (
        <div key={index} className="card bg-white border border-gray-200 shadow-sm p-6">
          <div className="text-sm font-medium text-gray-600 mb-2">{metric.label}</div>
          <div className="text-3xl font-bold text-[#434E54] mb-4">{metric.value}</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${metric.color} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${metric.progress}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}
