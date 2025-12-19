/**
 * BlockedDatesManager Component
 *
 * Manages blocked dates for booking calendar with:
 * - List view of blocked dates
 * - Add single date or date range
 * - Conflict detection for existing appointments
 * - Remove blocked dates
 *
 * Task 0186: Blocked dates manager component
 */

'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BlockedDate } from '@/types/settings';

interface ConflictResponse {
  error: string;
  affected_appointments: number;
  conflicts: Array<{
    date: string;
    count: number;
  }>;
}

interface BlockedDatesManagerProps {
  /**
   * Shared state for blocked dates (used for sync with calendar)
   */
  blockedDates: BlockedDate[];
  onBlockedDatesChange: (dates: BlockedDate[]) => void;
  /**
   * Optional callback when loading state changes
   */
  onLoadingChange?: (loading: boolean) => void;
}

export function BlockedDatesManager({
  blockedDates,
  onBlockedDatesChange,
  onLoadingChange,
}: BlockedDatesManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRange, setIsRange] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formReason, setFormReason] = useState('');
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictData, setConflictData] = useState<ConflictResponse | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  // Show toast notification
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch blocked dates from API
  const fetchBlockedDates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings/booking/blocked-dates');
      if (!response.ok) {
        throw new Error('Failed to fetch blocked dates');
      }
      const data = await response.json();
      onBlockedDatesChange(data.blocked_dates || []);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      showToast('error', 'Failed to load blocked dates');
    } finally {
      setIsLoading(false);
    }
  };

  // Load blocked dates on mount
  useEffect(() => {
    fetchBlockedDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open add modal
  const handleOpenAddModal = (range: boolean) => {
    setIsRange(range);
    setFormDate('');
    setFormEndDate('');
    setFormReason('');
    setShowAddModal(true);
  };

  // Close add modal
  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setFormDate('');
    setFormEndDate('');
    setFormReason('');
    setConflictData(null);
  };

  // Submit new blocked date
  const handleSubmitBlockedDate = async (forceBlock = false) => {
    if (!formDate) return;

    // Validate date range
    if (isRange && formEndDate && new Date(formEndDate) < new Date(formDate)) {
      showToast('error', 'End date must be on or after start date');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        date: formDate,
        end_date: isRange ? formEndDate : null,
        reason: formReason || '',
        force: forceBlock,
      };

      const response = await fetch('/api/admin/settings/booking/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Handle conflict (409)
      if (response.status === 409) {
        setConflictData(data);
        setShowConflictDialog(true);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add blocked date');
      }

      // Success
      onBlockedDatesChange(data.blocked_dates);
      showToast('success', 'Blocked date added successfully');
      handleCloseAddModal();
    } catch (error) {
      console.error('Error adding blocked date:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to add blocked date');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle force block (after conflict warning)
  const handleForceBlock = () => {
    setShowConflictDialog(false);
    handleSubmitBlockedDate(true);
  };

  // Open delete confirmation
  const handleOpenDeleteConfirm = (date: string) => {
    setDateToDelete(date);
    setShowDeleteConfirm(true);
  };

  // Delete blocked date
  const handleDeleteBlockedDate = async () => {
    if (!dateToDelete) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings/booking/blocked-dates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateToDelete }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove blocked date');
      }

      // Success
      onBlockedDatesChange(data.blocked_dates);
      showToast('success', 'Blocked date removed successfully');
      setShowDeleteConfirm(false);
      setDateToDelete(null);
    } catch (error) {
      console.error('Error removing blocked date:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to remove blocked date');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get display text for blocked date
  const getDateRangeText = (blockedDate: BlockedDate) => {
    if (blockedDate.end_date) {
      return `${formatDate(blockedDate.date)} - ${formatDate(blockedDate.end_date)}`;
    }
    return formatDate(blockedDate.date);
  };

  // Sort blocked dates chronologically (newest first)
  const sortedBlockedDates = [...blockedDates].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#434E54]" />
          <h3 className="text-lg font-semibold text-[#434E54]">Blocked Dates</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenAddModal(false)}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#434E54] rounded-lg hover:bg-[#363F44] transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Block Single Date
          </button>
          <button
            onClick={() => handleOpenAddModal(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#434E54] bg-transparent border border-[#434E54] rounded-lg hover:bg-[#434E54] hover:text-white transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Block Date Range
          </button>
        </div>
      </div>

      {/* Blocked Dates List */}
      {isLoading && blockedDates.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="loading loading-spinner loading-md text-[#434E54]"></div>
        </div>
      ) : blockedDates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <Calendar className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-[#6B7280] mb-2">No blocked dates</p>
          <p className="text-sm text-[#9CA3AF]">Add blocked dates to prevent bookings on specific days</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-[#F8EEE5]">
                <tr>
                  <th className="text-[#434E54] font-semibold">Date / Range</th>
                  <th className="text-[#434E54] font-semibold">Reason</th>
                  <th className="text-[#434E54] font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedBlockedDates.map((blockedDate) => (
                  <tr key={blockedDate.date} className="hover:bg-[#FFFBF7]">
                    <td className="text-[#434E54] font-medium">{getDateRangeText(blockedDate)}</td>
                    <td className="text-[#6B7280]">
                      {blockedDate.reason || <span className="text-[#9CA3AF] italic">No reason provided</span>}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleOpenDeleteConfirm(blockedDate.date)}
                        disabled={isLoading}
                        className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        aria-label="Remove blocked date"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modal modal-open">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="modal-box bg-white max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#434E54]">
                  {isRange ? 'Block Date Range' : 'Block Single Date'}
                </h3>
                <button
                  onClick={handleCloseAddModal}
                  className="btn btn-ghost btn-sm btn-circle"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-[#434E54] mb-2">
                    {isRange ? 'Start Date' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="input input-bordered w-full bg-white border-gray-200 focus:border-[#434E54] focus:outline-none"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* End Date (for range) */}
                {isRange && (
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-2">End Date</label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="input input-bordered w-full bg-white border-gray-200 focus:border-[#434E54] focus:outline-none"
                      min={formDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-[#434E54] mb-2">
                    Reason (optional)
                  </label>
                  <textarea
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    maxLength={200}
                    rows={3}
                    placeholder="e.g., Holiday closure, Staff training"
                    className="textarea textarea-bordered w-full bg-white border-gray-200 focus:border-[#434E54] focus:outline-none resize-none"
                  />
                  <div className="text-xs text-[#9CA3AF] mt-1 text-right">
                    {formReason.length} / 200
                  </div>
                </div>
              </div>

              <div className="modal-action">
                <button
                  onClick={handleCloseAddModal}
                  disabled={isLoading}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitBlockedDate(false)}
                  disabled={isLoading || !formDate}
                  className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Adding...
                    </>
                  ) : (
                    'Add Blocked Date'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Conflict Dialog */}
      <AnimatePresence>
        {showConflictDialog && conflictData && (
          <div className="modal modal-open">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="modal-box bg-white max-w-md"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#434E54] mb-2">
                    Appointments Exist
                  </h3>
                  <p className="text-[#6B7280] text-sm">
                    There {conflictData.affected_appointments === 1 ? 'is' : 'are'}{' '}
                    <strong>{conflictData.affected_appointments}</strong> existing{' '}
                    {conflictData.affected_appointments === 1 ? 'appointment' : 'appointments'} on{' '}
                    {conflictData.conflicts.length === 1 ? 'this date' : 'these dates'}:
                  </p>
                </div>
              </div>

              <div className="bg-[#FFFBF7] rounded-lg p-3 mb-4 space-y-2">
                {conflictData.conflicts.map((conflict) => (
                  <div key={conflict.date} className="flex justify-between text-sm">
                    <span className="text-[#434E54] font-medium">{formatDate(conflict.date)}</span>
                    <span className="text-[#6B7280]">
                      {conflict.count} {conflict.count === 1 ? 'appointment' : 'appointments'}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-[#6B7280] mb-4">
                Blocking these dates will prevent customers from booking, but existing appointments
                will remain. You may need to contact affected customers.
              </p>

              <div className="modal-action">
                <button
                  onClick={() => setShowConflictDialog(false)}
                  disabled={isLoading}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForceBlock}
                  disabled={isLoading}
                  className="btn bg-orange-600 text-white hover:bg-orange-700 border-none"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Blocking...
                    </>
                  ) : (
                    'Block Anyway'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="modal modal-open">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="modal-box bg-white max-w-sm"
            >
              <h3 className="text-lg font-semibold text-[#434E54] mb-2">Remove Blocked Date?</h3>
              <p className="text-[#6B7280] text-sm mb-4">
                This will allow customers to book appointments on this date again.
              </p>

              <div className="modal-action">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isLoading}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBlockedDate}
                  disabled={isLoading}
                  className="btn bg-red-600 text-white hover:bg-red-700 border-none"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Removing...
                    </>
                  ) : (
                    'Remove'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="toast toast-end"
          >
            <div
              className={`alert ${
                toast.type === 'success' ? 'alert-success' : 'alert-error'
              } text-white`}
            >
              <span>{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
