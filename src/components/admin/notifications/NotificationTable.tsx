'use client';

/**
 * NotificationTable Component
 * Task 0063: Main table displaying notification history with pagination
 */

import { Mail, MessageSquare, CheckCircle, Eye, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { EmptyState } from '@/components/ui/EmptyState';
import type { NotificationWithCustomer } from '@/types/notifications';
import { getNotificationTypeLabel } from '@/types/notifications';

interface NotificationTableProps {
  notifications: NotificationWithCustomer[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onRowClick: (notification: NotificationWithCustomer) => void;
  onRetry?: () => void;
}

export function NotificationTable({
  notifications,
  loading,
  error,
  page,
  totalPages,
  total,
  onPageChange,
  onRowClick,
  onRetry,
}: NotificationTableProps) {
  // Loading state
  if (loading) {
    return (
      <div className="card bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-center py-16">
          <div className="loading loading-spinner loading-lg text-[#434E54]"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="card bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-[#434E54] mb-2">Error Loading Notifications</h3>
          <p className="text-[#6B7280] mb-4 text-center max-w-md">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn bg-[#434E54] text-white hover:bg-[#363F44]"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12">
        <EmptyState
          icon="search"
          title="No notifications found"
          description="Notifications will appear here as they are sent through the system."
        />
      </div>
    );
  }

  // Calculate page numbers for pagination
  const calculatePageNumber = (index: number, currentPage: number, total: number): number => {
    if (total <= 5) {
      return index + 1;
    } else if (currentPage <= 3) {
      return index + 1;
    } else if (currentPage >= total - 2) {
      return total - 4 + index;
    } else {
      return currentPage - 2 + index;
    }
  };

  return (
    <div className="card bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left">Type</th>
              <th className="text-left">Channel</th>
              <th className="text-left">Recipient</th>
              <th className="text-left">Status</th>
              <th className="text-left">Sent</th>
              <th className="text-left">Delivered</th>
              <th className="text-left">Clicked</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notification) => (
              <tr
                key={notification.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onRowClick(notification)}
              >
                {/* Type & Customer Name */}
                <td>
                  <div className="flex flex-col">
                    <span className="font-medium text-[#434E54]">
                      {getNotificationTypeLabel(notification.type)}
                    </span>
                    {notification.customer_name && (
                      <span className="text-sm text-gray-500">
                        {notification.customer_name}
                      </span>
                    )}
                  </div>
                </td>

                {/* Channel with Icon */}
                <td>
                  <div className="flex items-center gap-2">
                    {notification.channel === 'email' ? (
                      <Mail className="w-4 h-4 text-blue-500" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-green-500" />
                    )}
                    <span className="capitalize text-sm">{notification.channel}</span>
                  </div>
                </td>

                {/* Recipient */}
                <td className="text-sm text-gray-600">{notification.recipient}</td>

                {/* Status Badge */}
                <td>
                  {notification.status === 'sent' ? (
                    <span className="badge badge-success badge-sm">Sent</span>
                  ) : notification.status === 'failed' ? (
                    <span className="badge badge-error badge-sm">Failed</span>
                  ) : (
                    <span className="badge badge-warning badge-sm">Pending</span>
                  )}
                </td>

                {/* Sent Timestamp */}
                <td className="text-sm text-gray-600">
                  {notification.sent_at
                    ? format(new Date(notification.sent_at), 'MMM d, h:mm a')
                    : '-'}
                </td>

                {/* Delivered Indicator */}
                <td className="text-sm text-gray-600">
                  {notification.delivered_at ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    '-'
                  )}
                </td>

                {/* Clicked Indicator */}
                <td className="text-sm text-gray-600">
                  {notification.clicked_at ? (
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  ) : (
                    '-'
                  )}
                </td>

                {/* Actions */}
                <td>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick(notification);
                    }}
                    className="btn btn-ghost btn-sm gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, total)} of {total}{' '}
            notifications
          </div>
          <div className="join">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="join-item btn btn-sm"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = calculatePageNumber(i, page, totalPages);
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`join-item btn btn-sm ${page === pageNum ? 'btn-active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="join-item btn btn-sm"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
