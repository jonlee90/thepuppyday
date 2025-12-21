/**
 * Cancellation Policy Component
 * Task 0182: Configure cancellation cutoff hours for bookings
 *
 * Allows admins to set:
 * - Cancellation cutoff hours (0-72 hours)
 * - Policy preview with human-readable text
 * - Visual timeline representation
 * - Warning for flexible policies
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, Save, AlertCircle, AlertTriangle, Clock, Ban } from 'lucide-react';
import type { BookingSettings } from '@/types/settings';

export function CancellationPolicy() {
  // State for cancellation cutoff
  const [cancellationCutoffHours, setCancellationCutoffHours] = useState<number>(24);

  // Original value for unsaved changes tracking
  const [originalCutoffHours, setOriginalCutoffHours] = useState<number>(24);

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
          setCancellationCutoffHours(settings.cancellation_cutoff_hours);
          setOriginalCutoffHours(settings.cancellation_cutoff_hours);
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
    return cancellationCutoffHours !== originalCutoffHours;
  }, [cancellationCutoffHours, originalCutoffHours]);

  // Check if policy is very flexible (0 hours)
  const isFlexiblePolicy = useMemo(() => {
    return cancellationCutoffHours === 0;
  }, [cancellationCutoffHours]);

  // Generate human-readable policy text
  const policyText = useMemo(() => {
    if (cancellationCutoffHours === 0) {
      return 'Customers can cancel at any time, even same-day';
    }

    const days = Math.floor(cancellationCutoffHours / 24);
    const remainingHours = cancellationCutoffHours % 24;

    let timeText = '';
    if (days > 0) {
      timeText = `${days} day${days > 1 ? 's' : ''}`;
      if (remainingHours > 0) {
        timeText += ` and ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
      }
    } else {
      timeText = `${cancellationCutoffHours} hour${cancellationCutoffHours > 1 ? 's' : ''}`;
    }

    return `Cancellations must be made at least ${timeText} before appointment`;
  }, [cancellationCutoffHours]);

  // Generate policy label for presets
  const getPolicyLabel = (hours: number) => {
    if (hours === 0) return 'Anytime';
    if (hours < 24) return `${hours} hours`;
    const days = hours / 24;
    return days === 1 ? '1 day' : `${days} days`;
  };

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

      // Update only the cancellation cutoff field
      const updatedSettings: BookingSettings = {
        ...currentSettings,
        cancellation_cutoff_hours: cancellationCutoffHours,
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

      // Refetch settings to confirm what was actually saved
      const refreshResponse = await fetch('/api/admin/settings/booking');
      if (refreshResponse.ok) {
        const refreshResult = await refreshResponse.json();
        if (refreshResult.data) {
          const settings = refreshResult.data as BookingSettings;
          setCancellationCutoffHours(settings.cancellation_cutoff_hours);
          setOriginalCutoffHours(settings.cancellation_cutoff_hours);
        }
      }

      setSaveMessage({
        type: 'success',
        text: 'Cancellation policy updated successfully!',
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
            <Ban className="w-5 h-5 text-[#434E54]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#434E54]">Cancellation Policy</h2>
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
          <Ban className="w-5 h-5 text-[#434E54]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#434E54]">Cancellation Policy</h2>
          <p className="text-sm text-[#6B7280]">
            Set how far in advance customers can cancel appointments
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Cancellation Cutoff Hours */}
        <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
          <label className="flex items-center gap-2 text-sm font-medium text-[#434E54] mb-3">
            <Clock className="w-4 h-4" />
            Cancellation Cutoff
          </label>
          <p className="text-xs text-[#6B7280] mb-4">
            Customers must cancel at least this many hours before their appointment
          </p>

          {/* Flexible policy warning */}
          {isFlexiblePolicy && (
            <div className="mb-4 px-3 py-2 bg-[#FFB347]/10 border border-[#FFB347]/30 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FFB347] mt-0.5 flex-shrink-0" />
              <div className="text-xs text-[#434E54]">
                <span className="font-medium">Flexible policy.</span> Customers can cancel anytime, but this may increase no-shows.
              </div>
            </div>
          )}

          {/* Preset buttons */}
          <div className="mb-4">
            <p className="text-xs text-[#6B7280] mb-2">Quick presets:</p>
            <div className="flex flex-wrap gap-2">
              {[0, 12, 24, 48, 72].map((hours) => (
                <button
                  key={hours}
                  onClick={() => setCancellationCutoffHours(hours)}
                  className={`btn btn-sm ${
                    cancellationCutoffHours === hours
                      ? 'bg-[#434E54] text-white'
                      : 'bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]'
                  }`}
                >
                  {getPolicyLabel(hours)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom selector */}
          <div className="space-y-3">
            <p className="text-xs text-[#6B7280]">Or set custom hours:</p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="72"
                step="1"
                value={cancellationCutoffHours}
                onChange={(e) => setCancellationCutoffHours(parseInt(e.target.value))}
                className="range range-sm flex-1"
              />
              <input
                type="number"
                min="0"
                max="72"
                value={cancellationCutoffHours}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 72) {
                    setCancellationCutoffHours(value);
                  }
                }}
                className="input input-sm input-bordered w-20 bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none text-center"
              />
              <span className="text-sm text-[#6B7280] min-w-[60px]">hours</span>
            </div>
          </div>
        </div>

        {/* Policy Preview */}
        <div className="p-4 rounded-lg bg-[#434E54]/5 border border-[#434E54]/10">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#434E54]/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-[#434E54]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#434E54] mb-1">Policy Preview</h3>
              <p className="text-sm text-[#434E54]">
                {policyText}
              </p>
            </div>
          </div>

          {/* Timeline visualization */}
          {cancellationCutoffHours > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-white border border-[#434E54]/10">
              <p className="text-xs text-[#6B7280] mb-2">Timeline:</p>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mb-1"></div>
                  <span className="text-[#6B7280] whitespace-nowrap">Today</span>
                </div>
                <div className="flex-1 border-t-2 border-dashed border-[#434E54]/20 relative">
                  <div className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 text-[#434E54] font-medium">
                    {cancellationCutoffHours}h cutoff
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-[#434E54] mb-1"></div>
                  <span className="text-[#6B7280] whitespace-nowrap">Appointment</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-green-600 font-medium">✅ Can cancel</span>
                <span className="text-red-600 font-medium">❌ Cannot cancel</span>
              </div>
            </div>
          )}

          {cancellationCutoffHours === 0 && (
            <div className="mt-4 p-3 rounded-lg bg-white border border-[#434E54]/10">
              <p className="text-xs text-green-600 font-medium">
                ✅ Customers can cancel at any point before their appointment
              </p>
            </div>
          )}
        </div>

        {/* Information Badges */}
        <div className="space-y-3">
          <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#434E54]">
              This policy appears in booking confirmations and reminder emails
            </p>
          </div>

          <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#434E54]">
              Changes apply to new bookings only, not existing appointments
            </p>
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
