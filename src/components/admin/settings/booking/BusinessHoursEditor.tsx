/**
 * Business Hours Editor Component
 * Task 0184: Configure weekly business hours for booking
 *
 * Features:
 * - Weekly schedule editor for all 7 days
 * - Multiple time ranges per day (for lunch breaks/split shifts)
 * - Time validation and conflict detection
 * - Quick actions (copy to days, apply to weekdays, etc.)
 * - Visual preview of weekly schedule
 * - Unsaved changes tracking
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  Copy,
  Save,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import type { BookingSettings, TimeRange, DayHours, BusinessHours } from '@/types/settings';

// ===== TYPES =====

type DayOfWeek = keyof BusinessHours;

// ===== CONSTANTS =====

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

// Default business hours: Mon-Sat 9 AM - 5 PM, Sunday closed
const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { isOpen: true, ranges: [{ start: '09:00', end: '17:00' }] },
  tuesday: { isOpen: true, ranges: [{ start: '09:00', end: '17:00' }] },
  wednesday: { isOpen: true, ranges: [{ start: '09:00', end: '17:00' }] },
  thursday: { isOpen: true, ranges: [{ start: '09:00', end: '17:00' }] },
  friday: { isOpen: true, ranges: [{ start: '09:00', end: '17:00' }] },
  saturday: { isOpen: true, ranges: [{ start: '09:00', end: '17:00' }] },
  sunday: { isOpen: false, ranges: [] },
};

// ===== HELPER FUNCTIONS =====

/**
 * Generate time options in 15-minute increments
 */
function generateTimeOptions(): string[] {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      times.push(`${h}:${m}`);
    }
  }
  return times;
}

/**
 * Format time for display (e.g., "09:00" -> "9:00 AM")
 */
