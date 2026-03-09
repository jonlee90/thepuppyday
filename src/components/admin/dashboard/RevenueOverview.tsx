/**
 * Revenue Overview Component
 * Displays 3-card grid: Today's Revenue, This Week, This Month
 * with animated number transitions and trend indicators.
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, DollarSign, Calendar, CalendarDays, AlertCircle, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { RevenueOverviewResponse } from '@/app/api/admin/dashboard/revenue-overview/route';

interface RevenueOverviewProps {
  revenueData: RevenueOverviewResponse | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

interface TrendBadgeProps {
  changePercent: number | null;
}

function TrendBadge({ changePercent }: TrendBadgeProps) {
  if (changePercent === null) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100">
        <Minus className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-500">N/A</span>
      </div>
    );
  }

  if (changePercent > 0) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50">
        <TrendingUp className="w-4 h-4 text-green-700" />
        <span className="text-sm font-semibold text-green-700">+{changePercent.toFixed(1)}%</span>
      </div>
    );
  }

  if (changePercent < 0) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50">
        <TrendingDown className="w-4 h-4 text-red-700" />
        <span className="text-sm font-semibold text-red-700">{changePercent.toFixed(1)}%</span>
      </div>
    );
  }

  // Exactly zero
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100">
      <Minus className="w-4 h-4 text-gray-500" />
      <span className="text-sm font-semibold text-gray-500">0%</span>
    </div>
  );
}

interface AnimatedAmountProps {
  targetValue: number;
}

function AnimatedAmount({ targetValue }: AnimatedAmountProps) {
  const [displayValue, setDisplayValue] = useState(targetValue);

  useEffect(() => {
    if (targetValue !== displayValue) {
      const duration = 500; // ms
      const steps = 20;
      const startValue = displayValue;
      const stepValue = (targetValue - startValue) / steps;
      const stepTime = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayValue(targetValue);
          clearInterval(interval);
        } else {
          setDisplayValue(startValue + stepValue * currentStep);
        }
      }, stepTime);

      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetValue]);

  return <>{formatCurrency(Math.round(displayValue))}</>;
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-28" />
            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
          </div>
          <div className="h-9 bg-gray-200 rounded w-32 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center gap-3 min-h-[140px]">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-[#434E54]/60 text-center">Failed to load revenue data</p>
          {i === 0 && (
            <button
              onClick={onRetry}
              aria-label="Retry loading revenue data"
              className="flex items-center gap-1 text-xs font-medium text-[#434E54] hover:text-[#434E54]/70 transition-colors border border-[#EAE0D5] rounded-lg px-3 py-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Retry
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function RevenueOverview({ revenueData, loading, error, onRetry }: RevenueOverviewProps) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !revenueData) {
    return <ErrorState onRetry={onRetry} />;
  }

  const { today, thisWeek, thisMonth } = revenueData;

  const cards = [
    {
      label: "Today's Revenue",
      icon: DollarSign,
      value: today.total,
      subtitle: `Completed: ${formatCurrency(today.completed)}\u00a0\u00a0|\u00a0\u00a0Pending: ${formatCurrency(today.pending)}`,
      changePercent: today.changePercent,
      comparison: 'vs yesterday',
    },
    {
      label: 'This Week',
      icon: Calendar,
      value: thisWeek.total,
      subtitle: 'Mon \u2013 Sat',
      changePercent: thisWeek.changePercent,
      comparison: 'vs last week',
    },
    {
      label: 'This Month',
      icon: CalendarDays,
      value: thisMonth.total,
      subtitle: 'Calendar month to date',
      changePercent: thisMonth.changePercent,
      comparison: 'vs last month',
    },
  ];

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
      aria-live="polite"
      aria-label="Revenue overview"
    >
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.1 }}
          className={`${index == 2 ? 'hidden md:block' : '' } bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all hover:scale-[1.02]`}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#434E54]/60">{card.label}</p>
            <div
              className="w-12 h-12 bg-[#EAE0D5] rounded-lg flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <card.icon className="w-6 h-6 text-[#434E54]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#434E54] mb-2">
            <AnimatedAmount targetValue={card.value} />
          </p>
          <p className="text-xs text-[#434E54]/50 mb-3">{card.subtitle}</p>
          <div className="flex items-center gap-2">
            <TrendBadge changePercent={card.changePercent} />
            <span className="text-xs text-[#434E54]/40">{card.comparison}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
