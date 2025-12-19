'use client';

import { useState, useEffect, useMemo } from 'react';
import { startOfWeek, startOfMonth, subMonths, format, parseISO } from 'date-fns';
import { Calendar, TrendingUp, TrendingDown, Download, Loader2, DollarSign, Users, FileText, Coins } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type {
  EarningsReportFilters,
  EarningsReportData,
  DatePreset,
} from '@/types/staff';
import type { User } from '@/types/database';

// ============================================
// Main Component
// ============================================

export function EarningsReport() {
  // State
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<User[]>([]);
  const [reportData, setReportData] = useState<EarningsReportData | null>(null);
  const [filters, setFilters] = useState<EarningsReportFilters>({
    start_date: startOfMonth(new Date()).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    groomer_id: 'all',
    group_by: 'day',
  });
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');

  // Load staff list
  useEffect(() => {
    loadStaff();
  }, []);

  // Load report when filters change
  useEffect(() => {
    if (filters.start_date && filters.end_date) {
      loadReport();
    }
  }, [filters]);

  const loadStaff = async () => {
    try {
      const response = await fetch('/api/admin/settings/staff?role=groomer');
      const result = await response.json();

      if (response.ok) {
        setStaff(result.data);
      }
    } catch (error) {
      console.error('Failed to load staff:', error);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: filters.start_date,
        end_date: filters.end_date,
        group_by: filters.group_by,
      });

      if (filters.groomer_id !== 'all') {
        params.set('groomer_id', filters.groomer_id);
      }

      const response = await fetch(`/api/admin/settings/staff/earnings?${params}`);
      const result = await response.json();

      if (response.ok) {
        setReportData(result.data);
      }
    } catch (error) {
      console.error('Failed to load earnings report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Date preset handlers
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);

    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (preset) {
      case 'this_week':
        start = startOfWeek(today);
        break;
      case 'this_month':
        start = startOfMonth(today);
        break;
      case 'last_month':
        start = startOfMonth(subMonths(today, 1));
        end = startOfMonth(today);
        end.setDate(end.getDate() - 1); // Last day of previous month
        break;
      case 'custom':
        return; // Don't update dates for custom
      default:
        start = startOfMonth(today);
    }

    setFilters((prev) => ({
      ...prev,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    }));
  };

  // Chart data
  const chartData = useMemo(() => {
    if (!reportData) return [];

    return reportData.timeline.map((entry) => ({
      period: entry.period,
      Revenue: entry.revenue,
      Commission: entry.commission,
    }));
  }, [reportData]);

  // Export handlers
  const handleExportCSV = () => {
    if (!reportData) return;

    // Build CSV content
    const headers = ['Period', 'Services', 'Revenue', 'Commission', 'Tips'];
    const rows = reportData.timeline.map((entry) => [
      entry.period,
      entry.services_count,
      entry.revenue.toFixed(2),
      entry.commission.toFixed(2),
      '0.00', // Tips not in timeline data
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `earnings-report-${filters.start_date}-to-${filters.end_date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    if (!reportData) return;

    // Use jsPDF to generate PDF
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Earnings Report', 14, 20);

    // Date range
    doc.setFontSize(11);
    doc.text(`${filters.start_date} to ${filters.end_date}`, 14, 28);

    // Summary table
    const summaryData = [
      ['Total Services', reportData.summary.total_services.toString()],
      ['Total Revenue', `$${reportData.summary.total_revenue.toFixed(2)}`],
      ['Total Commission', `$${reportData.summary.total_commission.toFixed(2)}`],
      ['Total Tips', `$${reportData.summary.total_tips.toFixed(2)}`],
    ];

    autoTable(doc, {
      startY: 35,
      head: [['Metric', 'Value']],
      body: summaryData,
    });

    // Timeline table
    const timelineData = reportData.timeline.map((entry) => [
      entry.period,
      entry.services_count.toString(),
      `$${entry.revenue.toFixed(2)}`,
      `$${entry.commission.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Period', 'Services', 'Revenue', 'Commission']],
      body: timelineData,
    });

    // Download
    doc.save(`earnings-report-${filters.start_date}-to-${filters.end_date}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#434E54]">Earnings Report</h2>
          <p className="text-sm text-[#6B7280] mt-1">
            View groomer performance and commission data
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={!reportData || loading}
            className="btn btn-outline btn-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={!reportData || loading}
            className="btn btn-outline btn-sm"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card bg-white shadow-sm border border-[#434E54]/10">
        <div className="card-body p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Preset */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-[#434E54]">Date Range</span>
              </label>
              <select
                value={datePreset}
                onChange={(e) => handlePresetChange(e.target.value as DatePreset)}
                className="select select-bordered bg-white border-[#E5E5E5] focus:border-[#434E54]"
              >
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-[#434E54]">Start Date</span>
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => {
                  setFilters({ ...filters, start_date: e.target.value });
                  setDatePreset('custom');
                }}
                className="input input-bordered bg-white border-[#E5E5E5] focus:border-[#434E54]"
              />
            </div>

            {/* End Date */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-[#434E54]">End Date</span>
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => {
                  setFilters({ ...filters, end_date: e.target.value });
                  setDatePreset('custom');
                }}
                className="input input-bordered bg-white border-[#E5E5E5] focus:border-[#434E54]"
              />
            </div>

            {/* Groomer Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-[#434E54]">Groomer</span>
              </label>
              <select
                value={filters.groomer_id}
                onChange={(e) => setFilters({ ...filters, groomer_id: e.target.value })}
                className="select select-bordered bg-white border-[#E5E5E5] focus:border-[#434E54]"
              >
                <option value="all">All Groomers</option>
                {staff.map((groomer) => (
                  <option key={groomer.id} value={groomer.id}>
                    {groomer.first_name} {groomer.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Group By Radio */}
          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text font-medium text-[#434E54]">Group By</span>
            </label>
            <div className="flex gap-4">
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="radio"
                  value="day"
                  checked={filters.group_by === 'day'}
                  onChange={(e) => setFilters({ ...filters, group_by: e.target.value as any })}
                  className="radio radio-primary radio-sm"
                />
                <span className="label-text">Day</span>
              </label>
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="radio"
                  value="week"
                  checked={filters.group_by === 'week'}
                  onChange={(e) => setFilters({ ...filters, group_by: e.target.value as any })}
                  className="radio radio-primary radio-sm"
                />
                <span className="label-text">Week</span>
              </label>
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="radio"
                  value="month"
                  checked={filters.group_by === 'month'}
                  onChange={(e) => setFilters({ ...filters, group_by: e.target.value as any })}
                  className="radio radio-primary radio-sm"
                />
                <span className="label-text">Month</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#434E54] mx-auto mb-3" />
          <p className="text-sm text-[#6B7280]">Generating report...</p>
        </div>
      )}

      {/* Report Content */}
      {!loading && reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard
              icon={<Users className="w-6 h-6" />}
              label="Total Services"
              value={reportData.summary.total_services.toString()}
              color="bg-blue-50 text-blue-600"
            />
            <SummaryCard
              icon={<DollarSign className="w-6 h-6" />}
              label="Total Revenue"
              value={`$${reportData.summary.total_revenue.toFixed(2)}`}
              color="bg-green-50 text-green-600"
            />
            <SummaryCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="Total Commission"
              value={`$${reportData.summary.total_commission.toFixed(2)}`}
              color="bg-purple-50 text-purple-600"
            />
            <SummaryCard
              icon={<Coins className="w-6 h-6" />}
              label="Total Tips"
              value={`$${reportData.summary.total_tips.toFixed(2)}`}
              color="bg-yellow-50 text-yellow-600"
            />
          </div>

          {/* Chart */}
          <div className="card bg-white shadow-sm border border-[#434E54]/10">
            <div className="card-body p-6">
              <h3 className="text-lg font-semibold text-[#434E54] mb-4">
                Earnings Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E5E5',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Revenue" fill="#6BCB77" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Commission" fill="#74B9FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per-Groomer Breakdown */}
          {filters.groomer_id === 'all' && reportData.by_groomer.length > 0 && (
            <div className="card bg-white shadow-sm border border-[#434E54]/10">
              <div className="card-body p-6">
                <h3 className="text-lg font-semibold text-[#434E54] mb-4">
                  Breakdown by Groomer
                </h3>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead className="bg-[#EAE0D5]">
                      <tr>
                        <th className="text-[#434E54]">Groomer</th>
                        <th className="text-[#434E54] text-center">Services</th>
                        <th className="text-[#434E54] text-right">Revenue</th>
                        <th className="text-[#434E54] text-right">Commission</th>
                        <th className="text-[#434E54] text-right">Tips</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.by_groomer.map((groomer) => (
                        <tr key={groomer.groomer_id} className="hover:bg-[#F8EEE5]/50">
                          <td className="font-medium text-[#434E54]">
                            {groomer.groomer_name}
                          </td>
                          <td className="text-center">{groomer.services_count}</td>
                          <td className="text-right font-medium">
                            ${groomer.revenue.toFixed(2)}
                          </td>
                          <td className="text-right font-medium">
                            ${groomer.commission.toFixed(2)}
                          </td>
                          <td className="text-right font-medium">
                            ${groomer.tips.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// Summary Card Component
// ============================================

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function SummaryCard({ icon, label, value, color }: SummaryCardProps) {
  return (
    <div className="card bg-white shadow-sm border border-[#434E54]/10">
      <div className="card-body p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-[#6B7280] mb-2">{label}</p>
            <p className="text-2xl font-bold text-[#434E54]">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
