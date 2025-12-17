/**
 * Notification Log Viewer Page
 * Tasks 0145-0148: Admin notification log viewer with filtering, export, and resend
 */

'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import type {
  NotificationLogListItem,
  NotificationLogDetail,
  NotificationLogFilters,
  NotificationLogListResponse,
  ResendNotificationResponse,
} from '@/types/notification-log';
import { LogFilters } from './components/LogFilters';
import { LogTable } from './components/LogTable';
import { ExportButton } from './components/ExportButton';
import { ResendModal } from './components/ResendModal';
import { buildQueryString } from './utils';

const DEFAULT_FILTERS: NotificationLogFilters = {
  search: undefined,
  type: undefined,
  channel: 'all',
  status: 'all',
  start_date: undefined,
  end_date: undefined,
};

const LOGS_PER_PAGE = 50;

export default function NotificationLogPage() {
  const [logs, setLogs] = useState<NotificationLogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationLogFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [resendLog, setResendLog] = useState<NotificationLogListItem | null>(null);
  const [showResendModal, setShowResendModal] = useState(false);

  // Fetch logs when filters or page changes
  useEffect(() => {
    fetchLogs();
  }, [filters, currentPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryString = buildQueryString(filters, currentPage, LOGS_PER_PAGE);
      const response = await fetch(`/api/admin/notifications/log?${queryString}`);

      if (!response.ok) {
        throw new Error('Failed to fetch notification logs');
      }

      const data: NotificationLogListResponse = await response.json();

      setLogs(data.logs);
      setTotalPages(data.metadata.total_pages);
      setTotalCount(data.metadata.total);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: NotificationLogFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleLoadDetail = async (logId: string): Promise<NotificationLogDetail | null> => {
    try {
      const response = await fetch(`/api/admin/notifications/log/${logId}`);

      if (!response.ok) {
        throw new Error('Failed to load log detail');
      }

      const data = await response.json();
      return data.log;
    } catch (error) {
      console.error('Failed to load log detail:', error);
      return null;
    }
  };

  const handleResendClick = (logId: string) => {
    const log = logs.find((l) => l.id === logId);
    if (log) {
      setResendLog(log);
      setShowResendModal(true);
    }
  };

  const handleResend = async (
    logId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`/api/admin/notifications/log/${logId}/resend`, {
        method: 'POST',
      });

      const data: ResendNotificationResponse = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          message: data.error || 'Failed to resend notification',
        };
      }

      return {
        success: true,
        message: data.message || 'Notification resent successfully',
      };
    } catch (error) {
      console.error('Error resending notification:', error);
      return {
        success: false,
        message: 'An unexpected error occurred',
      };
    }
  };

  const handleResendSuccess = () => {
    // Refresh logs after successful resend
    fetchLogs();
  };

  const handleExportAll = async (): Promise<NotificationLogListItem[]> => {
    // Fetch all logs (without pagination) for export
    try {
      const queryString = buildQueryString(filters, 1, 10000); // Max 10k logs
      const response = await fetch(`/api/admin/notifications/log?${queryString}`);

      if (!response.ok) {
        throw new Error('Failed to fetch logs for export');
      }

      const data: NotificationLogListResponse = await response.json();
      return data.logs;
    } catch (error) {
      console.error('Error fetching all logs:', error);
      throw error;
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8EEE5] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-[#434E54] animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8EEE5] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#434E54] mb-2">
                Error Loading Logs
              </h3>
              <p className="text-[#6B7280] mb-4">{error}</p>
              <button
                onClick={fetchLogs}
                className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8EEE5] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#434E54] mb-2">Notification Log</h1>
            <p className="text-[#6B7280]">
              View and manage all notification logs with detailed filtering
            </p>
          </div>

          <ExportButton
            logs={logs}
            filters={filters}
            totalCount={totalCount}
            onExportAll={handleExportAll}
          />
        </div>

        {/* Filters */}
        <LogFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={fetchLogs}
        />

        {/* Loading Overlay */}
        {loading && logs.length > 0 && (
          <div className="mb-4 text-center">
            <Loader2 className="w-6 h-6 text-[#434E54] animate-spin inline-block" />
            <span className="ml-2 text-sm text-[#6B7280]">Loading...</span>
          </div>
        )}

        {/* Log Table */}
        <LogTable logs={logs} onResend={handleResendClick} onLoadDetail={handleLoadDetail} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white rounded-xl shadow-md p-4">
            <div className="text-sm text-[#6B7280]">
              Showing page {currentPage} of {totalPages} ({totalCount} total logs)
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44]
                         border-none disabled:bg-gray-300 disabled:text-gray-500"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44]
                         border-none disabled:bg-gray-300 disabled:text-gray-500"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* No Results */}
        {logs.length === 0 && !loading && !error && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-[#6B7280]">No notification logs found</p>
          </div>
        )}

        {/* Resend Modal */}
        <ResendModal
          log={resendLog}
          isOpen={showResendModal}
          onClose={() => {
            setShowResendModal(false);
            setResendLog(null);
          }}
          onResend={handleResend}
          onSuccess={handleResendSuccess}
        />
      </div>
    </div>
  );
}