function formatTime(time: string): string {
  const [hourStr, minute] = time.split(':');
  const hour = parseInt(hourStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute} ${period}`;
}

/**
 * Validate time range: end must be after start
 */
function validateTimeRange(range: TimeRange): string | null {
  if (range.start >= range.end) {
    return 'Close time must be after open time';
  }
  return null;
}

/**
 * Validate no overlapping ranges for a day
 */
function validateNoOverlap(ranges: TimeRange[]): string | null {
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const r1 = ranges[i];
      const r2 = ranges[j];

      // Check if ranges overlap
      if (
        (r1.start >= r2.start && r1.start < r2.end) ||
        (r1.end > r2.start && r1.end <= r2.end) ||
        (r2.start >= r1.start && r2.start < r1.end) ||
        (r2.end > r1.start && r2.end <= r1.end)
      ) {
        return `Time ranges ${i + 1} and ${j + 1} overlap`;
      }
    }
  }
  return null;
}

/**
 * Validate entire business hours
 */
function validateBusinessHours(hours: BusinessHours): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check if all days are closed
  const allClosed = DAYS.every((day) => !hours[day].isOpen);
  if (allClosed) {
    warnings.push('All days are closed - customers cannot book appointments');
  }

  // Check each open day
  for (const day of DAYS) {
    const dayHours = hours[day];
    if (!dayHours.isOpen) continue;

    // Check each range
    for (let i = 0; i < dayHours.ranges.length; i++) {
      const range = dayHours.ranges[i];
      const rangeError = validateTimeRange(range);
      if (rangeError) {
        warnings.push(`${DAY_LABELS[day]}, Range ${i + 1}: ${rangeError}`);
      }
    }

    // Check for overlaps
    const overlapError = validateNoOverlap(dayHours.ranges);
    if (overlapError) {
      warnings.push(`${DAY_LABELS[day]}: ${overlapError}`);
    }

    // Check if no ranges when open
    if (dayHours.ranges.length === 0) {
      warnings.push(`${DAY_LABELS[day]}: Marked as open but no time ranges set`);
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

// ===== MAIN COMPONENT =====

export function BusinessHoursEditor() {
  // State
  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS);
  const [originalHours, setOriginalHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS);
  const [expandedDays, setExpandedDays] = useState<Set<DayOfWeek>>(new Set());

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Time options for dropdowns
  const timeOptions = useMemo(() => generateTimeOptions(), []);

  // Validation
  const validation = useMemo(() => validateBusinessHours(businessHours), [businessHours]);

  // Check unsaved changes
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(businessHours) !== JSON.stringify(originalHours),
    [businessHours, originalHours]
  );

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/settings/booking');
        if (!response.ok) throw new Error('Failed to fetch settings');

        const result = await response.json();
        if (result.data) {
          const settings = result.data as BookingSettings;

          // Extract business_hours from settings if it exists
          const hours = settings.business_hours;

          if (hours) {
            setBusinessHours(hours);
            setOriginalHours(hours);
          } else {
            // Use defaults
            setBusinessHours(DEFAULT_BUSINESS_HOURS);
            setOriginalHours(DEFAULT_BUSINESS_HOURS);
          }
        }
      } catch (error) {
        console.error('Error fetching business hours:', error);
        setSaveMessage({
          type: 'error',
          text: 'Failed to load business hours',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Toggle day open/closed
  const toggleDayOpen = (day: DayOfWeek) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen: !prev[day].isOpen,
        ranges: !prev[day].isOpen && prev[day].ranges.length === 0
          ? [{ start: '09:00', end: '17:00' }]
          : prev[day].ranges,
      },
    }));
  };

  // Update time range
  const updateTimeRange = (day: DayOfWeek, rangeIndex: number, field: 'start' | 'end', value: string) => {
    setBusinessHours((prev) => {
      const newRanges = [...prev[day].ranges];
      newRanges[rangeIndex] = {
        ...newRanges[rangeIndex],
        [field]: value,
      };

      return {
        ...prev,
        [day]: {
          ...prev[day],
          ranges: newRanges,
        },
      };
    });
  };

  // Add time range
  const addTimeRange = (day: DayOfWeek) => {
    setBusinessHours((prev) => {
      const currentRanges = prev[day].ranges;

      // Default to next available time slot
      const lastRange = currentRanges[currentRanges.length - 1];
      const newStart = lastRange ? lastRange.end : '09:00';
      const newEnd = lastRange ? addHours(lastRange.end, 4) : '17:00';

      return {
        ...prev,
        [day]: {
          ...prev[day],
          ranges: [...currentRanges, { start: newStart, end: newEnd }],
        },
      };
    });
  };

  // Remove time range
  const removeTimeRange = (day: DayOfWeek, rangeIndex: number) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        ranges: prev[day].ranges.filter((_, i) => i !== rangeIndex),
      },
    }));
  };

  // Copy hours to another day
  const copyHoursTo = (fromDay: DayOfWeek, toDay: DayOfWeek) => {
    setBusinessHours((prev) => ({
      ...prev,
      [toDay]: {
        isOpen: prev[fromDay].isOpen,
        ranges: prev[fromDay].ranges.map((r) => ({ ...r })),
      },
    }));
  };

  // Apply to all weekdays
  const applyToWeekdays = (sourceDay: DayOfWeek) => {
    const weekdays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    setBusinessHours((prev) => {
      const newHours = { ...prev };
      const template = prev[sourceDay];
      weekdays.forEach((day) => {
        newHours[day] = {
          isOpen: template.isOpen,
          ranges: template.ranges.map((r) => ({ ...r })),
        };
      });
      return newHours;
    });
  };

  // Close all weekends
  const closeWeekends = () => {
    setBusinessHours((prev) => ({
      ...prev,
      saturday: { isOpen: false, ranges: [] },
      sunday: { isOpen: false, ranges: [] },
    }));
  };

  // Toggle day expansion
  const toggleDayExpanded = (day: DayOfWeek) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

  // Save settings
  const handleSave = async () => {
    // Final validation check
    if (!validation.isValid) {
      setSaveMessage({
        type: 'error',
        text: 'Please fix validation errors before saving',
      });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Fetch current settings to preserve other fields
      const currentResponse = await fetch('/api/admin/settings/booking');
      if (!currentResponse.ok) throw new Error('Failed to fetch current settings');

      const currentResult = await currentResponse.json();
      const currentSettings = currentResult.data as BookingSettings;

      // Update with business hours
      const updatedSettings = {
        ...currentSettings,
        business_hours: businessHours,
      };

      const response = await fetch('/api/admin/settings/booking', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save business hours');
      }

      // Refetch settings to confirm what was actually saved
      const refreshResponse = await fetch('/api/admin/settings/booking');
      if (refreshResponse.ok) {
        const refreshResult = await refreshResponse.json();
        if (refreshResult.data && refreshResult.data.business_hours) {
          const savedHours = refreshResult.data.business_hours as BusinessHours;
          setBusinessHours(savedHours);
          setOriginalHours(savedHours);
        }
      }

      setSaveMessage({
        type: 'success',
        text: 'Business hours updated successfully!',
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving business hours:', error);
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save business hours. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper: Add hours to time string
  function addHours(time: string, hoursToAdd: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + hoursToAdd * 60;
    const newHour = Math.floor(totalMinutes / 60) % 24;
    const newMinute = totalMinutes % 60;
    return `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
          <Clock className="w-5 h-5 text-[#434E54]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#434E54]">Business Hours</h2>
          <p className="text-sm text-[#6B7280]">
            Set your weekly schedule for customer bookings
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 p-4 bg-[#FFFBF7] rounded-lg border border-[#434E54]/10">
        <h3 className="text-sm font-semibold text-[#434E54] mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={closeWeekends}
            className="btn btn-sm bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]"
          >
            Close All Weekends
          </button>
        </div>
      </div>

      {/* Validation Warnings */}
      {validation.warnings.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-2">Validation Issues</h3>
              <ul className="space-y-1">
                {validation.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm text-red-700">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Schedule */}
      <div className="space-y-3 mb-6">
        {DAYS.map((day) => {
          const dayHours = businessHours[day];
          const isExpanded = expandedDays.has(day);

          return (
            <div
              key={day}
              className="border border-[#434E54]/10 rounded-lg overflow-hidden bg-[#FFFBF7]"
            >
              {/* Day Header */}
              <div className="p-4 bg-white border-b border-[#434E54]/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleDayExpanded(day)}
                      className="text-[#434E54] hover:text-[#363F44] transition-colors"
                    >
                      <Calendar className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="text-base font-semibold text-[#434E54]">{DAY_LABELS[day]}</h3>
                      <p className="text-xs text-[#6B7280]">
                        {dayHours.isOpen
                          ? dayHours.ranges.length > 0
                            ? dayHours.ranges.map((r) => `${formatTime(r.start)} - ${formatTime(r.end)}`).join(', ')
                            : 'Open (no hours set)'
                          : 'Closed'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Open/Closed Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm text-[#6B7280]">
                        {dayHours.isOpen ? 'Open' : 'Closed'}
                      </span>
                      <input
                        type="checkbox"
                        checked={dayHours.isOpen}
                        onChange={() => toggleDayOpen(day)}
                        className="toggle toggle-sm toggle-primary bg-gray-300"
                      />
                    </label>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => toggleDayExpanded(day)}
                      className="btn btn-sm btn-ghost text-[#434E54]"
                    >
                      {isExpanded ? 'Collapse' : 'Edit'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Day Details (Expanded) */}
              {isExpanded && dayHours.isOpen && (
                <div className="p-4 space-y-4">
                  {/* Time Ranges */}
                  {dayHours.ranges.map((range, rangeIndex) => (
                    <div
                      key={rangeIndex}
                      className="p-3 bg-white rounded-lg border border-[#434E54]/10"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-4 h-4 text-[#434E54]" />
                        <span className="text-sm font-medium text-[#434E54]">
                          Time Range {rangeIndex + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Start Time */}
                        <div className="flex-1">
                          <label className="text-xs text-[#6B7280] mb-1 block">Start</label>
                          <select
                            value={range.start}
                            onChange={(e) => updateTimeRange(day, rangeIndex, 'start', e.target.value)}
                            className="select select-sm select-bordered w-full bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none"
                          >
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>
                                {formatTime(time)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <span className="text-[#6B7280] mt-5">to</span>

                        {/* End Time */}
                        <div className="flex-1">
                          <label className="text-xs text-[#6B7280] mb-1 block">End</label>
                          <select
                            value={range.end}
                            onChange={(e) => updateTimeRange(day, rangeIndex, 'end', e.target.value)}
                            className="select select-sm select-bordered w-full bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none"
                          >
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>
                                {formatTime(time)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Remove Range Button */}
                        {dayHours.ranges.length > 1 && (
                          <button
                            onClick={() => removeTimeRange(day, rangeIndex)}
                            className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50 mt-5"
                            title="Remove time range"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Range Validation Error */}
                      {validateTimeRange(range) && (
                        <div className="mt-2 flex items-center gap-2 text-red-600 text-xs">
                          <AlertCircle className="w-3 h-3" />
                          <span>{validateTimeRange(range)}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Time Range Button */}
                  {dayHours.ranges.length < 3 && (
                    <button
                      onClick={() => addTimeRange(day)}
                      className="btn btn-sm bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5] w-full"
                    >
                      <Plus className="w-4 h-4" />
                      Add Time Range
                    </button>
                  )}

                  {/* Quick Copy Actions */}
                  <div className="pt-3 border-t border-[#434E54]/10">
                    <p className="text-xs text-[#6B7280] mb-2">Copy these hours to:</p>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.filter((d) => d !== day).map((targetDay) => (
                        <button
                          key={targetDay}
                          onClick={() => copyHoursTo(day, targetDay)}
                          className="btn btn-xs bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]"
                        >
                          <Copy className="w-3 h-3" />
                          {DAY_LABELS[targetDay].slice(0, 3)}
                        </button>
                      ))}
                      <button
                        onClick={() => applyToWeekdays(day)}
                        className="btn btn-xs bg-[#434E54] text-white hover:bg-[#363F44]"
                      >
                        All Weekdays
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Closed Day Message */}
              {isExpanded && !dayHours.isOpen && (
                <div className="p-4 text-center text-sm text-[#6B7280]">
                  This day is closed for bookings
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly Preview */}
      <div className="mb-6 p-4 bg-[#434E54]/5 border border-[#434E54]/10 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#434E54]/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 text-[#434E54]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[#434E54] mb-2">Weekly Preview</h3>
            <div className="space-y-1">
              {DAYS.map((day) => {
                const dayHours = businessHours[day];
                const statusIcon = dayHours.isOpen ? (
                  dayHours.ranges.length > 1 ? (
                    <span className="text-[#FFB347]" title="Multiple time ranges">●</span>
                  ) : (
                    <span className="text-green-600" title="Open">✓</span>
                  )
                ) : (
                  <span className="text-gray-400" title="Closed">✗</span>
                );

                return (
                  <div key={day} className="flex items-center gap-2 text-sm">
                    <span className="w-20 font-medium text-[#434E54]">
                      {DAY_LABELS[day].slice(0, 3)}:
                    </span>
                    <span className="w-4">{statusIcon}</span>
                    <span className="text-[#6B7280]">
                      {dayHours.isOpen
                        ? dayHours.ranges.length > 0
                          ? dayHours.ranges.map((r) => `${formatTime(r.start)}-${formatTime(r.end)}`).join(', ')
                          : 'Open (no hours)'
                        : 'Closed'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button and Messages */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges || !validation.isValid}
          className="btn bg-[#434E54] hover:bg-[#363F44] text-white border-none disabled:bg-gray-300 disabled:text-gray-500"
        >
          {isSaving ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Business Hours
            </>
          )}
        </button>

        {/* Unsaved changes indicator */}
        {hasUnsavedChanges && !saveMessage && validation.isValid && (
          <div className="flex items-center gap-2 text-[#FFB347]">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Unsaved changes</span>
          </div>
        )}

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`flex items-center gap-2 ${
              saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{saveMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
