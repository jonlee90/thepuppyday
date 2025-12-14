/**
 * Waitlist Settings Component
 * Task 0068: Configure waitlist response window and default discount
 */

'use client';

import { useState, useEffect } from 'react';
import { Clock, Save, AlertCircle, Timer, Percent } from 'lucide-react';
import type { WaitlistSettings as WaitlistSettingsType } from '@/types/settings';

export function WaitlistSettings() {
  const [settings, setSettings] = useState<WaitlistSettingsType>({
    response_window_hours: 2,
    default_discount_percent: 10,
  });
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
        const response = await fetch('/api/admin/settings/phase6');
        if (!response.ok) throw new Error('Failed to fetch settings');

        const result = await response.json();
        if (result.data?.waitlist) {
          setSettings(result.data.waitlist);
        }
      } catch (error) {
        console.error('Error fetching waitlist settings:', error);
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

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/admin/settings/phase6', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          waitlist: settings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSaveMessage({
        type: 'success',
        text: 'Waitlist settings saved successfully!',
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving waitlist settings:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to save settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
          <Clock className="w-5 h-5 text-[#434E54]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#434E54]">Waitlist Settings</h2>
          <p className="text-sm text-[#6B7280]">
            Configure response window and discount preferences
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Response Window */}
        <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
          <label className="flex items-center gap-2 text-sm font-medium text-[#434E54] mb-3">
            <Timer className="w-4 h-4" />
            Response Window (Hours)
          </label>
          <p className="text-xs text-[#6B7280] mb-3">
            How long customers have to respond to a slot offer before it's released
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="24"
              step="1"
              value={settings.response_window_hours}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  response_window_hours: parseInt(e.target.value),
                })
              }
              className="range range-sm flex-1"
            />
            <input
              type="number"
              min="1"
              max="24"
              value={settings.response_window_hours}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  response_window_hours: parseInt(e.target.value),
                })
              }
              className="input input-sm input-bordered w-20 bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none text-center"
            />
            <span className="text-sm text-[#6B7280] min-w-[60px]">hours</span>
          </div>
          <div className="mt-3 flex gap-2">
            {[1, 2, 4, 8, 12, 24].map((hours) => (
              <button
                key={hours}
                onClick={() =>
                  setSettings({
                    ...settings,
                    response_window_hours: hours,
                  })
                }
                className={`btn btn-xs ${
                  settings.response_window_hours === hours
                    ? 'bg-[#434E54] text-white'
                    : 'bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]'
                }`}
              >
                {hours}h
              </button>
            ))}
          </div>
        </div>

        {/* Default Discount */}
        <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
          <label className="flex items-center gap-2 text-sm font-medium text-[#434E54] mb-3">
            <Percent className="w-4 h-4" />
            Default Discount Percentage
          </label>
          <p className="text-xs text-[#6B7280] mb-3">
            Default discount offered when notifying waitlist customers about available slots
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={settings.default_discount_percent}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  default_discount_percent: parseInt(e.target.value),
                })
              }
              className="range range-sm flex-1"
            />
            <input
              type="number"
              min="0"
              max="50"
              value={settings.default_discount_percent}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  default_discount_percent: parseInt(e.target.value),
                })
              }
              className="input input-sm input-bordered w-20 bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none text-center"
            />
            <span className="text-sm text-[#6B7280] min-w-[60px]">percent</span>
          </div>
          <div className="mt-3 flex gap-2">
            {[0, 5, 10, 15, 20, 25].map((percent) => (
              <button
                key={percent}
                onClick={() =>
                  setSettings({
                    ...settings,
                    default_discount_percent: percent,
                  })
                }
                className={`btn btn-xs ${
                  settings.default_discount_percent === percent
                    ? 'bg-[#434E54] text-white'
                    : 'bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]'
                }`}
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn bg-[#434E54] hover:bg-[#363F44] text-white border-none"
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
