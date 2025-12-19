/**
 * Banner Analytics Component
 * Task 0178: Analytics dashboard for viewing banner performance
 *
 * Features:
 * - Display total clicks with trend indicator
 * - Show CTR percentage
 * - Line/bar chart for clicks over time
 * - Date range selector (7d, 30d, 90d, custom)
 * - CSV export for analytics data
 */

'use client';

import { useState, useEffect } from 'react';
import { Download, TrendingUp, TrendingDown, MousePointer, Eye } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

type AnalyticsPeriod = '7d' | '30d' | '90d' | 'custom';

interface DailyClick {
  date: string;
  clicks: number;
}

interface AnalyticsData {
  banner_id: string;
  period: {
    start: string;
    end: string;
    label: string;
  };
  total_clicks: number;
  total_impressions: number;
  click_through_rate: number;
  clicks_by_date: DailyClick[];
  previous_period_clicks: number;
  change_percent: number;
}

interface BannerAnalyticsProps {
  bannerId: string;
  bannerName?: string;
}

export function BannerAnalytics({ bannerId, bannerName }: BannerAnalyticsProps) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ period });

        if (period === 'custom' && customStart && customEnd) {
          params.set('start', customStart);
          params.set('end', customEnd);
        }

        const response = await fetch(
          `/api/admin/settings/banners/${bannerId}/analytics?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data: AnalyticsData = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    if (period !== 'custom' || (customStart && customEnd)) {
      fetchAnalytics();
    }
  }, [bannerId, period, customStart, customEnd]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!analytics) return;

    const csvHeaders = 'Date,Clicks\n';
    const csvRows = analytics.clicks_by_date
      .map((d) => `${d.date},${d.clicks}`)
      .join('\n');

    const csvContent = csvHeaders + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `banner-analytics-${bannerId}-${analytics.period.start}-to-${analytics.period.end}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="text-center py-8">
          <p className="text-red-600 font-medium">Error loading analytics</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const trendIsPositive = analytics.change_percent >= 0;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-semibold text-[#434E54]">
            {bannerName ? `Analytics: ${bannerName}` : 'Banner Analytics'}
          </h3>
          <p className="text-sm text-[#6B7280] mt-1">{analytics.period.label}</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#434E54] text-white font-medium rounded-lg hover:bg-[#363F44] transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setPeriod('7d')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            period === '7d'
              ? 'bg-[#434E54] text-white'
              : 'bg-gray-100 text-[#434E54] hover:bg-gray-200'
          }`}
        >
          7 Days
        </button>
        <button
          onClick={() => setPeriod('30d')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            period === '30d'
              ? 'bg-[#434E54] text-white'
              : 'bg-gray-100 text-[#434E54] hover:bg-gray-200'
          }`}
        >
          30 Days
        </button>
        <button
          onClick={() => setPeriod('90d')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            period === '90d'
              ? 'bg-[#434E54] text-white'
              : 'bg-gray-100 text-[#434E54] hover:bg-gray-200'
          }`}
        >
          90 Days
        </button>
        <button
          onClick={() => setPeriod('custom')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            period === 'custom'
              ? 'bg-[#434E54] text-white'
              : 'bg-gray-100 text-[#434E54] hover:bg-gray-200'
          }`}
        >
          Custom Range
        </button>
      </div>

      {/* Custom Date Range Inputs */}
      {period === 'custom' && (
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-[#434E54] mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-[#434E54] mb-2">
              End Date
            </label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]"
            />
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Clicks */}
        <div className="bg-[#FFFBF7] p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[#6B7280]">Total Clicks</p>
            <MousePointer className="w-5 h-5 text-[#434E54]" />
          </div>
          <p className="text-3xl font-bold text-[#434E54]">
            {analytics.total_clicks.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {trendIsPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span
              className={`text-sm font-medium ${
                trendIsPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trendIsPositive ? '+' : ''}
              {analytics.change_percent}% vs previous period
            </span>
          </div>
        </div>

        {/* Total Impressions */}
        <div className="bg-[#FFFBF7] p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[#6B7280]">Total Impressions</p>
            <Eye className="w-5 h-5 text-[#434E54]" />
          </div>
          <p className="text-3xl font-bold text-[#434E54]">
            {analytics.total_impressions.toLocaleString()}
          </p>
          <p className="text-sm text-[#9CA3AF] mt-2">
            {analytics.total_impressions > 0 ? 'Views recorded' : 'Tracking not enabled'}
          </p>
        </div>

        {/* Click-Through Rate */}
        <div className="bg-[#FFFBF7] p-5 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[#6B7280]">Click-Through Rate</p>
            <div className="w-5 h-5 flex items-center justify-center text-[#434E54] font-bold">
              %
            </div>
          </div>
          <p className="text-3xl font-bold text-[#434E54]">
            {analytics.click_through_rate}%
          </p>
          <p className="text-sm text-[#9CA3AF] mt-2">
            {analytics.total_impressions > 0
              ? 'Based on impressions'
              : 'Enable tracking for CTR'}
          </p>
        </div>
      </div>

      {/* Chart Type Toggle */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-[#434E54]">Chart Type:</span>
        <button
          onClick={() => setChartType('line')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            chartType === 'line'
              ? 'bg-[#434E54] text-white'
              : 'bg-gray-100 text-[#434E54] hover:bg-gray-200'
          }`}
        >
          Line
        </button>
        <button
          onClick={() => setChartType('bar')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            chartType === 'bar'
              ? 'bg-[#434E54] text-white'
              : 'bg-gray-100 text-[#434E54] hover:bg-gray-200'
          }`}
        >
          Bar
        </button>
      </div>

      {/* Chart */}
      <div className="bg-[#FFFBF7] p-6 rounded-xl">
        <h4 className="text-lg font-semibold text-[#434E54] mb-4">Clicks Over Time</h4>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'line' ? (
            <LineChart data={analytics.clicks_by_date}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
                labelStyle={{ color: '#434E54', fontWeight: 600 }}
                itemStyle={{ color: '#6B7280' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#434E54"
                strokeWidth={2}
                dot={{ fill: '#434E54', r: 4 }}
                activeDot={{ r: 6 }}
                name="Clicks"
              />
            </LineChart>
          ) : (
            <BarChart data={analytics.clicks_by_date}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
                labelStyle={{ color: '#434E54', fontWeight: 600 }}
                itemStyle={{ color: '#6B7280' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="rect"
              />
              <Bar dataKey="clicks" fill="#434E54" name="Clicks" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="text-sm text-[#6B7280] space-y-1">
        <p>
          <span className="font-medium">Period:</span> {analytics.period.start} to{' '}
          {analytics.period.end}
        </p>
        <p>
          <span className="font-medium">Previous Period Clicks:</span>{' '}
          {analytics.previous_period_clicks.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
