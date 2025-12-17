/**
 * Notification Log Table Component
 * Task 0145: Table with expandable rows showing full content
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import type { NotificationLogListItem, NotificationLogDetail } from '@/types/notification-log';
import {
  formatRelativeTime,
  formatFullTimestamp,
  getStatusBadgeClass,
  getStatusText,
  getChannelIcon,
  formatTemplateData,
  truncate,
} from '../utils';
import { getNotificationTypeLabel } from '@/types/notifications';

interface LogTableProps {
  logs: NotificationLogListItem[];
  onResend: (logId: string) => void;
  onLoadDetail: (logId: string) => Promise<NotificationLogDetail | null>;
}

export function LogTable({ logs, onResend, onLoadDetail }: LogTableProps) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<NotificationLogDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleToggleRow = async (logId: string) => {
    if (expandedRowId === logId) {
      // Collapse
      setExpandedRowId(null);
      setExpandedDetail(null);
    } else {
      // Expand and load details
      setExpandedRowId(logId);
      setLoadingDetail(true);
      try {
        const detail = await onLoadDetail(logId);
        setExpandedDetail(detail);
      } catch (error) {
        console.error('Failed to load log detail:', error);
        setExpandedDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <p className="text-[#6B7280]">No notification logs found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead className="bg-[#EAE0D5]">
            <tr>
              <th className="text-[#434E54] font-semibold"></th>
              <th className="text-[#434E54] font-semibold">Date</th>
              <th className="text-[#434E54] font-semibold">Type</th>
              <th className="text-[#434E54] font-semibold">Channel</th>
              <th className="text-[#434E54] font-semibold">Recipient</th>
              <th className="text-[#434E54] font-semibold">Status</th>
              <th className="text-[#434E54] font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <React.Fragment key={log.id}>
                {/* Main Row */}
                <tr
                  className="hover:bg-[#F8EEE5] cursor-pointer transition-colors"
                  onClick={() => handleToggleRow(log.id)}
                >
                  <td className="w-10">
                    {expandedRowId === log.id ? (
                      <ChevronUp className="w-5 h-5 text-[#434E54]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#434E54]" />
                    )}
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-sm text-[#434E54] font-medium">
                        {formatRelativeTime(log.created_at)}
                      </span>
                      <span className="text-xs text-[#9CA3AF]">
                        {formatFullTimestamp(log.created_at)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-sm text-[#434E54] font-medium">
                        {getNotificationTypeLabel(log.type)}
                      </span>
                      {log.is_test && (
                        <span className="badge badge-sm badge-ghost mt-1">Test</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="text-sm">{getChannelIcon(log.channel)}</span>
                    <span className="ml-2 text-sm text-[#434E54]">
                      {log.channel.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="text-sm text-[#434E54] font-medium">
                        {log.recipient}
                      </span>
                      {log.customer_name && (
                        <span className="text-xs text-[#9CA3AF]">{log.customer_name}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(log.status)}`}>
                      {getStatusText(log.status)}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {log.status === 'failed' && (
                      <button
                        onClick={() => onResend(log.id)}
                        className="btn btn-sm btn-ghost text-[#434E54] hover:bg-[#EAE0D5]"
                        title="Resend notification"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Resend
                      </button>
                    )}
                  </td>
                </tr>

                {/* Expanded Row */}
                {expandedRowId === log.id && (
                  <tr>
                    <td colSpan={7} className="bg-[#FFFBF7] p-6">
                      {loadingDetail ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="loading loading-spinner loading-md text-[#434E54]"></div>
                        </div>
                      ) : expandedDetail ? (
                        <ExpandedLogDetails detail={expandedDetail} />
                      ) : (
                        <div className="text-center py-8 text-[#6B7280]">
                          Failed to load notification details
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Expanded Log Details Component
 */
interface ExpandedLogDetailsProps {
  detail: NotificationLogDetail;
}

function ExpandedLogDetails({ detail }: ExpandedLogDetailsProps) {
  return (
    <div className="space-y-4">
      {/* Subject */}
      {detail.subject && (
        <div>
          <h4 className="text-sm font-semibold text-[#434E54] mb-1">Subject</h4>
          <p className="text-sm text-[#6B7280]">{detail.subject}</p>
        </div>
      )}

      {/* Content */}
      {detail.content && (
        <div>
          <h4 className="text-sm font-semibold text-[#434E54] mb-1">Content</h4>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <pre className="text-sm text-[#6B7280] whitespace-pre-wrap font-sans">
              {detail.content}
            </pre>
          </div>
        </div>
      )}

      {/* Template Data */}
      {detail.template_data && Object.keys(detail.template_data).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[#434E54] mb-1">Template Data</h4>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <pre className="text-xs text-[#6B7280] whitespace-pre-wrap font-mono">
              {formatTemplateData(detail.template_data)}
            </pre>
          </div>
        </div>
      )}

      {/* Error Message */}
      {detail.error_message && (
        <div>
          <h4 className="text-sm font-semibold text-red-600 mb-1">Error Message</h4>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-red-700">{detail.error_message}</p>
          </div>
        </div>
      )}

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        {detail.sent_at && (
          <div>
            <span className="text-xs text-[#9CA3AF] block">Sent At</span>
            <span className="text-sm text-[#434E54] font-medium">
              {formatFullTimestamp(detail.sent_at)}
            </span>
          </div>
        )}

        {detail.delivered_at && (
          <div>
            <span className="text-xs text-[#9CA3AF] block">Delivered At</span>
            <span className="text-sm text-[#434E54] font-medium">
              {formatFullTimestamp(detail.delivered_at)}
            </span>
          </div>
        )}

        {detail.clicked_at && (
          <div>
            <span className="text-xs text-[#9CA3AF] block">Clicked At</span>
            <span className="text-sm text-[#434E54] font-medium">
              {formatFullTimestamp(detail.clicked_at)}
            </span>
          </div>
        )}

        {detail.message_id && (
          <div>
            <span className="text-xs text-[#9CA3AF] block">Message ID</span>
            <span className="text-xs text-[#434E54] font-mono">
              {truncate(detail.message_id, 20)}
            </span>
          </div>
        )}

        {detail.tracking_id && (
          <div>
            <span className="text-xs text-[#9CA3AF] block">Tracking ID</span>
            <span className="text-xs text-[#434E54] font-mono">
              {truncate(detail.tracking_id, 20)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
