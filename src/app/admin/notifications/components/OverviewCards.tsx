'use client';

import { Mail, MessageSquare, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import type { NotificationsSummary } from '@/types/notifications-dashboard';

interface OverviewCardsProps {
  summary: NotificationsSummary;
  periodLabel: string;
}

export function OverviewCards({ summary, periodLabel }: OverviewCardsProps) {
  const deliveryRateIsLow = summary.delivery_rate < 90;
  const smsCostDollars = (summary.sms_cost_cents / 100).toFixed(2);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Sent Card */}
      <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
            <Mail className="w-5 h-5 text-[#434E54]" />
          </div>
          {summary.trends.sent_change_percent !== 0 && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                summary.trends.sent_change_percent > 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {summary.trends.sent_change_percent > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(summary.trends.sent_change_percent).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="mb-1">
          <p className="text-3xl font-bold text-[#434E54]">
            {summary.total_sent.toLocaleString()}
          </p>
        </div>
        <p className="text-sm text-[#6B7280]">
          Total Sent <span className="text-[#9CA3AF]">({periodLabel})</span>
        </p>
      </div>

      {/* Delivery Rate Card */}
      <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2.5 rounded-lg ${deliveryRateIsLow ? 'bg-orange-100' : 'bg-[#EAE0D5]'}`}>
            {deliveryRateIsLow ? (
              <AlertCircle className="w-5 h-5 text-orange-600" />
            ) : (
              <TrendingUp className="w-5 h-5 text-[#434E54]" />
            )}
          </div>
          {summary.trends.delivery_rate_change_percent !== 0 && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                summary.trends.delivery_rate_change_percent > 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {summary.trends.delivery_rate_change_percent > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(summary.trends.delivery_rate_change_percent).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="mb-1 flex items-baseline gap-2">
          <p className="text-3xl font-bold text-[#434E54]">
            {summary.delivery_rate.toFixed(1)}%
          </p>
          {deliveryRateIsLow && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 text-xs font-medium text-orange-800">
              Low
            </span>
          )}
        </div>
        <p className="text-sm text-[#6B7280]">
          Delivery Rate
        </p>
        {deliveryRateIsLow && (
          <p className="text-xs text-orange-600 mt-1">
            Below 90% threshold - review failures
          </p>
        )}
      </div>

      {/* Failed Count Card */}
      <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 bg-red-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
        </div>
        <div className="mb-1">
          <p className="text-3xl font-bold text-[#434E54]">
            {summary.total_failed.toLocaleString()}
          </p>
        </div>
        <p className="text-sm text-[#6B7280]">
          Failed Notifications
        </p>
        <p className="text-xs text-[#9CA3AF] mt-1">
          {summary.total_delivered.toLocaleString()} delivered
        </p>
      </div>

      {/* SMS Cost Card */}
      <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
            <MessageSquare className="w-5 h-5 text-[#434E54]" />
          </div>
        </div>
        <div className="mb-1 flex items-baseline gap-1">
          <DollarSign className="w-6 h-6 text-[#434E54] mt-1" />
          <p className="text-3xl font-bold text-[#434E54]">
            {smsCostDollars}
          </p>
        </div>
        <p className="text-sm text-[#6B7280]">
          SMS Cost <span className="text-[#9CA3AF]">({periodLabel})</span>
        </p>
      </div>
    </div>
  );
}
