'use client';

/**
 * NotificationStats Component
 * Task 0065: Display KPI cards showing notification summary statistics
 */

import { Send, TrendingUp, MousePointer, DollarSign } from 'lucide-react';
import type { NotificationStats as StatsData } from '@/types/notifications';

interface NotificationStatsProps {
  stats: StatsData | null;
  loading?: boolean;
}

export function NotificationStats({ stats, loading }: NotificationStatsProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card bg-white shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  // No stats available
  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Sent */}
      <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Sent</p>
            <p className="text-3xl font-bold text-[#434E54] mb-2">
              {stats.totalSent.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              {stats.emailCount} emails, {stats.smsCount} SMS
            </p>
          </div>
          <Send className="w-8 h-8 text-blue-500 opacity-50" />
        </div>
      </div>

      {/* Delivery Rate */}
      <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Delivery Rate</p>
            <p className="text-3xl font-bold text-green-600 mb-2">
              {stats.deliveryRate}%
            </p>
            <p className="text-xs text-gray-500">
              {stats.totalDelivered.toLocaleString()} delivered
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
        </div>
      </div>

      {/* Click Rate */}
      <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Click Rate</p>
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {stats.clickRate}%
            </p>
            <p className="text-xs text-gray-500">
              {stats.totalClicked.toLocaleString()} clicked
            </p>
          </div>
          <MousePointer className="w-8 h-8 text-blue-500 opacity-50" />
        </div>
      </div>

      {/* Total Cost (SMS) */}
      <div className="card bg-white shadow-sm hover:shadow-md transition-shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Cost</p>
            <p className="text-3xl font-bold text-[#434E54] mb-2">
              ${stats.totalCostDollars.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">{stats.totalFailed} failed</p>
          </div>
          <DollarSign className="w-8 h-8 text-gray-500 opacity-50" />
        </div>
      </div>
    </div>
  );
}
