'use client';

import { useState } from 'react';
import { Mail, MessageSquare, AlertCircle, ExternalLink, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { RecentFailure, FailureReason } from '@/types/notifications-dashboard';

interface RecentFailuresProps {
  failures: RecentFailure[];
  failureReasons: FailureReason[];
}

// Format notification type for display
function formatNotificationType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Truncate error message
function truncateMessage(message: string, maxLength: number = 80): string {
  if (message.length <= maxLength) return message;
  return message.slice(0, maxLength) + '...';
}

export function RecentFailures({ failures, failureReasons }: RecentFailuresProps) {
  const [showReasons, setShowReasons] = useState(false);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#434E54]">Recent Failures</h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Last 10 failed notifications
            </p>
          </div>
          {failures.length > 0 && (
            <button
              onClick={() => setShowReasons(!showReasons)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#434E54]
                       bg-[#EAE0D5] rounded-lg hover:bg-[#DCD2C7] transition-colors duration-200"
            >
              {showReasons ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Error Groups
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show Error Groups
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Failure Reasons - Collapsible */}
      {showReasons && failureReasons.length > 0 && (
        <div className="mb-6 p-4 bg-[#FFFBF7] rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-[#434E54] mb-3">
            Error Types Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {failureReasons.map((reason) => (
              <div
                key={reason.reason}
                className="flex items-center justify-between p-3 bg-white rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-[#434E54] truncate">
                    {reason.reason}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm font-semibold text-[#434E54]">
                    {reason.count}
                  </span>
                  <span className="text-xs text-[#9CA3AF]">
                    ({reason.percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Failures List */}
      {failures.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-[#434E54] font-medium">No recent failures</p>
          <p className="text-sm text-[#9CA3AF] mt-1">
            All notifications are being delivered successfully
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {failures.map((failure) => (
            <div
              key={failure.id}
              className="p-4 rounded-lg border border-red-200 bg-red-50 hover:shadow-sm transition-shadow duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    {failure.channel === 'email' ? (
                      <Mail className="w-4 h-4 text-[#434E54] flex-shrink-0" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-[#434E54] flex-shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-[#434E54]">
                      {formatNotificationType(failure.type)}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#EAE0D5] text-xs font-medium text-[#434E54]">
                      {failure.channel.toUpperCase()}
                    </span>
                  </div>

                  {/* Recipient */}
                  <p className="text-sm text-[#6B7280] mb-2">
                    <span className="font-medium">To:</span> {failure.recipient}
                  </p>

                  {/* Error Message */}
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      {truncateMessage(failure.error_message)}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <p className="text-xs text-[#9CA3AF]">
                    {format(parseISO(failure.created_at), 'MMM dd, yyyy - hh:mm a')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    className="p-2 text-[#434E54] bg-white rounded-lg border border-gray-200
                             hover:bg-[#F8EEE5] transition-colors duration-200"
                    title="View full log"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-[#434E54] bg-white rounded-lg border border-gray-200
                             hover:bg-[#F8EEE5] transition-colors duration-200"
                    title="Retry notification"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* View All Link */}
          <div className="text-center pt-2">
            <a
              href="/admin/notifications/logs"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#434E54]
                       hover:text-[#363F44] transition-colors duration-200"
            >
              View All Notification Logs
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
