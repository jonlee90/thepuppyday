'use client';

import { useState, useEffect } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { OverviewCards } from '../components/OverviewCards';
import { TimelineChart } from '../components/TimelineChart';
import { ChannelBreakdown } from '../components/ChannelBreakdown';
import { TypeBreakdown } from '../components/TypeBreakdown';
import { RecentFailures } from '../components/RecentFailures';
import type { NotificationsDashboardData, PeriodOption } from '@/types/notifications-dashboard';
import { PERIOD_LABELS } from '@/types/notifications-dashboard';

export default function NotificationsDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('30d');
  const [dashboardData, setDashboardData] = useState<NotificationsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`/api/admin/notifications/dashboard?period=${selectedPeriod}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on mount and when period changes
  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  return (
    <div className="min-h-screen bg-[#F8EEE5] py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#434E54] rounded-xl">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#434E54]">
                  Notifications Dashboard
                </h1>
                <p className="text-[#6B7280] mt-1">
                  Monitor notification delivery and performance
                </p>
              </div>
            </div>

            {/* Period Selector & Refresh */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 bg-white text-[#434E54] rounded-lg border border-gray-200
                         hover:bg-[#F8EEE5] transition-colors duration-200 disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm">
                {(['7d', '30d', '90d'] as PeriodOption[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      selectedPeriod === period
                        ? 'bg-[#434E54] text-white'
                        : 'text-[#434E54] hover:bg-[#EAE0D5]'
                    }`}
                  >
                    {PERIOD_LABELS[period]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && !dashboardData && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#434E54] border-t-transparent mb-4" />
              <p className="text-[#6B7280]">Loading dashboard data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-900 font-semibold mb-1">
                  Failed to load dashboard
                </h3>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={() => fetchDashboardData()}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium
                           hover:bg-red-700 transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {dashboardData && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <OverviewCards
              summary={dashboardData.summary}
              periodLabel={dashboardData.period.label}
            />

            {/* Timeline Chart */}
            <TimelineChart data={dashboardData.timeline} />

            {/* Channel and Type Breakdowns - Side by Side on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChannelBreakdown data={dashboardData.by_channel} />
              <TypeBreakdown data={dashboardData.by_type} />
            </div>

            {/* Recent Failures */}
            <RecentFailures
              failures={dashboardData.recent_failures}
              failureReasons={dashboardData.failure_reasons}
            />
          </div>
        )}
      </div>
    </div>
  );
}
