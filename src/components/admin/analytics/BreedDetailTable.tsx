/**
 * Breed Detail Table
 * Sortable table for /admin/analytics/breeds deep-dive page.
 * Drives data fetching for the page (calls API in detail mode).
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search } from 'lucide-react';
import type { BreedMetric } from '@/lib/analytics/breed-aggregation';
import { BreedRevenueChart } from './charts/BreedRevenueChart';
import { formatCurrency, formatNumber } from './charts/index';

interface BreedDetailTableProps {
  dateRange: { start: Date; end: Date };
}

type SortBy = 'revenue' | 'abv' | 'gap';

interface DetailResponse {
  mode: 'detail';
  breeds: BreedMetric[];
  meta: {
    totalBreeds: number;
    totalAppointments: number;
    customBreedCount: number;
    filteredCount?: number;
  };
}

type ClientSortKey =
  | 'label'
  | 'appointmentCount'
  | 'customerCount'
  | 'totalRevenue'
  | 'avgBookingValue'
  | 'avgVisitWeeks'
  | 'benchmarkWeeks'
  | 'cadenceGap';

const COLUMNS: Array<{ key: ClientSortKey; label: string; align: 'left' | 'right' }> = [
  { key: 'label', label: 'Breed', align: 'left' },
  { key: 'appointmentCount', label: 'Appts', align: 'right' },
  { key: 'customerCount', label: 'Customers', align: 'right' },
  { key: 'totalRevenue', label: 'Revenue', align: 'right' },
  { key: 'avgBookingValue', label: 'ABV', align: 'right' },
  { key: 'avgVisitWeeks', label: 'Avg weeks', align: 'right' },
  { key: 'benchmarkWeeks', label: 'Benchmark', align: 'right' },
  { key: 'cadenceGap', label: 'Gap', align: 'right' },
];

function gapClass(gap: number | null): string {
  if (gap == null) return 'text-gray-400';
  if (gap > 4) return 'text-red-600 font-semibold';
  if (gap > 1) return 'text-amber-600 font-medium';
  if (gap < -1) return 'text-blue-600 font-medium';
  return 'text-emerald-600';
}

function gapText(gap: number | null): string {
  if (gap == null) return '—';
  if (gap > 0) return `+${gap.toFixed(1)}w`;
  if (gap < 0) return `${gap.toFixed(1)}w`;
  return '0w';
}

function csvEscape(value: string | number | null): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsv(rows: BreedMetric[]) {
  const header = ['Breed', 'Appointments', 'Customers', 'Revenue', 'ABV', 'Avg weeks', 'Benchmark weeks', 'Gap weeks', 'Custom'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.label),
        r.appointmentCount,
        r.customerCount,
        r.totalRevenue.toFixed(2),
        r.avgBookingValue.toFixed(2),
        r.avgVisitWeeks ?? '',
        r.benchmarkWeeks ?? '',
        r.cadenceGap ?? '',
        r.isCustom ? 'yes' : 'no',
      ].join(','),
    );
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `breed-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function BreedDetailTable({ dateRange }: BreedDetailTableProps) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side filter controls (re-query)
  const [serverSortBy, setServerSortBy] = useState<SortBy>('revenue');
  const [minSample, setMinSample] = useState(3);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Client-side table sort
  const [clientSort, setClientSort] = useState<{ key: ClientSortKey; dir: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
          mode: 'detail',
          sortBy: serverSortBy,
          minSample: String(minSample),
        });
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
        const res = await fetch(`/api/admin/analytics/breeds?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as DetailResponse;
        setData(body);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[BreedDetailTable] fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [dateRange, serverSortBy, minSample, debouncedSearch]);

  const sortedRows = useMemo(() => {
    if (!data) return [];
    if (!clientSort) return data.breeds;
    const { key, dir } = clientSort;
    return [...data.breeds].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string' && typeof bv === 'string') {
        return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return dir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [data, clientSort]);

  const heroChartData = useMemo(() => {
    if (!data) return [];
    return data.breeds.slice(0, 15);
  }, [data]);

  const heroMetric: 'revenue' | 'abv' = serverSortBy === 'abv' ? 'abv' : 'revenue';

  function toggleClientSort(key: ClientSortKey) {
    setClientSort((prev) => {
      if (prev?.key !== key) return { key, dir: 'desc' };
      if (prev.dir === 'desc') return { key, dir: 'asc' };
      return null;
    });
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card bg-white shadow-md p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="flex-1">
            <label htmlFor="breed-search" className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                id="breed-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by breed name…"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#434E54]/20 focus:ring-2 focus:ring-[#434E54]/30 focus:outline-none bg-white"
              />
            </div>
          </div>
          <div>
            <label htmlFor="breed-sort" className="block text-xs font-medium text-gray-500 mb-1">Sort</label>
            <select
              id="breed-sort"
              value={serverSortBy}
              onChange={(e) => setServerSortBy(e.target.value as SortBy)}
              className="px-3 py-2.5 rounded-lg border border-[#434E54]/20 focus:ring-2 focus:ring-[#434E54]/30 focus:outline-none bg-white text-sm"
            >
              <option value="revenue">Revenue</option>
              <option value="abv">Avg booking value</option>
              <option value="gap">Cadence gap (overdue first)</option>
            </select>
          </div>
          <div>
            <label htmlFor="breed-minsample" className="block text-xs font-medium text-gray-500 mb-1">Min customers</label>
            <input
              id="breed-minsample"
              type="number"
              min={0}
              max={100}
              value={minSample}
              onChange={(e) => setMinSample(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-24 px-3 py-2.5 rounded-lg border border-[#434E54]/20 focus:ring-2 focus:ring-[#434E54]/30 focus:outline-none bg-white"
            />
          </div>
          <button
            type="button"
            onClick={() => data && downloadCsv(data.breeds)}
            disabled={!data || data.breeds.length === 0}
            className="px-4 py-2.5 rounded-lg bg-[#434E54] text-white font-medium hover:bg-[#2F383D] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
        {data && (
          <p className="text-xs text-gray-500 mt-3">
            {data.meta.filteredCount ?? data.breeds.length} of {data.meta.totalBreeds} breeds
            {data.meta.customBreedCount > 0 && ` · ${data.meta.customBreedCount} custom`}
            {' · '}
            {formatNumber(data.meta.totalAppointments)} appointments
          </p>
        )}
      </div>

      {/* Hero chart */}
      <div className="card bg-white shadow-md p-4 sm:p-6">
        <h2 className="text-lg font-bold text-[#434E54] mb-4">Top breeds by {heroMetric === 'abv' ? 'avg booking value' : 'revenue'}</h2>
        {loading ? (
          <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : (
          <BreedRevenueChart data={heroChartData} metric={heroMetric} height={420} />
        )}
      </div>

      {/* Detail table */}
      <div className="card bg-white shadow-md p-4 sm:p-6 overflow-x-auto">
        <h2 className="text-lg font-bold text-[#434E54] mb-4">All breeds</h2>
        {loading && !data ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : !data || data.breeds.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="text-sm">No breeds meet the minimum sample size</p>
            <p className="text-xs mt-1">Lower the threshold or expand the date range</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                {COLUMNS.map((col) => {
                  const isActive = clientSort?.key === col.key;
                  return (
                    <th
                      key={col.key}
                      className={`py-3 px-2 font-medium ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleClientSort(col.key)}
                        className={`inline-flex items-center gap-1 hover:text-[#434E54] ${col.align === 'right' ? 'flex-row-reverse' : ''} ${isActive ? 'text-[#434E54]' : ''}`}
                      >
                        {col.label}
                        {isActive ? (
                          clientSort?.dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((m) => (
                <tr key={`${m.breedId ?? m.label}`} className="border-b border-gray-100 hover:bg-[#F8EEE5]/30 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#434E54]">{m.label}</span>
                      {m.isCustom && (
                        <span className="text-[10px] uppercase tracking-wide text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">custom</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums">{formatNumber(m.appointmentCount)}</td>
                  <td className="py-3 px-2 text-right tabular-nums">{formatNumber(m.customerCount)}</td>
                  <td className="py-3 px-2 text-right tabular-nums font-medium">{formatCurrency(m.totalRevenue)}</td>
                  <td className="py-3 px-2 text-right tabular-nums">{formatCurrency(m.avgBookingValue)}</td>
                  <td className="py-3 px-2 text-right tabular-nums text-gray-600">
                    {m.avgVisitWeeks != null ? `${m.avgVisitWeeks.toFixed(1)}w` : '—'}
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums text-gray-600">
                    {m.benchmarkWeeks != null ? `${m.benchmarkWeeks}w` : '—'}
                  </td>
                  <td className={`py-3 px-2 text-right tabular-nums ${gapClass(m.cadenceGap)}`}>
                    {gapText(m.cadenceGap)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
