/**
 * Buffer Time Settings Component
 * Task 0183: Configure buffer time between appointments
 *
 * Allows admins to set:
 * - Buffer time between appointments (0-60 minutes in 5-minute increments)
 * - Visual timeline showing how buffer time works
 * - Quick preset buttons for common values
 * - Warnings for edge cases (0 buffer = no cleanup time)
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, Save, AlertCircle, AlertTriangle, Calendar } from 'lucide-react';
import type { BookingSettings } from '@/types/settings';

export function BufferTimeSettings() {
  // State for buffer time
  const [bufferMinutes, setBufferMinutes] = useState<number>(15);

  // Original value for unsaved changes tracking
  const [originalBufferMinutes, setOriginalBufferMinutes] = useState<number>(15);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

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
          setBufferMinutes(settings.buffer_minutes);
          setOriginalBufferMinutes(settings.buffer_minutes);
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
    return bufferMinutes !== originalBufferMinutes;
  }, [bufferMinutes, originalBufferMinutes]);

  // Check if no buffer time (0 minutes)
  const hasNoBuffer = useMemo(() => {
    return bufferMinutes === 0;
  }, [bufferMinutes]);

  // Validate buffer time
  const validateBufferTime = (value: number): boolean => {
    // Must be divisible by 5
    if (value % 5 !== 0) {
      setValidationError('Buffer time must be divisible by 5 minutes');
      return false;
    }

    // Must be within range
    if (value < 0 || value > 120) {
      setValidationError('Buffer time must be between 0 and 120 minutes');
      return false;
    }

    setValidationError(null);
    return true;
  };

  // Handle buffer time change with validation
  const handleBufferChange = (value: number) => {
    setBufferMinutes(value);
    validateBufferTime(value);
  };

  // Generate example timeline
  const exampleTimeline = useMemo(() => {
    // Example: 10:00 AM appointment, 30 minutes duration
    const apt1Start = '10:00 AM';
    const apt1End = '10:30 AM';
    const bufferEnd = new Date(2024, 0, 1, 10, 30 + bufferMinutes);
    const bufferEndStr = bufferEnd.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const apt2Start = bufferEndStr;
    const apt2EndTime = new Date(2024, 0, 1, 10, 30 + bufferMinutes + 30);
    const apt2End = apt2EndTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return {
      apt1Start,
      apt1End,
      bufferEnd: bufferEndStr,
      apt2Start,
      apt2End,
    };
  }, [bufferMinutes]);

  // Handle save
  const handleSave = async () => {
    // Validate before saving
    if (!validateBufferTime(bufferMinutes)) {
      setSaveMessage({
        type: 'error',
        text: validationError || 'Invalid buffer time value',
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

      // Update only the buffer_minutes field
      const updatedSettings: BookingSettings = {
        ...currentSettings,
        buffer_minutes: bufferMinutes,
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

      // Update original value
      setOriginalBufferMinutes(bufferMinutes);

      setSaveMessage({
        type: 'success',
        text: 'Buffer time updated successfully!',
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
            <div className="h-32 bg-gray-100 rounded"></div>
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
            <Clock className="w-5 h-5 text-[#434E54]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#434E54]">Buffer Time Between Appointments</h2>
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
          <Clock className="w-5 h-5 text-[#434E54]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#434E54]">Buffer Time Between Appointments</h2>
          <p className="text-sm text-[#6B7280]">
            Set cleanup and preparation time between appointments
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Buffer Time Selection */}
        <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
          <label className="flex items-center gap-2 text-sm font-medium text-[#434E54] mb-3">
            <Clock className="w-4 h-4" />
            Buffer Time
          </label>
          <p className="text-xs text-[#6B7280] mb-4">
            Time added after each appointment for cleanup and preparation
          </p>

          {/* No buffer warning */}
          {hasNoBuffer && (
            <div className="mb-4 px-3 py-2 bg-[#FFB347]/10 border border-[#FFB347]/30 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FFB347] mt-0.5 flex-shrink-0" />
              <div className="text-xs text-[#434E54]">
                <span className="font-medium">No buffer time.</span> Back-to-back appointments leave no time for cleanup between sessions.
              </div>
            </div>
          )}

          {/* Validation error */}
          {validationError && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-600">
                <span className="font-medium">{validationError}</span>
              </div>
            </div>
          )}

          {/* Preset buttons */}
          <div className="mb-4">
            <p className="text-xs text-[#6B7280] mb-2">Quick presets:</p>
            <div className="flex flex-wrap gap-2">
              {[0, 15, 30, 45, 60].map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => handleBufferChange(minutes)}
                  className={`btn btn-sm ${
                    bufferMinutes === minutes
                      ? 'bg-[#434E54] text-white'
                      : 'bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]'
                  }`}
                >
                  {minutes === 0 ? 'None' : `${minutes} min`}
                </button>
              ))}
            </div>
          </div>

          {/* Custom slider */}
          <div className="space-y-3">
            <p className="text-xs text-[#6B7280]">Or set custom time (5-minute increments):</p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={bufferMinutes}
                onChange={(e) => handleBufferChange(parseInt(e.target.value))}
                className="range range-sm flex-1"
              />
              <input
                type="number"
                min="0"
                max="120"
                step="5"
                value={bufferMinutes}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    handleBufferChange(value);
                  }
                }}
                className="input input-sm input-bordered w-20 bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none text-center"
              />
              <span className="text-sm text-[#6B7280] min-w-[60px]">minutes</span>
            </div>
          </div>

          <div className="mt-3 text-xs text-[#6B7280]">
            {bufferMinutes === 0 && '⚠️ No buffer time - appointments can be scheduled back-to-back'}
            {bufferMinutes > 0 && bufferMinutes <= 15 && `✓ ${bufferMinutes} minutes for quick cleanup between appointments`}
            {bufferMinutes > 15 && bufferMinutes <= 30 && `✓ ${bufferMinutes} minutes for standard cleanup and preparation`}
            {bufferMinutes > 30 && `✓ ${bufferMinutes} minutes for thorough cleanup and setup`}
          </div>
        </div>

        {/* Timeline Example */}
        <div className="p-4 rounded-lg bg-[#434E54]/5 border border-[#434E54]/10">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#434E54]/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-[#434E54]" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#434E54] mb-1">Timeline Example</h3>
              <p className="text-xs text-[#6B7280] mb-4">
                How buffer time affects appointment scheduling
              </p>

              {/* Visual timeline */}
              <div className="space-y-3">
                {/* Appointment 1 */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#6B7280] font-medium min-w-[70px]">{exampleTimeline.apt1Start}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-[#434E54]"></div>
                    <div className="flex-1 border-t-2 border-[#434E54]"></div>
                    <div className="px-2 py-1 bg-[#434E54] text-white rounded text-xs font-medium">
                      Appointment 1
                    </div>
                    <div className="flex-1 border-t-2 border-[#434E54]"></div>
                    <div className="h-1 w-1 rounded-full bg-[#434E54]"></div>
                  </div>
                  <span className="text-[#6B7280] font-medium min-w-[70px] text-right">{exampleTimeline.apt1End}</span>
                </div>

                {/* Buffer time */}
                {bufferMinutes > 0 && (
                  <div className="flex items-center gap-2 text-xs pl-[70px]">
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 border-t-2 border-dashed border-[#FFB347]"></div>
                      <div className="px-2 py-1 bg-[#FFB347]/20 border border-[#FFB347]/30 text-[#434E54] rounded text-xs font-medium">
                        {bufferMinutes} min buffer
                      </div>
                      <div className="flex-1 border-t-2 border-dashed border-[#FFB347]"></div>
                    </div>
                    <span className="min-w-[70px]"></span>
                  </div>
                )}

                {/* Appointment 2 */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#6B7280] font-medium min-w-[70px]">{exampleTimeline.apt2Start}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-[#434E54]"></div>
                    <div className="flex-1 border-t-2 border-[#434E54]"></div>
                    <div className="px-2 py-1 bg-[#434E54] text-white rounded text-xs font-medium">
                      Appointment 2
                    </div>
                    <div className="flex-1 border-t-2 border-[#434E54]"></div>
                    <div className="h-1 w-1 rounded-full bg-[#434E54]"></div>
                  </div>
                  <span className="text-[#6B7280] font-medium min-w-[70px] text-right">{exampleTimeline.apt2End}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Badges */}
        <div className="space-y-3">
          <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#434E54]">
              Buffer time is added after each appointment ends
            </p>
          </div>

          <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#434E54]">
              Existing appointments are not affected by this change
            </p>
          </div>

          <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#434E54]">
              Buffer time allows for cleanup, preparation, and prevents scheduling conflicts
            </p>
          </div>
        </div>
      </div>

      {/* Save Button and Messages */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges || validationError !== null}
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
        {hasUnsavedChanges && !saveMessage && !validationError && (
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
