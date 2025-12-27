'use client';

import {
  X,
  PlusCircle,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  FileQuestion,
  AlertTriangle,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { sanitizeErrorMessage } from '@/lib/utils/sanitize';

interface SyncLogEntry {
  id: string;
  timestamp: string;
  action: 'created' | 'updated' | 'deleted';
  status: 'success' | 'failed';
  error?: string;
  google_event_id?: string;
}

interface SyncHistoryPopoverProps {
  appointmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SyncHistoryPopover({
  appointmentId,
  isOpen,
  onClose,
}: SyncHistoryPopoverProps) {
  const [entries, setEntries] = useState<SyncLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncHistory = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/calendar/sync/history/${appointmentId}`,
        { signal }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch sync history');
      }

      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to load sync history';
      setError(sanitizeErrorMessage(message));
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    if (!isOpen) return;

    const abortController = new AbortController();
    fetchSyncHistory(abortController.signal);

    return () => abortController.abort();
  }, [isOpen, fetchSyncHistory]);

  const handleRetry = () => {
    fetchSyncHistory();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const getActionConfig = (action: SyncLogEntry['action']) => {
    switch (action) {
      case 'created':
        return {
          icon: PlusCircle,
          label: 'Created',
          color: 'text-green-600',
        };
      case 'updated':
        return {
          icon: RefreshCw,
          label: 'Updated',
          color: 'text-blue-500',
        };
      case 'deleted':
        return {
          icon: Trash2,
          label: 'Deleted',
          color: 'text-gray-600',
        };
    }
  };

  const getStatusIcon = (status: SyncLogEntry['status']) => {
    return status === 'success' ? (
      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
    ) : (
      <XCircle className="w-3.5 h-3.5 text-red-600" />
    );
  };

  const getGoogleCalendarUrl = (eventId: string) => {
    return `https://calendar.google.com/calendar/event?eid=${eventId}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center bg-black/50"
      role="dialog"
      aria-label="Sync history for appointment"
      aria-modal="false"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        className="
          bg-white
          rounded-t-xl md:rounded-xl
          shadow-lg
          w-full md:w-[400px]
          max-h-[70vh] md:max-h-[500px]
          overflow-hidden
          flex flex-col
          animate-in slide-in-from-bottom md:zoom-in-95 duration-200
        "
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#F8EEE5] border-b border-[#E5E5E5] px-4 py-3 flex items-center justify-between z-10">
          <h3 className="text-base font-semibold text-[#434E54]">
            Sync History
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="
              p-1.5 rounded-full
              hover:bg-gray-200
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-[#434E54] focus:ring-offset-2
            "
            aria-label="Close sync history"
          >
            <X className="w-5 h-5 text-[#434E54]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse flex gap-3 p-3 border-b border-[#E5E5E5]"
                >
                  <div className="w-4 h-4 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-sm font-medium text-[#434E54] mb-1">
                Failed to load sync history
              </p>
              <p className="text-xs text-[#9CA3AF] mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="btn btn-secondary btn-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && entries.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <FileQuestion className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-sm font-medium text-[#6B7280] mb-1">
                No sync history available
              </p>
              <p className="text-xs text-[#9CA3AF]">
                This appointment hasn&apos;t been synced yet
              </p>
            </div>
          )}

          {/* Entry List */}
          {!isLoading && !error && entries.length > 0 && (
            <ul role="list" aria-live="polite">
              {entries.map((entry, index) => {
                const actionConfig = getActionConfig(entry.action);
                const ActionIcon = actionConfig.icon;
                const showGoogleLink =
                  entry.google_event_id &&
                  entry.action !== 'deleted' &&
                  entry.status === 'success';

                return (
                  <li
                    key={entry.id}
                    className={`
                      p-3 md:p-4
                      hover:bg-[#FFFBF7] transition-colors duration-150
                      ${index !== entries.length - 1 ? 'border-b border-[#E5E5E5]' : ''}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Action Icon */}
                      <ActionIcon
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${actionConfig.color}`}
                        aria-hidden="true"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Action Type & Status */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-[#434E54]">
                            {actionConfig.label}
                          </span>
                          {getStatusIcon(entry.status)}
                          <span
                            className={`text-xs font-medium ${
                              entry.status === 'success'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {entry.status === 'success' ? 'Success' : 'Failed'}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <p className="text-xs text-[#9CA3AF] mb-1">
                          {formatDistanceToNow(new Date(entry.timestamp), {
                            addSuffix: true,
                          })}
                        </p>

                        {/* Error Message */}
                        {entry.error && (
                          <p className="text-xs text-red-600 italic mt-1">
                            {sanitizeErrorMessage(entry.error)}
                          </p>
                        )}
                      </div>

                      {/* Google Calendar Link */}
                      {showGoogleLink && (
                        <a
                          href={getGoogleCalendarUrl(entry.google_event_id!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="
                            flex-shrink-0 p-1.5 rounded
                            text-[#434E54] hover:text-[#434E54] hover:underline
                            hover:bg-gray-100
                            transition-colors duration-150
                            focus:outline-none focus:ring-2 focus:ring-[#434E54] focus:ring-offset-2
                          "
                          aria-label="Open in Google Calendar (opens in new tab)"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
