/**
 * Breed Analytics Widget
 * Dashboard widget with 3 tabs: Top Revenue, Avg Booking Value, Visit Frequency.
 * Calls /api/admin/analytics/breeds?mode=dashboard.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Award, DollarSign, Calendar } from 'lucide-react';
import type { BreedMetric } from '@/lib/analytics/breed-aggregation';
import { BreedRevenueChart } from './charts/BreedRevenueChart';
import { BreedFrequencyChart } from './charts/BreedFrequencyChart';

interface BreedAnalyticsProps {
  dateRange: { start: Date; end: Date };
}

interface DashboardResponse {
  mode: 'dashboard';
  topRevenue: BreedMetric[];
  avgBookingValue: BreedMetric[];
  visitFrequency: BreedMetric[];
  meta: { totalBreeds: number; totalAppointments: number; customBreedCount: number };
}

type Tab = 'revenue' | 'abv' | 'frequency';

const TABS: Array<{ key: Tab; label: string; icon: typeof Award }> = [
  { key: 'revenue', label: 'Top Revenue', icon: Award },
  { key: 'abv', label: 'Avg Booking Value', icon: DollarSign },
  { key: 'frequency', label: 'Visit Frequency', icon: Calendar },
];

export function BreedAnalytics({ dateRange }: BreedAnalyticsProps) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [tab, setTab] = useState<Tab>('revenue');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
          mode: 'dashboard',
        });
        const res = await fetch(`/api/admin/analytics/breeds?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as DashboardResponse;
        setData(body);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[BreedAnalytics] fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-4">
        <p className="text-red-700 text-sm">Failed to load breed analytics: {error}</p>
      </div>
    );
  }

  if (!data || data.meta.totalAppointments === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <span aria-hidden className="text-3xl mb-2">🐾</span>
        <p className="text-sm">No completed appointments in selected range</p>
      </div>
    );
  }

  const tabData =
    tab === 'revenue' ? data.topRevenue : tab === 'abv' ? data.avgBookingValue : data.visitFrequency;
  const visibleCount = tabData.filter((m) => !m.isOther).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div role="tablist" className="tabs tabs-boxed bg-[#F8EEE5] inline-flex">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`tab gap-2 ${tab === key ? 'tab-active bg-[#434E54] text-white' : 'text-[#434E54]'}`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
        <Link
          href="/admin/analytics/breeds"
          className="text-sm text-[#434E54] hover:text-[#D4A574] font-medium inline-flex items-center gap-1 transition-colors"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {tab === 'frequency' ? (
        <BreedFrequencyChart data={data.visitFrequency} />
      ) : (
        <BreedRevenueChart data={tabData} metric={tab} />
      )}

      <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
        Showing {visibleCount} of {data.meta.totalBreeds} breeds · {data.meta.totalAppointments.toLocaleString()} appts
        {data.meta.customBreedCount > 0 && ` · ${data.meta.customBreedCount} custom`}
      </p>
    </div>
  );
}
