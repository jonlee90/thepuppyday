/**
 * BlockedDatesCalendar Component
 *
 * Calendar view for visualizing and managing blocked dates with:
 * - Monthly calendar grid
 * - Color-coded date states (blocked, available, has appointments)
 * - Interactive date toggling
 * - Tooltips showing details
 * - Month navigation
 *
 * Task 0187: Blocked dates calendar component
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BlockedDate } from '@/types/settings';

interface BlockedDatesCalendarProps {
  /**
   * Shared state for blocked dates (used for sync with manager)
   */
  blockedDates: BlockedDate[];
  onBlockedDatesChange: (dates: BlockedDate[]) => void;
  /**
   * Optional callback when loading state changes
   */
  onLoadingChange?: (loading: boolean) => void;
}

interface DateState {
  isBlocked: boolean;
  reason?: string;
  appointmentCount?: number;
  isToday: boolean;
  isCurrentMonth: boolean;
}

interface ConflictResponse {
  error: string;
  affected_appointments: number;
  conflicts: Array<{
    date: string;
    count: number;
  }>;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function BlockedDatesCalendar({
  blockedDates,
  onBlockedDatesChange,
  onLoadingChange,
}: BlockedDatesCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [appointmentCounts, setAppointmentCounts] = useState<Record<string, number>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formReason, setFormReason] = useState('');
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictData, setConflictData] = useState<ConflictResponse | null>(null);
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

  // Fetch appointment counts for the current month
  const fetchAppointmentCounts = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const startDate = new Date(currentYear, currentMonth, 1);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const endDate = new Date(currentYear, currentMonth + 1, 0);

      // TODO: Replace with actual API call to fetch appointment counts
      // For now, using mock data
      const mockCounts: Record<string, number> = {};
      // Example: mockCounts['2025-01-15'] = 3;
      setAppointmentCounts(mockCounts);
    } catch (error) {
      console.error('Error fetching appointment counts:', error);
    }
  };

  // Fetch appointment counts when month changes
  useEffect(() => {
    fetchAppointmentCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, currentYear]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Navigate to next month
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Jump to current month
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Check if a date is blocked
  const isDateBlocked = (dateStr: string): boolean => {
    return blockedDates.some((blocked) => {
      if (blocked.end_date) {
        // Check if date is within range
        return dateStr >= blocked.date && dateStr <= blocked.end_date;
      }
      return blocked.date === dateStr;
    });
  };

  // Get blocked date reason
  const getBlockedReason = (dateStr: string): string | undefined => {
    const blockedDate = blockedDates.find((blocked) => {
      if (blocked.end_date) {
        return dateStr >= blocked.date && dateStr <= blocked.end_date;
      }
      return blocked.date === dateStr;
    });
    return blockedDate?.reason;
  };

  // Get date state
  const getDateState = (year: number, month: number, day: number): DateState => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const today = new Date();
    const isToday =
      day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    return {
      isBlocked: isDateBlocked(dateStr),
      reason: getBlockedReason(dateStr),
      appointmentCount: appointmentCounts[dateStr],
      isToday,
      isCurrentMonth: month === currentMonth && year === currentYear,
    };
  };

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: Array<{
      year: number;
      month: number;
      day: number;
      dateStr: string;
      state: DateState;
    }> = [];

    // Add previous month's trailing days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        year: prevYear,
        month: prevMonth,
        day,
        dateStr,
        state: getDateState(prevYear, prevMonth, day),
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        year: currentYear,
        month: currentMonth,
        day,
        dateStr,
        state: getDateState(currentYear, currentMonth, day),
      });
    }

    // Add next month's leading days
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    for (let day = 1; day <= remainingDays; day++) {
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        year: nextYear,
        month: nextMonth,
        day,
        dateStr,
        state: getDateState(nextYear, nextMonth, day),
      });
    }

    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, currentYear, blockedDates, appointmentCounts]);

  // Handle date click
  const handleDateClick = (dateStr: string, state: DateState) => {
    setSelectedDate(dateStr);

    if (state.isBlocked) {
      // Show remove modal
      setShowRemoveModal(true);
    } else {
      // Show add modal
      setFormReason('');
      setShowAddModal(true);
    }
  };

  // Add blocked date
  const handleAddBlockedDate = async (forceBlock = false) => {
    if (!selectedDate) return;

    setIsLoading(true);
    try {
      const payload = {
        date: selectedDate,
        end_date: null,
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
      showToast('success', 'Date blocked successfully');
      setShowAddModal(false);
      setSelectedDate(null);
      setFormReason('');
    } catch (error) {
      console.error('Error adding blocked date:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to block date');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle force block (after conflict warning)
  const handleForceBlock = () => {
    setShowConflictDialog(false);
    handleAddBlockedDate(true);
  };

  // Remove blocked date
  const handleRemoveBlockedDate = async () => {
    if (!selectedDate) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings/booking/blocked-dates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove blocked date');
      }

      // Success
      onBlockedDatesChange(data.blocked_dates);
      showToast('success', 'Blocked date removed successfully');
      setShowRemoveModal(false);
      setSelectedDate(null);
    } catch (error) {
      console.error('Error removing blocked date:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to remove block');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get date color classes
  const getDateColorClasses = (state: DateState) => {
    if (!state.isCurrentMonth) {
      return 'text-[#D1D5DB] bg-[#F9FAFB]';
    }

    if (state.isBlocked && state.appointmentCount && state.appointmentCount > 0) {
      return 'bg-red-100 text-red-700 font-semibold'; // Blocked WITH appointments
    }

    if (state.isBlocked) {
      return 'bg-gray-200 text-gray-700'; // Blocked
    }

    if (state.appointmentCount && state.appointmentCount > 0) {
      return 'bg-blue-100 text-blue-700'; // Has appointments
    }

    return 'bg-green-50 text-green-700'; // Open/available
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[#434E54]" />
          <h3 className="text-lg font-semibold text-[#434E54]">Calendar View</h3>
        </div>
        <button
          onClick={goToToday}
          className="btn btn-sm bg-transparent text-[#434E54] border border-[#434E54] hover:bg-[#434E54] hover:text-white"
        >
          Today
        </button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <button
          onClick={goToPreviousMonth}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h4 className="text-lg font-semibold text-[#434E54]">
          {MONTHS[currentMonth]} {currentYear}
        </h4>
        <button
          onClick={goToNextMonth}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-[#6B7280] py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(({ dateStr, day, state }) => (
            <div
              key={dateStr}
              className="relative group"
              title={
                state.reason
                  ? `Blocked: ${state.reason}`
                  : state.appointmentCount
                  ? `${state.appointmentCount} appointment${state.appointmentCount > 1 ? 's' : ''}`
                  : ''
              }
            >
              <button
                onClick={() => handleDateClick(dateStr, state)}
                disabled={!state.isCurrentMonth}
                className={`w-full aspect-square flex items-center justify-center rounded-lg text-sm transition-all hover:shadow-md ${getDateColorClasses(
                  state
                )} ${state.isToday ? 'ring-2 ring-[#434E54]' : ''} ${
                  !state.isCurrentMonth ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {day}
              </button>

              {/* Tooltip on hover */}
              {state.isCurrentMonth && (state.reason || state.appointmentCount) && (
                <div className="absolute z-10 hidden group-hover:block bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-48">
                  <div className="bg-[#434E54] text-white text-xs rounded-lg p-2 shadow-lg">
                    {state.reason && (
                      <div className="mb-1">
                        <span className="font-semibold">Blocked:</span> {state.reason}
                      </div>
                    )}
                    {state.appointmentCount && state.appointmentCount > 0 && (
                      <div>
                        {state.appointmentCount} appointment{state.appointmentCount > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
              <span className="text-[#6B7280]">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-[#6B7280]">Has Appointments</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
              <span className="text-[#6B7280]">Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-[#6B7280]">Blocked + Appts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && selectedDate && (
          <div className="modal modal-open">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="modal-box bg-white max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#434E54]">Block Date</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-ghost btn-sm btn-circle"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-[#F8EEE5] rounded-lg p-3">
                  <p className="text-sm text-[#434E54] font-medium">{formatDate(selectedDate)}</p>
                </div>

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
                  onClick={() => setShowAddModal(false)}
                  disabled={isLoading}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddBlockedDate(false)}
                  disabled={isLoading}
                  className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Blocking...
                    </>
                  ) : (
                    'Block Date'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Remove Modal */}
      <AnimatePresence>
        {showRemoveModal && selectedDate && (
          <div className="modal modal-open">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="modal-box bg-white max-w-sm"
            >
              <h3 className="text-lg font-semibold text-[#434E54] mb-2">Remove Block?</h3>
              <p className="text-[#6B7280] text-sm mb-4">
                Remove the block from <strong>{formatDate(selectedDate)}</strong>? Customers will be
                able to book appointments on this date.
              </p>

              <div className="modal-action">
                <button
                  onClick={() => setShowRemoveModal(false)}
                  disabled={isLoading}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveBlockedDate}
                  disabled={isLoading}
                  className="btn bg-red-600 text-white hover:bg-red-700 border-none"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Removing...
                    </>
                  ) : (
                    'Remove Block'
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
                    this date.
                  </p>
                </div>
              </div>

              <p className="text-sm text-[#6B7280] mb-4">
                Blocking this date will prevent customers from booking, but existing appointments
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
