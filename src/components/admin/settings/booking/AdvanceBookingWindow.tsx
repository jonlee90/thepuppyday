/**
 * Advance Booking Window Component
 * Task 0181: Configure min/max advance booking window
 *
 * Allows admins to set:
 * - Minimum advance booking hours (0-168 hours / 7 days)
 * - Maximum advance booking days (7-365 days)
 * - Real-time preview of booking window
 * - Warning when same-day booking is disabled
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, Save, AlertCircle, AlertTriangle, Clock } from 'lucide-react';
import type { BookingSettings } from '@/types/settings';

export function AdvanceBookingWindow() {
  // State for settings
  const [minAdvanceHours, setMinAdvanceHours] = useState<number>(24);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState<number>(30);

  // Original values for unsaved changes tracking
  const [originalMinHours, setOriginalMinHours] = useState<number>(24);
  const [originalMaxDays, setOriginalMaxDays] = useState<number>(30);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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
          setMinAdvanceHours(settings.min_advance_hours);
          setMaxAdvanceDays(settings.max_advance_days);
          setOriginalMinHours(settings.min_advance_hours);
          setOriginalMaxDays(settings.max_advance_days);
        }
      } catch (error) {
        console.error('Error fetching booking settings:', error);
        setSaveMessage({
          type: 'error',
          text: 'Failed to load settings',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return minAdvanceHours !== originalMinHours || maxAdvanceDays !== originalMaxDays;
  }, [minAdvanceHours, maxAdvanceDays, originalMinHours, originalMaxDays]);

  // Check if same-day booking is disabled (> 24 hours)
  const sameDayDisabled = useMemo(() => {
    return minAdvanceHours > 24;
  }, [minAdvanceHours]);

  // Generate human-readable preview
  const previewText = useMemo(() => {
    const minDays = Math.floor(minAdvanceHours / 24);
    const minRemainingHours = minAdvanceHours % 24;

    let minText = '';
    if (minDays > 0) {
      minText = `${minDays} day${minDays > 1 ? 's' : ''}`;
      if (minRemainingHours > 0) {
        minText += ` and ${minRemainingHours} hour${minRemainingHours > 1 ? 's' : ''}`;
      }
    } else if (minAdvanceHours > 0) {
      minText = `${minAdvanceHours} hour${minAdvanceHours > 1 ? 's' : ''}`;
    } else {
      minText = 'immediately';
    }

    const maxText = `${maxAdvanceDays} day${maxAdvanceDays > 1 ? 's' : ''}`;

    return `Customers can book from ${minText} to ${maxText} in advance`;
  }, [minAdvanceHours, maxAdvanceDays]);

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Fetch current settings to preserve other fields
      const currentResponse = await fetch('/api/admin/settings/booking');
      if (!currentResponse.ok) throw new Error('Failed to fetch current settings');

      const currentResult = await currentResponse.json();
      const currentSettings = currentResult.data as BookingSettings;

      // Update only the advance booking fields
      const updatedSettings: BookingSettings = {
        ...currentSettings,
        min_advance_hours: minAdvanceHours,
        max_advance_days: maxAdvanceDays,
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
        throw new Error(errorData.error || 'Failed to save settings');
      }

      // Update original values
      setOriginalMinHours(minAdvanceHours);
      setOriginalMaxDays(maxAdvanceDays);

      setSaveMessage({
        type: 'success',
        text: 'Advance booking window updated successfully!',
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving booking settings:', error);
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading skeleton
  if (isLoading && !saveMessage) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-100 rounded"></div>
            <div className="h-24 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if loading failed
  if (saveMessage?.type === 'error' && isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[#434E54]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#434E54]">Advance Booking Window</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{saveMessage.text}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
          <Calendar className="w-5 h-5 text-[#434E54]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#434E54]">Advance Booking Window</h2>
          <p className="text-sm text-[#6B7280]">
            Control how far in advance customers can book appointments
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Minimum Advance Booking */}
        <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
          <label className="flex items-center gap-2 text-sm font-medium text-[#434E54] mb-3">
            <Clock className="w-4 h-4" />
            Minimum Advance Booking
          </label>
          <p className="text-xs text-[#6B7280] mb-3">
            Customers must book at least this many hours before the appointment time
          </p>

          {/* Same-day disabled warning */}
          {sameDayDisabled && (
            <div className="mb-3 px-3 py-2 bg-[#FFB347]/10 border border-[#FFB347]/30 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FFB347] mt-0.5 flex-shrink-0" />
              <div className="text-xs text-[#434E54]">
                <span className="font-medium">Same-day booking disabled.</span> Customers cannot book appointments on the same day.
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="168"
              step="1"
              value={minAdvanceHours}
              onChange={(e) => setMinAdvanceHours(parseInt(e.target.value))}
              className="range range-sm flex-1"
            />
            <input
              type="number"
              min="0"
              max="168"
              value={minAdvanceHours}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= 168) {
                  setMinAdvanceHours(value);
                }
              }}
              className="input input-sm input-bordered w-20 bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none text-center"
            />
            <span className="text-sm text-[#6B7280] min-w-[60px]">hours</span>
          </div>

          {/* Quick preset buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            {[0, 2, 6, 12, 24, 48, 72].map((hours) => (
              <button
                key={hours}
                onClick={() => setMinAdvanceHours(hours)}
                className={`btn btn-xs ${
                  minAdvanceHours === hours
                    ? 'bg-[#434E54] text-white'
                    : 'bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]'
                }`}
              >
                {hours === 0 ? 'None' : hours === 24 ? '1 day' : hours >= 24 ? `${hours / 24} days` : `${hours}h`}
              </button>
            ))}
          </div>

          <div className="mt-3 text-xs text-[#6B7280]">
            {minAdvanceHours === 0 && '✓ Customers can book immediately (subject to availability)'}
            {minAdvanceHours > 0 && minAdvanceHours <= 24 && `✓ Same-day booking allowed if ${minAdvanceHours}+ hours notice`}
            {minAdvanceHours > 24 && `✓ Requires ${Math.floor(minAdvanceHours / 24)}+ days notice`}
          </div>
        </div>

        {/* Maximum Advance Booking */}
        <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
          <label className="flex items-center gap-2 text-sm font-medium text-[#434E54] mb-3">
            <Calendar className="w-4 h-4" />
            Maximum Advance Booking
          </label>
          <p className="text-xs text-[#6B7280] mb-3">
            Customers can book up to this many days in advance
          </p>

          <div className="flex items-center gap-4">
            <input
              type="range"
              min="7"
              max="365"
              step="1"
              value={maxAdvanceDays}
              onChange={(e) => setMaxAdvanceDays(parseInt(e.target.value))}
              className="range range-sm flex-1"
            />
            <input
              type="number"
              min="7"
              max="365"
              value={maxAdvanceDays}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 7 && value <= 365) {
                  setMaxAdvanceDays(value);
                }
              }}
              className="input input-sm input-bordered w-20 bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none text-center"
            />
            <span className="text-sm text-[#6B7280] min-w-[60px]">days</span>
          </div>

          {/* Quick preset buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            {[7, 14, 30, 60, 90, 180, 365].map((days) => (
              <button
                key={days}
                onClick={() => setMaxAdvanceDays(days)}
                className={`btn btn-xs ${
                  maxAdvanceDays === days
                    ? 'bg-[#434E54] text-white'
                    : 'bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]'
                }`}
              >
                {days === 7 ? '1 week' : days === 14 ? '2 weeks' : days === 30 ? '1 month' : days === 365 ? '1 year' : `${days}d`}
              </button>
            ))}
          </div>

          <div className="mt-3 text-xs text-[#6B7280]">
            ✓ Calendar shows {maxAdvanceDays} days from today
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-lg bg-[#434E54]/5 border border-[#434E54]/10">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#434E54]/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-[#434E54]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#434E54] mb-1">Booking Window Preview</h3>
              <p className="text-sm text-[#434E54]">
                {previewText}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button and Messages */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
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
              Save Changes
            </>
          )}
        </button>

        {/* Unsaved changes indicator */}
        {hasUnsavedChanges && !saveMessage && (
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
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{saveMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
