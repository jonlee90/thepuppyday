'use client';

import { useState, useEffect } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';

interface GroomerStats {
  groomer_id: string;
  groomer_name: string;
  appointments: number;
  average_rating: number;
  revenue: number;
  addon_rate: number;
  completion_rate: number;
}

interface GroomerComparisonData {
  groomers: GroomerStats[];
  averages: {
    appointments: number;
    average_rating: number;
    revenue: number;
    addon_rate: number;
    completion_rate: number;
  };
}

interface GroomerComparisonTableProps {
  dateRange: {
    start: string;
    end: string;
  };
}

type SortField = keyof Omit<GroomerStats, 'groomer_id' | 'groomer_name'>;
type SortDirection = 'asc' | 'desc';

export function GroomerComparisonTable({ dateRange }: GroomerComparisonTableProps) {
  const [data, setData] = useState<GroomerComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    fetchComparisonData();
  }, [dateRange]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        start: dateRange.start,
        end: dateRange.end,
        comparison: 'true',
      });

      const response = await fetch(`/api/admin/analytics/groomers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch comparison data');

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedGroomers = () => {
    if (!data) return [];

    return [...data.groomers].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  const isBelowAverage = (value: number, avgValue: number) => {
    return value < avgValue;
  };

  const exportToCSV = () => {
    if (!data) return;

    const headers = [
      'Groomer Name',
      'Appointments',
      'Avg Rating',
      'Revenue',
      'Add-on Rate',
      'Completion %',
    ];

    const rows = getSortedGroomers().map((groomer) => [
      groomer.groomer_name,
      groomer.appointments.toString(),
      groomer.average_rating.toFixed(2),
      groomer.revenue.toFixed(2),
      groomer.addon_rate.toFixed(1) + '%',
      groomer.completion_rate.toFixed(1) + '%',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `groomer-comparison-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-xs font-semibold text-[#434E54] hover:text-[#363F44] transition-colors"
    >
      {label}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ArrowUp className="w-3.5 h-3.5" />
        ) : (
          <ArrowDown className="w-3.5 h-3.5" />
        )
      ) : (
        <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="skeleton h-6 w-48"></div>
          <div className="skeleton h-10 w-32"></div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-12 w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#434E54] mb-2">Error Loading Data</h3>
        <p className="text-[#6B7280] mb-4">{error}</p>
        <button
          onClick={fetchComparisonData}
          className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data || data.groomers.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm text-center">
        <TrendingDown className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#434E54] mb-2">No Data Available</h3>
        <p className="text-[#6B7280]">
          No groomer performance data found for the selected date range
        </p>
      </div>
    );
  }

  const sortedGroomers = getSortedGroomers();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-[#434E54]">Groomer Comparison</h3>
          <p className="text-sm text-[#6B7280] mt-1">
            Side-by-side performance metrics for all groomers
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {sortedGroomers.map((groomer) => (
          <div key={groomer.groomer_id} className="rounded-xl bg-white shadow-sm p-4 border border-[#434E54]/5">
            <p className="font-medium text-[#434E54] mb-3">{groomer.groomer_name}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-[#434E54]/40 text-xs">Appointments</p>
                <p className={isBelowAverage(groomer.appointments, data.averages.appointments) ? 'text-[#FFB347] font-medium' : 'text-[#434E54]'}>{groomer.appointments}</p>
              </div>
              <div>
                <p className="text-[#434E54]/40 text-xs">Revenue</p>
                <p className={isBelowAverage(groomer.revenue, data.averages.revenue) ? 'text-[#FFB347] font-medium' : 'text-[#434E54]'}>${groomer.revenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[#434E54]/40 text-xs">Avg Rating</p>
                <p className={isBelowAverage(groomer.average_rating, data.averages.average_rating) ? 'text-[#FFB347] font-medium' : 'text-[#434E54]'}>{groomer.average_rating.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[#434E54]/40 text-xs">Add-on Rate</p>
                <p className={isBelowAverage(groomer.addon_rate, data.averages.addon_rate) ? 'text-[#FFB347] font-medium' : 'text-[#434E54]'}>{groomer.addon_rate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[#434E54]/40 text-xs">Completion</p>
                <p className={isBelowAverage(groomer.completion_rate, data.averages.completion_rate) ? 'text-[#FFB347] font-medium' : 'text-[#434E54]'}>{groomer.completion_rate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        ))}
        {/* Averages Card */}
        <div className="rounded-xl bg-[#EAE0D5] p-4">
          <p className="font-semibold text-[#434E54] mb-3">Team Average</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><p className="text-[#434E54]/40 text-xs">Appointments</p><p className="text-[#434E54] font-medium">{data.averages.appointments.toFixed(0)}</p></div>
            <div><p className="text-[#434E54]/40 text-xs">Revenue</p><p className="text-[#434E54] font-medium">${data.averages.revenue.toLocaleString()}</p></div>
            <div><p className="text-[#434E54]/40 text-xs">Avg Rating</p><p className="text-[#434E54] font-medium">{data.averages.average_rating.toFixed(2)}</p></div>
            <div><p className="text-[#434E54]/40 text-xs">Add-on Rate</p><p className="text-[#434E54] font-medium">{data.averages.addon_rate.toFixed(1)}%</p></div>
            <div><p className="text-[#434E54]/40 text-xs">Completion</p><p className="text-[#434E54] font-medium">{data.averages.completion_rate.toFixed(1)}%</p></div>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr className="bg-[#F8EEE5]">
              <th className="text-left">
                <span className="text-xs font-semibold text-[#434E54]">Groomer</span>
              </th>
              <th className="text-center">
                <SortButton field="appointments" label="Appointments" />
              </th>
              <th className="text-center">
                <SortButton field="average_rating" label="Avg Rating" />
              </th>
              <th className="text-center">
                <SortButton field="revenue" label="Revenue" />
              </th>
              <th className="text-center">
                <SortButton field="addon_rate" label="Add-on Rate" />
              </th>
              <th className="text-center">
                <SortButton field="completion_rate" label="Completion %" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedGroomers.map((groomer) => (
              <tr key={groomer.groomer_id} className="hover:bg-[#FFFBF7]">
                <td className="font-medium text-[#434E54]">
                  {groomer.groomer_name}
                </td>

                <td className="text-center">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg font-medium ${
                      isBelowAverage(groomer.appointments, data.averages.appointments)
                        ? 'bg-[#FFB347]/10 text-[#FFB347]'
                        : 'text-[#434E54]'
                    }`}
                  >
                    {groomer.appointments}
                  </span>
                </td>

                <td className="text-center">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg font-medium ${
                      isBelowAverage(groomer.average_rating, data.averages.average_rating)
                        ? 'bg-[#FFB347]/10 text-[#FFB347]'
                        : 'text-[#434E54]'
                    }`}
                  >
                    {groomer.average_rating.toFixed(2)}
                  </span>
                </td>

                <td className="text-center">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg font-medium ${
                      isBelowAverage(groomer.revenue, data.averages.revenue)
                        ? 'bg-[#FFB347]/10 text-[#FFB347]'
                        : 'text-[#434E54]'
                    }`}
                  >
                    ${groomer.revenue.toLocaleString()}
                  </span>
                </td>

                <td className="text-center">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg font-medium ${
                      isBelowAverage(groomer.addon_rate, data.averages.addon_rate)
                        ? 'bg-[#FFB347]/10 text-[#FFB347]'
                        : 'text-[#434E54]'
                    }`}
                  >
                    {groomer.addon_rate.toFixed(1)}%
                  </span>
                </td>

                <td className="text-center">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg font-medium ${
                      isBelowAverage(groomer.completion_rate, data.averages.completion_rate)
                        ? 'bg-[#FFB347]/10 text-[#FFB347]'
                        : 'text-[#434E54]'
                    }`}
                  >
                    {groomer.completion_rate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}

            {/* Average Row */}
            <tr className="bg-[#EAE0D5] font-semibold">
              <td className="text-[#434E54]">Average</td>
              <td className="text-center text-[#434E54]">
                {data.averages.appointments.toFixed(0)}
              </td>
              <td className="text-center text-[#434E54]">
                {data.averages.average_rating.toFixed(2)}
              </td>
              <td className="text-center text-[#434E54]">
                ${data.averages.revenue.toLocaleString()}
              </td>
              <td className="text-center text-[#434E54]">
                {data.averages.addon_rate.toFixed(1)}%
              </td>
              <td className="text-center text-[#434E54]">
                {data.averages.completion_rate.toFixed(1)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-2 text-sm text-[#6B7280]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#FFB347]/10 rounded border border-[#FFB347]"></div>
          <span>Below average (training opportunity)</span>
        </div>
      </div>
    </div>
  );
}
