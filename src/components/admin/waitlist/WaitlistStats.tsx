'use client';

import { Users, CheckCircle, TrendingUp, Clock } from 'lucide-react';

interface WaitlistStatsProps {
  activeCount: number | string;
  filledTodayCount: number | string;
  responseRate: number | string;
  averageWaitTime: number | string;
}

const STAT_CONFIGS = [
  {
    key: 'active',
    label: 'Active Entries',
    icon: Users,
    description: 'Currently waiting',
    accentClass: 'bg-gradient-to-r from-blue-400 to-blue-500',
    formatValue: (v: number | string) => (typeof v === 'string' ? v : v),
  },
  {
    key: 'filled',
    label: 'Filled Today',
    icon: CheckCircle,
    description: 'Slots filled from waitlist',
    accentClass: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
    formatValue: (v: number | string) => (typeof v === 'string' ? v : v),
  },
  {
    key: 'response',
    label: 'Response Rate',
    icon: TrendingUp,
    description: 'Accept notifications',
    accentClass: 'bg-gradient-to-r from-[#D4A574] to-[#E8C49A]',
    formatValue: (v: number | string) =>
      typeof v === 'string' ? v : `${v.toFixed(1)}%`,
  },
  {
    key: 'wait',
    label: 'Avg Wait Time',
    icon: Clock,
    description: 'Hours until booked',
    accentClass: 'bg-gradient-to-r from-[#434E54] to-[#5A6970]',
    formatValue: (v: number | string) =>
      typeof v === 'string' ? v : v > 0 ? `${v}h` : 'N/A',
  },
] as const;

/**
 * WaitlistStats - Summary statistics for waitlist dashboard
 * Displays key metrics in a 4-card layout with brand colors
 */
export function WaitlistStats({
  activeCount,
  filledTodayCount,
  responseRate,
  averageWaitTime,
}: WaitlistStatsProps) {
  const values = [activeCount, filledTodayCount, responseRate, averageWaitTime];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {STAT_CONFIGS.map((config, i) => {
        const Icon = config.icon;
        return (
          <div
            key={config.key}
            className="rounded-xl bg-white shadow-sm overflow-hidden"
          >
            {/* Colored top accent strip */}
            <div className={`h-1 w-full ${config.accentClass}`} />
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#434E54]/60">{config.label}</p>
                  <p className="text-3xl font-bold mt-2 text-[#434E54]">
                    {config.formatValue(values[i])}
                  </p>
                  <p className="text-xs text-[#434E54]/40 mt-1">{config.description}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#EAE0D5] flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-[#434E54]" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
