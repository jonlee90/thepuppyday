/**
 * Dashboard Stats Component
 * Displays key metrics with animated number transitions
 */

'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { DashboardStats as StatsData } from '@/app/api/admin/dashboard/stats/route';

interface DashboardStatsProps {
  initialStats: StatsData | null;
  onRetry?: () => void;
}

interface StatCardProps {
  title: string;
  value: number | null;
  icon: React.ElementType;
  format?: 'currency' | 'number';
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

function StatCard({ title, value, icon: Icon, format = 'number', loading, error, onRetry }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(value ?? 0);

  // Animate number changes
  useEffect(() => {
    if (value !== null && value !== displayValue) {
      const duration = 500; // ms
      const steps = 20;
      const stepValue = (value - displayValue) / steps;
      const stepTime = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(prev => prev + stepValue);
        }
      }, stepTime);

      return () => clearInterval(interval);
    }
  }, [value, displayValue]);

  const formattedValue = error
    ? '--'
    : loading
    ? '...'
    : format === 'currency'
    ? formatCurrency(displayValue)
    : Math.round(displayValue).toString();

  return (
    <div
      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all hover:scale-[1.02]"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-[#434E54]/60">{title}</p>
            {error && (
              <button
                onClick={onRetry}
                className="text-xs text-[#434E54]/40 hover:text-[#434E54] transition-colors"
                title="Retry"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-3xl font-bold text-[#434E54] mt-1">
            {formattedValue}
          </p>
        </div>
        <div className="w-12 h-12 bg-[#EAE0D5] rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-[#434E54]" />
        </div>
      </div>
    </div>
  );
}

export function DashboardStats({ initialStats, onRetry }: DashboardStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(initialStats);
  const [loading, setLoading] = useState(!initialStats);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initialStats) {
      setStats(initialStats);
      setLoading(false);
    }
  }, [initialStats]);

  const handleRetry = async () => {
    setLoading(true);
    setError(false);
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Today's Revenue"
        value={stats?.todayRevenue ?? null}
        icon={DollarSign}
        format="currency"
        loading={loading}
        error={error || stats?.todayRevenue === null}
        onRetry={handleRetry}
      />
      <StatCard
        title="Pending Confirmations"
        value={stats?.pendingConfirmations ?? null}
        icon={Clock}
        loading={loading}
        error={error || stats?.pendingConfirmations === null}
        onRetry={handleRetry}
      />
      <StatCard
        title="Total Appointments"
        value={stats?.totalAppointments ?? null}
        icon={Calendar}
        loading={loading}
        error={error || stats?.totalAppointments === null}
        onRetry={handleRetry}
      />
      <StatCard
        title="Completed Today"
        value={stats?.completedAppointments ?? null}
        icon={CheckCircle}
        loading={loading}
        error={error || stats?.completedAppointments === null}
        onRetry={handleRetry}
      />
    </div>
  );
}
