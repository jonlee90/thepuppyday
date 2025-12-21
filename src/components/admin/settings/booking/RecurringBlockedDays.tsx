/**
 * RecurringBlockedDays Component
 *
 * Configure recurring blocked days (e.g., block all Sundays):
 * - Day of week toggles (Sunday - Saturday)
 * - Preview of next affected dates
 * - Appointment conflict warnings
 * - Integration with business hours
 * - Unsaved changes tracking
 *
 * Task 0188: Recurring blocked days configuration
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarClock,
  Ban,
  Save,
  AlertTriangle,
  Info,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BookingSettings } from '@/types/settings';

interface RecurringBlockedDaysProps {
  /**
   * Optional callback when loading state changes
   */
  onLoadingChange?: (loading: boolean) => void;
}

interface BusinessHoursResponse {
  monday: { is_open: boolean };
  tuesday: { is_open: boolean };
  wednesday: { is_open: boolean };
  thursday: { is_open: boolean };
  friday: { is_open: boolean };
  saturday: { is_open: boolean };
  sunday: { is_open: boolean };
}

interface DayConfig {
  index: number;
  name: string;
  shortName: string;
}

const DAYS_OF_WEEK: DayConfig[] = [
  { index: 0, name: 'Sunday', shortName: 'Sun' },
  { index: 1, name: 'Monday', shortName: 'Mon' },
  { index: 2, name: 'Tuesday', shortName: 'Tue' },
  { index: 3, name: 'Wednesday', shortName: 'Wed' },
  { index: 4, name: 'Thursday', shortName: 'Thu' },
  { index: 5, name: 'Friday', shortName: 'Fri' },
  { index: 6, name: 'Saturday', shortName: 'Sat' },
];

