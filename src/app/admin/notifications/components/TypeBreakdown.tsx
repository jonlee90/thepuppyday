'use client';

import { AlertCircle, CheckCircle } from 'lucide-react';
import type { NotificationTypeStats } from '@/types/notifications-dashboard';

interface TypeBreakdownProps {
  data: NotificationTypeStats[];
}

// Simple mini sparkline component
function MiniSparkline({ successRate }: { successRate: number }) {
  // Create a simple visual indicator based on success rate
  const percentage = Math.round(successRate);
  const color =
    percentage >= 95
      ? '#6BCB77'
      : percentage >= 90
      ? '#FFB347'
      : '#EF4444';

  return (
    <div className="flex items-center gap-1">
      <div className="w-16 h-6 bg-gray-100 rounded overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="text-xs text-[#6B7280] w-10 text-right">
        {percentage}%
      </span>
    </div>
  );
}

// Format notification type for display
function formatNotificationType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function TypeBreakdown({ data }: TypeBreakdownProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#434E54]">Notification Types</h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Performance by notification type
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-sm font-semibold text-[#434E54] py-3">
                Type
              </th>
              <th className="text-right text-sm font-semibold text-[#434E54] py-3">
                Sent
              </th>
              <th className="text-right text-sm font-semibold text-[#434E54] py-3">
                Delivered
              </th>
              <th className="text-right text-sm font-semibold text-[#434E54] py-3">
                Failed
              </th>
              <th className="text-right text-sm font-semibold text-[#434E54] py-3">
                Success Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-[#9CA3AF]">
                  No notification data available
                </td>
              </tr>
            ) : (
              data.map((typeStats) => {
                const successRateIsLow = typeStats.success_rate < 90;

                return (
                  <tr
                    key={typeStats.type}
                    className="border-b border-gray-100 hover:bg-[#FFFBF7] transition-colors duration-150"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {successRateIsLow ? (
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        <span className="text-sm font-medium text-[#434E54]">
                          {formatNotificationType(typeStats.type)}
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-4">
                      <span className="text-sm text-[#6B7280]">
                        {typeStats.sent.toLocaleString()}
                      </span>
                    </td>
                    <td className="text-right py-4">
                      <span className="text-sm text-green-600 font-medium">
                        {typeStats.delivered.toLocaleString()}
                      </span>
                    </td>
                    <td className="text-right py-4">
                      <span className="text-sm text-red-600 font-medium">
                        {typeStats.failed.toLocaleString()}
                      </span>
                    </td>
                    <td className="text-right py-4">
                      <MiniSparkline successRate={typeStats.success_rate} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
