'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RotateCw,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  CheckCircle,
  Loader2,
  Search,
  PawPrint
} from 'lucide-react';

interface SyncError {
  id: string;
  appointmentId: string;
  petName: string;
  petBreed: string;
  appointmentDate: string;
  appointmentTime: string;
  service: string;
  errorMessage: string;
  errorType: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  failedAt: string;
  details?: {
    stackTrace?: string;
    eventId?: string;
    apiResponse?: string;
    attemptTimestamps?: string[];
  };
}

interface SyncErrorRecoveryProps {
  onRetry?: (appointmentId: string, errorId: string) => Promise<boolean>;
  onResync?: (appointmentId: string, errorId: string) => Promise<boolean>;
  onRetryBatch?: (errorIds: string[]) => Promise<{ errorId: string; success: boolean }[]>;
}

export function SyncErrorRecovery({ onRetry, onResync, onRetryBatch }: SyncErrorRecoveryProps) {
  const [errors, setErrors] = useState<SyncError[]>([]);
  const [filteredErrors, setFilteredErrors] = useState<SyncError[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
  const [retryingErrorId, setRetryingErrorId] = useState<string | null>(null);
  const [selectedErrorIds, setSelectedErrorIds] = useState<Set<string>>(new Set());

  // Filter states
  const [dateRange, setDateRange] = useState('all');
  const [errorTypeFilter, setErrorTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation modal states
  const [showResyncModal, setShowResyncModal] = useState(false);
  const [resyncTarget, setResyncTarget] = useState<{ appointmentId: string; errorId: string } | null>(null);
  const [showBatchRetryModal, setShowBatchRetryModal] = useState(false);

  // Fetch errors from API
  // FIXED: Critical #6 - Added AbortController for proper cleanup
  const fetchErrors = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/admin/calendar/sync/errors', { signal });
      if (signal?.aborted) return;

      const data = await response.json();
      setErrors(data.failedSyncs || []);
      setIsLoading(false);
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') return;

      console.error('Failed to fetch sync errors:', error);
      setIsLoading(false);
    }
  }, []);

  // Initial load with AbortController
  useEffect(() => {
    const abortController = new AbortController();
    fetchErrors(abortController.signal);

    return () => abortController.abort();
  }, [fetchErrors]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if user is not actively interacting
      if (!retryingErrorId && !showResyncModal && !showBatchRetryModal) {
        fetchErrors();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchErrors, retryingErrorId, showResyncModal, showBatchRetryModal]);

  // Apply filters
  useEffect(() => {
    let filtered = [...errors];

    // Date range filter
    if (dateRange !== 'all') {
      const now = Date.now();
      const ranges: Record<string, number> = {
        today: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000
      };
      const cutoff = now - (ranges[dateRange] || 0);
      filtered = filtered.filter(e => new Date(e.failedAt).getTime() >= cutoff);
    }

    // Error type filter
    if (errorTypeFilter !== 'all') {
      filtered = filtered.filter(e => e.errorType === errorTypeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        e =>
          e.petName.toLowerCase().includes(query) ||
          e.service.toLowerCase().includes(query) ||
          e.appointmentId.toLowerCase().includes(query)
      );
    }

    setFilteredErrors(filtered);
  }, [errors, dateRange, errorTypeFilter, searchQuery]);

  // Handle retry
  const handleRetry = async (appointmentId: string, errorId: string) => {
    setRetryingErrorId(errorId);
    try {
      const success = onRetry
        ? await onRetry(appointmentId, errorId)
        : await defaultRetry(appointmentId, errorId);

      if (success) {
        showToast('Sync successful', 'success');
        // Remove from list with animation
        setErrors(prev => prev.filter(e => e.id !== errorId));
      } else {
        showToast('Retry failed - See updated error message', 'error');
        await fetchErrors(); // Refresh to get updated error
      }
    } catch (error) {
      showToast('Retry failed - Network error', 'error');
    } finally {
      setRetryingErrorId(null);
    }
  };

  // Default retry implementation
  const defaultRetry = async (appointmentId: string, errorId: string): Promise<boolean> => {
    const response = await fetch('/api/admin/calendar/sync/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, errorId })
    });
    const data = await response.json();
    return data.success;
  };

  // Handle resync
  const handleResync = async () => {
    if (!resyncTarget) return;

    setRetryingErrorId(resyncTarget.errorId);
    setShowResyncModal(false);

    try {
      const success = onResync
        ? await onResync(resyncTarget.appointmentId, resyncTarget.errorId)
        : await defaultResync(resyncTarget.appointmentId, resyncTarget.errorId);

      if (success) {
        showToast('Resync successful', 'success');
        setErrors(prev => prev.filter(e => e.id !== resyncTarget.errorId));
      } else {
        showToast('Resync failed - See updated error message', 'error');
        await fetchErrors();
      }
    } catch (error) {
      showToast('Resync failed - Network error', 'error');
    } finally {
      setRetryingErrorId(null);
      setResyncTarget(null);
    }
  };

  // Default resync implementation
  const defaultResync = async (appointmentId: string, errorId: string): Promise<boolean> => {
    const response = await fetch('/api/admin/calendar/sync/resync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, errorId, deleteExisting: true })
    });
    const data = await response.json();
    return data.success;
  };

  // Handle batch retry
  const handleBatchRetry = async () => {
    const errorIds = Array.from(selectedErrorIds);
    setShowBatchRetryModal(false);

    try {
      const results = onRetryBatch
        ? await onRetryBatch(errorIds)
        : await defaultBatchRetry(errorIds);

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        showToast(`${successCount} sync(s) successful`, 'success');
        // Remove successful ones
        const successIds = results.filter(r => r.success).map(r => r.errorId);
        setErrors(prev => prev.filter(e => !successIds.includes(e.id)));
      }

      if (failCount > 0) {
        showToast(`${failCount} sync(s) failed`, 'error');
        await fetchErrors();
      }

      setSelectedErrorIds(new Set());
    } catch (error) {
      showToast('Batch retry failed - Network error', 'error');
    }
  };

  // Default batch retry implementation
  const defaultBatchRetry = async (
    errorIds: string[]
  ): Promise<{ errorId: string; success: boolean }[]> => {
    const response = await fetch('/api/admin/calendar/sync/retry-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errorIds })
    });
    const data = await response.json();
    return data.results;
  };

  // Toast notification
  // FIXED: Critical #5 - XSS vulnerability fixed by using textContent instead of innerHTML
  const showToast = (message: string, type: 'success' | 'error') => {
    // Create toast element structure safely
    const toast = document.createElement('div');
    toast.className = `toast toast-top toast-end z-50`;

    const alert = document.createElement('div');
    alert.className = `alert ${type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg`;

    const container = document.createElement('div');
    container.className = 'flex items-center gap-2';

    // Create SVG icon
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'w-5 h-5');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', type === 'success' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12');

    svg.appendChild(path);
    container.appendChild(svg);

    // Create message span with safe text content (no HTML injection)
    const span = document.createElement('span');
    span.textContent = message; // Safe - no HTML injection

    container.appendChild(span);
    alert.appendChild(container);
    toast.appendChild(alert);

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, type === 'success' ? 4000 : 6000);
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = now - then;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
    if (hours > 0) {
      return `${hours}h ago`;
    }
    return `${minutes}m ago`;
  };

  // Format next retry time
  const formatNextRetry = (timestamp?: string) => {
    if (!timestamp) return null;

    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = then - now;

    if (diff <= 0) return 'Soon';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get retry count color
  const getRetryCountColor = (count: number) => {
    if (count >= 3) return 'text-red-600';
    if (count >= 2) return 'text-orange-600';
    return 'text-[#6B7280]';
  };

  // Toggle error selection
  const toggleErrorSelection = (errorId: string) => {
    setSelectedErrorIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(errorId)) {
        newSet.delete(errorId);
      } else {
        newSet.add(errorId);
      }
      return newSet;
    });
  };

  // Select all
  const toggleSelectAll = () => {
    if (selectedErrorIds.size === filteredErrors.length) {
      setSelectedErrorIds(new Set());
    } else {
      setSelectedErrorIds(new Set(filteredErrors.map(e => e.id)));
    }
  };

  // Reset filters
  const resetFilters = () => {
    setDateRange('all');
    setErrorTypeFilter('all');
    setSearchQuery('');
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-[#434E54] mb-6">Sync Error Recovery</h2>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="bg-white rounded-xl border border-neutral-300 p-5 animate-pulse"
            >
              <div className="h-6 bg-neutral-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-neutral-200 rounded w-1/2 mb-3" />
              <div className="h-12 bg-neutral-200 rounded w-full mb-3" />
              <div className="h-4 bg-neutral-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (filteredErrors.length === 0 && !searchQuery && dateRange === 'all' && errorTypeFilter === 'all') {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-[#434E54] mb-2">Sync Error Recovery</h2>
        <p className="text-sm text-[#6B7280] mb-6">
          Manage failed calendar sync operations and retry them manually
        </p>

        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-neutral-200">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#434E54] mb-2">All syncs are healthy!</h3>
          <p className="text-sm text-[#6B7280]">No failed calendar events to report</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 bg-[#F8EEE5]">
      <h2 className="text-2xl font-semibold text-[#434E54] mb-2">Sync Error Recovery</h2>
      <p className="text-sm text-[#6B7280] mb-6">
        Manage failed calendar sync operations and retry them manually
      </p>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-sm font-medium text-[#434E54]">Filters:</label>

          {/* Date Range */}
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="select select-bordered select-sm w-44"
            aria-label="Filter by date range"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>

          {/* Error Type */}
          <select
            value={errorTypeFilter}
            onChange={e => setErrorTypeFilter(e.target.value)}
            className="select select-bordered select-sm w-52"
            aria-label="Filter by error type"
          >
            <option value="all">All Error Types</option>
            <option value="rate_limit">Rate Limit</option>
            <option value="auth_error">Auth Error</option>
            <option value="invalid_id">Invalid ID</option>
            <option value="network_error">Network Error</option>
            <option value="other">Other</option>
          </select>

          {/* Search */}
          <div className="relative flex-grow min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by pet or appointment..."
              className="input input-bordered input-sm w-full pl-9"
              aria-label="Search appointments"
            />
          </div>

          {/* Reset */}
          <button onClick={resetFilters} className="btn btn-ghost btn-sm">
            Reset Filters
          </button>
        </div>

        {/* Active filter count */}
        {(dateRange !== 'all' || errorTypeFilter !== 'all' || searchQuery) && (
          <p className="text-xs text-[#6B7280] mt-3">
            Showing {filteredErrors.length} of {errors.length} errors
          </p>
        )}
      </div>

      {/* Error List */}
      <div role="list" className="space-y-4 mb-6">
        {filteredErrors.map(error => (
          <div
            key={error.id}
            role="listitem"
            className={`
              card bg-white border border-neutral-300 shadow-sm
              hover:shadow-md transition-all duration-200
              ${retryingErrorId === error.id ? 'opacity-60 pointer-events-none' : ''}
              ${selectedErrorIds.has(error.id) ? 'bg-neutral-50' : ''}
            `}
          >
            <div className="card-body p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Selection checkbox */}
                  {error.retryCount < error.maxRetries && (
                    <input
                      type="checkbox"
                      checked={selectedErrorIds.has(error.id)}
                      onChange={() => toggleErrorSelection(error.id)}
                      className="checkbox checkbox-sm"
                      aria-label={`Select error for ${error.petName}`}
                    />
                  )}
                  <PawPrint className="w-4 h-4 text-[#434E54]" />
                  <h3 className="text-lg font-semibold text-[#434E54]">
                    {error.petName} - {error.petBreed}
                  </h3>
                </div>
                <span className="text-sm text-[#9CA3AF]">
                  Failed {formatTimeAgo(error.failedAt)}
                </span>
              </div>

              {/* Appointment details */}
              <p className="text-sm text-[#6B7280] mb-3">
                {error.appointmentDate} • {error.appointmentTime} • {error.service}
              </p>

              {/* Error message */}
              <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-lg mb-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[#434E54]">
                    <span className="font-medium">Error:</span> {error.errorMessage}
                  </p>
                </div>
              </div>

              {/* Retry status */}
              <div className="flex items-center gap-2 text-sm mb-4">
                <span className={`font-medium ${getRetryCountColor(error.retryCount)}`}>
                  Retry attempts: {error.retryCount}/{error.maxRetries}
                </span>
                {error.retryCount < error.maxRetries && error.nextRetryAt && (
                  <>
                    <span className="text-[#6B7280]">•</span>
                    <Clock className="w-4 h-4 text-[#6B7280]" />
                    <span className="text-[#6B7280]">
                      Next auto-retry: {formatNextRetry(error.nextRetryAt)}
                    </span>
                  </>
                )}
                {error.retryCount >= error.maxRetries && (
                  <>
                    <span className="text-[#6B7280]">•</span>
                    <span className="font-medium text-red-600">Manual intervention required</span>
                  </>
                )}
              </div>

              {/* Loading overlay */}
              {retryingErrorId === error.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#434E54]" />
                    <span className="text-sm font-medium text-[#6B7280]">Retrying sync...</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {error.retryCount < error.maxRetries ? (
                    <>
                      <button
                        onClick={() => handleRetry(error.appointmentId, error.id)}
                        className="btn btn-primary btn-sm bg-[#434E54] hover:bg-[#363F44] border-none"
                        aria-label={`Retry sync for ${error.petName}'s appointment`}
                      >
                        <RotateCw className="w-4 h-4 mr-1" />
                        Retry Now
                      </button>
                      <button
                        onClick={() => {
                          setResyncTarget({ appointmentId: error.appointmentId, errorId: error.id });
                          setShowResyncModal(true);
                        }}
                        className="btn btn-ghost btn-sm"
                        aria-label={`Resync calendar event for ${error.petName}`}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Resync
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-error btn-sm">Contact Support</button>
                  )}
                </div>

                <button
                  onClick={() =>
                    setExpandedErrorId(expandedErrorId === error.id ? null : error.id)
                  }
                  className="btn btn-ghost btn-sm"
                  aria-expanded={expandedErrorId === error.id}
                  aria-label="Toggle error details"
                >
                  Details
                  {expandedErrorId === error.id ? (
                    <ChevronUp className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </button>
              </div>

              {/* Expanded details */}
              {expandedErrorId === error.id && error.details && (
                <div className="mt-4 pt-4 border-t border-neutral-200 space-y-3 transition-all duration-300">
                  <div>
                    <p className="text-xs font-medium text-[#6B7280] mb-1">Appointment ID</p>
                    <code className="text-xs bg-neutral-100 px-2 py-1 rounded">
                      {error.appointmentId}
                    </code>
                  </div>
                  {error.details.eventId && (
                    <div>
                      <p className="text-xs font-medium text-[#6B7280] mb-1">Calendar Event ID</p>
                      <code className="text-xs bg-neutral-100 px-2 py-1 rounded">
                        {error.details.eventId}
                      </code>
                    </div>
                  )}
                  {error.details.stackTrace && (
                    <div>
                      <p className="text-xs font-medium text-[#6B7280] mb-1">Error Stack Trace</p>
                      <pre className="text-xs bg-neutral-100 p-2 rounded overflow-x-auto">
                        {error.details.stackTrace}
                      </pre>
                    </div>
                  )}
                  {error.details.attemptTimestamps && (
                    <div>
                      <p className="text-xs font-medium text-[#6B7280] mb-1">Sync Attempts</p>
                      <ul className="text-xs text-[#6B7280] space-y-1">
                        {error.details.attemptTimestamps.map((timestamp, i) => (
                          <li key={i}>
                            Attempt {i + 1}: {new Date(timestamp).toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty filter result */}
      {filteredErrors.length === 0 && (searchQuery || dateRange !== 'all' || errorTypeFilter !== 'all') && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-neutral-200">
          <p className="text-[#6B7280]">No errors match your filters</p>
        </div>
      )}

      {/* Bulk Actions */}
      {filteredErrors.length > 0 && (
        <div className="sticky bottom-4 bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedErrorIds.size === filteredErrors.length && filteredErrors.length > 0}
                onChange={toggleSelectAll}
                className="checkbox"
                aria-label="Select all errors"
              />
              <label className="text-sm font-medium text-[#434E54]">Select All</label>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBatchRetryModal(true)}
                disabled={selectedErrorIds.size === 0}
                className="btn btn-primary btn-sm bg-[#434E54] hover:bg-[#363F44] border-none disabled:bg-neutral-300"
              >
                Retry All Selected ({selectedErrorIds.size})
              </button>
              <button className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50">
                Clear Resolved Errors
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resync Confirmation Modal */}
      {showResyncModal && (
        <dialog className="modal modal-open">
          <div className="modal-box bg-white">
            <h3 className="text-lg font-semibold text-[#434E54] mb-3">Resync Calendar Event?</h3>
            <p className="text-sm text-[#6B7280] mb-6">
              This will delete the existing event and create a new one. Use this if event details
              have changed.
            </p>
            <div className="modal-action">
              <button onClick={() => setShowResyncModal(false)} className="btn btn-ghost">
                Cancel
              </button>
              <button
                onClick={handleResync}
                className="btn btn-primary bg-[#434E54] hover:bg-[#363F44] border-none"
              >
                Resync Event
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={() => setShowResyncModal(false)} />
        </dialog>
      )}

      {/* Batch Retry Confirmation Modal */}
      {showBatchRetryModal && (
        <dialog className="modal modal-open">
          <div className="modal-box bg-white">
            <h3 className="text-lg font-semibold text-[#434E54] mb-3">
              Retry {selectedErrorIds.size} Selected Error{selectedErrorIds.size > 1 ? 's' : ''}?
            </h3>
            <p className="text-sm text-[#6B7280] mb-6">
              This will attempt to retry all selected sync operations. This may take a moment.
            </p>
            <div className="modal-action">
              <button onClick={() => setShowBatchRetryModal(false)} className="btn btn-ghost">
                Cancel
              </button>
              <button
                onClick={handleBatchRetry}
                className="btn btn-primary bg-[#434E54] hover:bg-[#363F44] border-none"
              >
                Retry All
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/50"
            onClick={() => setShowBatchRetryModal(false)}
          />
        </dialog>
      )}
    </div>
  );
}