const DAY_INDEX_TO_KEY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function RecurringBlockedDays({
  onLoadingChange,
}: RecurringBlockedDaysProps) {
  // Settings state
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Local state for recurring blocked days
  const [recurringBlockedDays, setRecurringBlockedDays] = useState<number[]>([]);

  // Original state for comparison
  const [originalBlockedDays, setOriginalBlockedDays] = useState<number[]>([]);

  // Business hours state
  const [businessHours, setBusinessHours] = useState<BusinessHoursResponse | null>(null);
  const [isLoadingBusinessHours, setIsLoadingBusinessHours] = useState(false);

  // Appointment conflicts state
  const [appointmentConflicts, setAppointmentConflicts] = useState<Record<number, number>>({});
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(
    null
  );
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [conflictDayToToggle, setConflictDayToToggle] = useState<number | null>(null);

  // Fetch booking settings on mount
  useEffect(() => {
    fetchBookingSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notify parent of loading state
  useEffect(() => {
    onLoadingChange?.(isSaving || isCheckingConflicts || isLoadingSettings);
  }, [isSaving, isCheckingConflicts, isLoadingSettings, onLoadingChange]);

  // Fetch business hours on mount
  useEffect(() => {
    fetchBusinessHours();
  }, []);

  // Show toast notification
  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch booking settings
  const fetchBookingSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const response = await fetch('/api/admin/settings/booking');
      if (!response.ok) throw new Error('Failed to fetch settings');

      const result = await response.json();
      if (result.data) {
        const settings = result.data as BookingSettings;
        setBookingSettings(settings);
        setRecurringBlockedDays(settings.recurring_blocked_days || []);
        setOriginalBlockedDays(settings.recurring_blocked_days || []);
      }
    } catch (error) {
      console.error('Error fetching booking settings:', error);
      showToast('error', 'Failed to load settings');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Fetch business hours
  const fetchBusinessHours = async () => {
    setIsLoadingBusinessHours(true);
    try {
      // Fetch business hours from booking settings
      const response = await fetch('/api/admin/settings/booking');
      if (response.ok) {
        const data = await response.json();
        // Extract business_hours from the booking settings data
        setBusinessHours(data.data?.business_hours || null);
      }
    } catch (error) {
      console.error('Error fetching business hours:', error);
    } finally {
      setIsLoadingBusinessHours(false);
    }
  };

  // Check if a day is closed in business hours
  const isDayClosedInBusinessHours = (dayIndex: number): boolean => {
    if (!businessHours) return false;
    const dayKey = DAY_INDEX_TO_KEY[dayIndex];
    return businessHours[dayKey as keyof BusinessHoursResponse]?.is_open === false;
  };

  // Get days that are closed in business hours but not blocked
  const closedButNotBlocked = useMemo(() => {
    if (!businessHours) return [];
    return DAYS_OF_WEEK.filter(
      (day) => isDayClosedInBusinessHours(day.index) && !recurringBlockedDays.includes(day.index)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessHours, recurringBlockedDays]);

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (recurringBlockedDays.length !== originalBlockedDays.length) return true;
    return !recurringBlockedDays.every((day) => originalBlockedDays.includes(day));
  }, [recurringBlockedDays, originalBlockedDays]);

  // Get next affected dates for a specific day
  const getNextAffectedDates = (dayIndex: number, count = 5): string[] => {
    const dates: string[] = [];
    const today = new Date();
    const currentDate = new Date(today);

    // Find the next occurrence of this day
    while (currentDate.getDay() !== dayIndex) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get the next N occurrences
    for (let i = 0; i < count; i++) {
      dates.push(
        currentDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      );
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return dates;
  };

  // Check for appointment conflicts when toggling a day ON
  const checkAppointmentConflicts = async (dayIndex: number): Promise<number> => {
    try {
      setIsCheckingConflicts(true);

      // Get the next 52 occurrences of this day (1 year)
      const datesToCheck: string[] = [];
      const today = new Date();
      const currentDate = new Date(today);

      // Find the next occurrence of this day
      while (currentDate.getDay() !== dayIndex) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Get the next 52 occurrences
      for (let i = 0; i < 52; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        datesToCheck.push(dateStr);
        currentDate.setDate(currentDate.getDate() + 7);
      }

      // TODO: Replace with actual API call to check appointments
      // For now, using mock data
      const mockConflictCount = 0; // Would be replaced with actual count

      return mockConflictCount;
    } catch (error) {
      console.error('Error checking appointment conflicts:', error);
      return 0;
    } finally {
      setIsCheckingConflicts(false);
    }
  };

  // Handle day toggle
  const handleDayToggle = async (dayIndex: number) => {
    const isCurrentlyBlocked = recurringBlockedDays.includes(dayIndex);

    if (!isCurrentlyBlocked) {
      // Toggling ON - check for conflicts
      const conflictCount = await checkAppointmentConflicts(dayIndex);

      if (conflictCount > 0) {
        // Show conflict warning
        setConflictDayToToggle(dayIndex);
        setAppointmentConflicts((prev) => ({ ...prev, [dayIndex]: conflictCount }));
        setShowConflictWarning(true);
      } else {
        // No conflicts, toggle immediately
        toggleDay(dayIndex);
      }
    } else {
      // Toggling OFF - no conflict check needed
      toggleDay(dayIndex);
    }
  };

  // Toggle a day (add or remove from recurring_blocked_days)
  const toggleDay = (dayIndex: number) => {
    setRecurringBlockedDays((prev) => {
      if (prev.includes(dayIndex)) {
        return prev.filter((day) => day !== dayIndex);
      } else {
        return [...prev, dayIndex].sort();
      }
    });
  };

  // Handle force toggle (after conflict warning)
  const handleForceToggle = () => {
    if (conflictDayToToggle !== null) {
      toggleDay(conflictDayToToggle);
      setShowConflictWarning(false);
      setConflictDayToToggle(null);
    }
  };

  // Block all closed days from business hours
  const handleBlockAllClosedDays = () => {
    if (!businessHours) return;

    const closedDayIndices = DAYS_OF_WEEK.filter((day) =>
      isDayClosedInBusinessHours(day.index)
    ).map((day) => day.index);

    setRecurringBlockedDays((prev) => {
      const combined = Array.from(new Set([...prev, ...closedDayIndices]));
      return combined.sort();
    });

    showToast('success', `Blocked ${closedDayIndices.length} closed day(s)`);
  };

  // Reset to original state
  const handleReset = () => {
    setRecurringBlockedDays([...originalBlockedDays]);
    setAppointmentConflicts({});
    showToast('success', 'Reset to saved state');
  };

  // Save changes
  const handleSave = async () => {
    if (!bookingSettings) {
      showToast('error', 'Settings not loaded');
      return;
    }

    setIsSaving(true);
    try {
      const updatedSettings: BookingSettings = {
        ...bookingSettings,
        recurring_blocked_days: recurringBlockedDays,
      };

      const response = await fetch('/api/admin/settings/booking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save recurring blocked days');
      }

      // Success - update local state from server response
      setBookingSettings(data.data);
      setRecurringBlockedDays(data.data.recurring_blocked_days || []);
      setOriginalBlockedDays(data.data.recurring_blocked_days || []);
      showToast('success', 'Recurring blocked days saved successfully');
    } catch (error) {
      console.error('Error saving recurring blocked days:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (isLoadingSettings) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-[#434E54]"></span>
        </div>
      </div>
    );
  }

  // Show error if settings failed to load
  if (!bookingSettings) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center text-[#6B7280]">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <p>Failed to load booking settings. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-[#434E54]" />
          <h3 className="text-lg font-semibold text-[#434E54]">Recurring Blocked Days</h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[#6B7280]">
        Block specific days of the week every week. For example, block all Sundays or all Saturdays.
      </p>

      {/* Day Toggles */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h4 className="text-sm font-semibold text-[#434E54] mb-4">Select Days to Block</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const isBlocked = recurringBlockedDays.includes(day.index);
            const isClosedInHours = isDayClosedInBusinessHours(day.index);

            return (
              <div
                key={day.index}
                className={`relative flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  isBlocked
                    ? 'border-[#434E54] bg-[#F8EEE5]'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <label
                      htmlFor={`toggle-day-${day.index}`}
                      className="text-sm font-medium text-[#434E54] cursor-pointer"
                    >
                      {day.name}
                    </label>
                    {isClosedInHours && (
                      <div
                        className="tooltip tooltip-top"
                        data-tip="Closed in business hours"
                      >
                        <Info className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      </div>
                    )}
                  </div>

                  {isBlocked && (
                    <div className="flex items-center gap-1 text-xs text-[#434E54]">
                      <Ban className="w-3 h-3" />
                      <span>Always Blocked</span>
                    </div>
                  )}
                </div>

                <input
                  type="checkbox"
                  id={`toggle-day-${day.index}`}
                  checked={isBlocked}
                  onChange={() => handleDayToggle(day.index)}
                  disabled={isSaving || isCheckingConflicts}
                  className="toggle toggle-md"
                  style={{
                    '--tglbg': isBlocked ? '#434E54' : '#D1D5DB',
                  } as React.CSSProperties}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Business Hours Integration */}
      {!isLoadingBusinessHours && closedButNotBlocked.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 mb-2">
                <strong>Tip:</strong> The following day(s) are marked as closed in business hours
                but not blocked for bookings:
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {closedButNotBlocked.map((day) => (
                  <span
                    key={day.index}
                    className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-xs font-medium text-blue-700"
                  >
                    {day.name}
                  </span>
                ))}
              </div>
              <button
                onClick={handleBlockAllClosedDays}
                disabled={isSaving}
                className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 border-none"
              >
                Block All Closed Days
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Preview of Affected Dates */}
      {recurringBlockedDays.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-[#434E54]" />
            <h4 className="text-sm font-semibold text-[#434E54]">Next Affected Dates</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recurringBlockedDays.map((dayIndex) => {
              const day = DAYS_OF_WEEK.find((d) => d.index === dayIndex);
              if (!day) return null;

              const nextDates = getNextAffectedDates(dayIndex, 4);

              return (
                <div key={dayIndex} className="space-y-2">
                  <div className="text-sm font-semibold text-[#434E54]">{day.name}s</div>
                  <div className="flex flex-wrap gap-1.5">
                    {nextDates.map((date, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded bg-[#EAE0D5] text-xs font-medium text-[#434E54]"
                      >
                        {date}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recurringBlockedDays.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <CalendarClock className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
          <p className="text-sm text-[#6B7280]">
            No recurring blocked days configured. Toggle days above to block them every week.
          </p>
        </div>
      )}

      {/* Actions */}
      {hasUnsavedChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border border-orange-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">You have unsaved changes</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="btn btn-sm btn-ghost text-[#434E54]"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || isCheckingConflicts}
                className="btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44] border-none"
              >
                {isSaving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Conflict Warning Modal */}
      <AnimatePresence>
        {showConflictWarning && conflictDayToToggle !== null && (
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
                    There {appointmentConflicts[conflictDayToToggle] === 1 ? 'is' : 'are'}{' '}
                    <strong>{appointmentConflicts[conflictDayToToggle]}</strong> future{' '}
                    {appointmentConflicts[conflictDayToToggle] === 1 ? 'appointment' : 'appointments'} on{' '}
                    {DAYS_OF_WEEK.find((d) => d.index === conflictDayToToggle)?.name}s.
                  </p>
                </div>
              </div>

              <p className="text-sm text-[#6B7280] mb-4">
                Blocking this day will prevent customers from booking on{' '}
                {DAYS_OF_WEEK.find((d) => d.index === conflictDayToToggle)?.name}s, but existing
                appointments will remain. You may need to contact affected customers.
              </p>

              <div className="modal-action">
                <button
                  onClick={() => {
                    setShowConflictWarning(false);
                    setConflictDayToToggle(null);
                  }}
                  disabled={isSaving}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForceToggle}
                  disabled={isSaving}
                  className="btn bg-orange-600 text-white hover:bg-orange-700 border-none"
                >
                  Block Anyway
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
                toast.type === 'success'
                  ? 'alert-success'
                  : toast.type === 'error'
                  ? 'alert-error'
                  : 'alert-warning'
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
