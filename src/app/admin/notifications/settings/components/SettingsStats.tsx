'use client';

/**
 * Settings statistics component
 * Displays usage stats and failure rates for notification types
 */

import { Clock, Send, TrendingDown } from 'lucide-react';
import {
  formatRelativeTime,
  calculateFailureRate,
  getFailureRateColor,
  formatFailureRate,
  formatCount,
} from '../utils';

export interface SettingsStatsProps {
  lastSentAt: string | null;
  totalSentCount: number;
  totalFailedCount: number;
}

export function SettingsStats({ lastSentAt, totalSentCount, totalFailedCount }: SettingsStatsProps) {
  const failureRate = calculateFailureRate(totalSentCount, totalFailedCount);
  const failureRateColor = getFailureRateColor(failureRate);

  return (
    <div className="bg-[#F8EEE5] rounded-lg p-4 space-y-3">
      {/* Last sent */}
      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 text-[#6B7280]" aria-hidden="true" />
        <span className="text-[#6B7280] font-medium">Last sent:</span>
        <span className="text-[#434E54]">{formatRelativeTime(lastSentAt)}</span>
      </div>

      {/* Total sent (30 days) */}
      <div className="flex items-center gap-2 text-sm">
        <Send className="w-4 h-4 text-[#6B7280]" aria-hidden="true" />
        <span className="text-[#6B7280] font-medium">Total sent (30d):</span>
        <span className="text-[#434E54] font-semibold">{formatCount(totalSentCount)} messages</span>
      </div>

      {/* Failure rate */}
      <div className="flex items-center gap-2 text-sm">
        <TrendingDown className="w-4 h-4 text-[#6B7280]" aria-hidden="true" />
        <span className="text-[#6B7280] font-medium">Failure rate:</span>
        <span className={`font-semibold ${failureRateColor}`}>
          {formatFailureRate(failureRate)}
        </span>
      </div>

      {/* Failure rate legend */}
      {failureRate !== null && (
        <div className="text-xs text-[#9CA3AF] pt-1 border-t border-[#EAE0D5]">
          <span className="text-green-600 font-medium">&lt;5%</span> Good •{' '}
          <span className="text-amber-600 font-medium">5-10%</span> Warning •{' '}
          <span className="text-red-600 font-medium">&gt;10%</span> Critical
        </div>
      )}
    </div>
  );
}
