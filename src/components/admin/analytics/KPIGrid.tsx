/**
 * KPI Grid Component
 * Task 0050: Display grid of KPI metrics
 */

'use client';

import { useEffect, useState } from 'react';
import { KPICard, KPIData } from './KPICard';

interface KPIGridProps {
  dateRange: {
    start: Date;
    end: Date;
  };
}

interface KPIResponse {
  total_revenue: KPIData;
  total_appointments: KPIData;
  avg_booking_value: KPIData;
  retention_rate: KPIData;
  review_generation_rate: KPIData;
  waitlist_fill_rate: KPIData;
}

export function KPIGrid({ dateRange }: KPIGridProps) {
  const [kpis, setKpis] = useState<KPIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });

        const response = await fetch(`/api/admin/analytics/kpis?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch KPIs');
        }

        const data = await response.json();
        setKpis(data.data);
      } catch (err) {
        console.error('Error fetching KPIs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load KPIs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchKPIs();
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card bg-gray-100 shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-gray-300 rounded w-1/3"></div>
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

  if (!kpis) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <KPICard data={kpis.total_revenue} />
      <KPICard data={kpis.total_appointments} />
      <KPICard data={kpis.avg_booking_value} />
      <KPICard data={kpis.retention_rate} />
      <KPICard data={kpis.review_generation_rate} />
      <KPICard data={kpis.waitlist_fill_rate} />
    </div>
  );
}
