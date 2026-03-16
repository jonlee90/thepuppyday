/**
 * ProductivityWidget
 * "Your Day" summary card with an SVG circular progress ring showing
 * completed vs total appointments, plus capacity and average revenue stats.
 *
 * All values are computed client-side from the appointments array — no API call.
 */

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Tables } from '@/types/supabase';
import type { RevenueOverviewResponse } from '@/app/api/admin/dashboard/revenue-overview/route';

type Appointment = Tables<'appointments'> & {
  customer?: Tables<'users'> | null;
  pet?: (Tables<'pets'> & {
    breed?: Tables<'breeds'> | null;
  }) | null;
  service?: Tables<'services'> | null;
};

interface ProductivityWidgetProps {
  appointments: Appointment[];
  revenueData?: RevenueOverviewResponse | null;
  loading: boolean;
}

const RING_RADIUS = 40;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~251.33
const MAX_DAILY_SLOTS = 8;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProductivityWidget({
  appointments,
  revenueData,
  loading,
}: ProductivityWidgetProps) {
  const stats = useMemo(() => {
    const total = appointments.length;
    const completedAppts = appointments.filter((a) => a.status === 'completed');
    const inProgressAppts = appointments.filter((a) => a.status === 'in_progress');
    const completed = completedAppts.length;
    const inProgress = inProgressAppts.length;

    const completedRatio = total > 0 ? completed / total : 0;
    const capacityPct =
      total > 0
        ? Math.round(((completed + inProgress) / Math.min(total, MAX_DAILY_SLOTS)) * 100)
        : 0;

    // Revenue: use all statuses excluding cancelled/no_show
    const activeAppts = appointments.filter(
      (a) => a.status !== 'cancelled' && a.status !== 'no_show'
    );
    const activeCount = activeAppts.length;

    let totalRevenue: number;
    if (revenueData?.today?.total !== undefined) {
      totalRevenue = revenueData.today.total;
    } else {
      totalRevenue = activeAppts.reduce(
        (sum, a) => sum + (a.total_price ?? 0),
        0
      );
    }

    const avgRevenue = activeCount > 0 ? totalRevenue / activeCount : 0;
    const strokeDashoffset = RING_CIRCUMFERENCE * (1 - completedRatio);

    const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;
    const noShowCount = appointments.filter((a) => a.status === 'no_show').length;

    return {
      total,
      completed,
      completedRatio,
      capacityPct,
      avgRevenue,
      strokeDashoffset,
      cancelledCount,
      noShowCount,
    };
  }, [appointments, revenueData]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="h-6 w-20 bg-[#EAE0D5] animate-pulse rounded mb-4" />
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[#EAE0D5] animate-pulse" />
          <div className="flex justify-between w-full">
            <div className="flex flex-col gap-1 items-start">
              <div className="w-12 h-3 bg-[#EAE0D5] animate-pulse rounded" />
              <div className="w-8 h-4 bg-[#EAE0D5] animate-pulse rounded" />
            </div>
            <div className="flex flex-col gap-1 items-end">
              <div className="w-12 h-3 bg-[#EAE0D5] animate-pulse rounded" />
              <div className="w-10 h-4 bg-[#EAE0D5] animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-[#434E54] mb-4">Your Day</h3>

      {/* SVG Progress Ring */}
      <div className="flex justify-center mb-5">
        <svg
          width="80"
          height="80"
          viewBox="0 0 100 100"
          aria-label={`${stats.completed} of ${stats.total} appointments completed`}
          role="img"
        >
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            stroke="#EAE0D5"
            strokeWidth="8"
          />
          {/* Foreground progress — animated via Framer Motion */}
          <motion.circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            stroke="#434E54"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
            animate={{ strokeDashoffset: stats.strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            // SVG arcs start at 3 o'clock; rotate to start from 12 o'clock
            style={{ transformOrigin: '50px 50px', transform: 'rotate(-90deg)' }}
          />
          {/* Center label */}
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="18"
            fontWeight="bold"
            fill="#434E54"
          >
            {stats.completed}/{stats.total}
          </text>
        </svg>
      </div>

      {/* Stats rows */}
      <div className="flex justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-[#434E54]/60">Capacity</span>
          <span className="text-sm font-semibold text-[#434E54]">{stats.capacityPct}%</span>
        </div>
        <div className="flex flex-col gap-0.5 items-end">
          <span className="text-xs text-[#434E54]/60">Avg / Appt</span>
          <span className="text-sm font-semibold text-[#434E54]">
            {formatCurrency(stats.avgRevenue)}
          </span>
        </div>
      </div>

      {(stats.cancelledCount > 0 || stats.noShowCount > 0) && (
        <div className="flex justify-between mt-3 pt-3 border-t border-[#EAE0D5]">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-[#434E54]/60">Cancelled</span>
            <span className="text-sm font-semibold text-red-500">{stats.cancelledCount}</span>
          </div>
          <div className="flex flex-col gap-0.5 items-end">
            <span className="text-xs text-[#434E54]/60">No-Show</span>
            <span className="text-sm font-semibold text-amber-500">{stats.noShowCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
