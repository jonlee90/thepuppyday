/**
 * Report Card Settings Component
 * Task 0068: Configure report card auto-send, expiration, and review settings
 */

'use client';

import { useState, useEffect } from 'react';
import { FileText, Save, AlertCircle, Clock, Calendar, Star } from 'lucide-react';
import type { ReportCardSettings as ReportCardSettingsType } from '@/types/settings';

export function ReportCardSettings() {
  const [settings, setSettings] = useState<ReportCardSettingsType>({
    auto_send_delay_minutes: 15,
    expiration_days: 90,
    google_review_url: '',
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
        if (result.data?.report_card) {
          setSettings(result.data.report_card);
        }
      } catch (error) {
        console.error('Error fetching report card settings:', error);
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
          report_card: settings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSaveMessage({
        type: 'success',
        text: 'Report card settings saved successfully!',
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving report card settings:', error);
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
          <FileText className="w-5 h-5 text-[#434E54]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#434E54]">Report Card Settings</h2>
          <p className="text-sm text-[#6B7280]">
            Configure automatic sending, expiration, and review options
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Auto-Send Delay */}
        <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
          <label className="flex items-center gap-2 text-sm font-medium text-[#434E54] mb-3">
            <Clock className="w-4 h-4" />
            Auto-Send Delay (Minutes)
          </label>
          <p className="text-xs text-[#6B7280] mb-3">
            How long after appointment completion to automatically send the report card
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={settings.auto_send_delay_minutes}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  auto_send_delay_minutes: parseInt(e.target.value),
                })
              }
              className="range range-sm flex-1"
            />
            <input
              type="number"
              min="5"
              max="60"
              value={settings.auto_send_delay_minutes}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  auto_send_delay_minutes: parseInt(e.target.value),
                })
              }
              className="input input-sm input-bordered w-20 bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none text-center"
            />
            <span className="text-sm text-[#6B7280] min-w-[60px]">minutes</span>
          </div>
        </div>

        {/* Expiration Days */}
        <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
          <label className="flex items-center gap-2 text-sm font-medium text-[#434E54] mb-3">
            <Calendar className="w-4 h-4" />
            Link Expiration (Days)
          </label>
          <p className="text-xs text-[#6B7280] mb-3">
            How long the report card link remains accessible
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="30"
              max="365"
              step="15"
              value={settings.expiration_days}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  expiration_days: parseInt(e.target.value),
                })
              }
              className="range range-sm flex-1"
            />
            <input
              type="number"
              min="30"
              max="365"
              value={settings.expiration_days}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  expiration_days: parseInt(e.target.value),
                })
              }
              className="input input-sm input-bordered w-20 bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none text-center"
            />
            <span className="text-sm text-[#6B7280] min-w-[60px]">days</span>
          </div>
        </div>

        {/* Google Review URL */}
        <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
          <label className="flex items-center gap-2 text-sm font-medium text-[#434E54] mb-3">
            <Star className="w-4 h-4" />
            Google Business Review URL
          </label>
          <p className="text-xs text-[#6B7280] mb-3">
            Link where customers with 4-5 star ratings will be directed
          </p>
          <input
            type="url"
            value={settings.google_review_url}
            onChange={(e) =>
              setSettings({
                ...settings,
                google_review_url: e.target.value,
              })
            }
            placeholder="https://www.google.com/maps/place/..."
            className="input input-bordered w-full bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none placeholder:text-gray-400"
          />
          <p className="text-xs text-[#6B7280] mt-2">
            Example: https://www.google.com/maps/place/Puppy+Day/@33.9176,-118.0086,17z
          </p>
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
