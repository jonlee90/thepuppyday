'use client';

import { Users, CheckCircle, TrendingUp, Clock } from 'lucide-react';

interface WaitlistStatsProps {
  activeCount: number;
  filledTodayCount: number;
  responseRate: number;
  averageWaitTime: number;
}

/**
 * WaitlistStats - Summary statistics for waitlist dashboard
 * Displays key metrics in a 4-card layout
 */
export function WaitlistStats({
  activeCount,
  filledTodayCount,
  responseRate,
  averageWaitTime,
}: WaitlistStatsProps) {
  const stats = [
    {
      label: 'Active Entries',
      value: activeCount,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Currently waiting',
    },
    {
      label: 'Filled Today',
      value: filledTodayCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Slots filled from waitlist',
    },
    {
      label: 'Response Rate',
      value: `${responseRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Accept notifications',
    },
    {
      label: 'Avg Wait Time',
      value: averageWaitTime > 0 ? `${averageWaitTime}d` : 'N/A',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Days until booked',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="card bg-base-100 border border-base-300 shadow-sm"
          >
            <div className="card-body p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2 text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
