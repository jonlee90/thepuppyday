/**
 * Marketing Settings Component
 * Task 0068: Configure marketing automation settings
 */

'use client';

import { useState, useEffect } from 'react';
import { Mail, Save, AlertCircle, Calendar } from 'lucide-react';
import type { MarketingSettings as MarketingSettingsType } from '@/types/settings';

export function MarketingSettings() {
  const [settings, setSettings] = useState<MarketingSettingsType>({
    retention_reminder_advance_days: 7,
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
        if (result.data?.marketing) {
          setSettings(result.data.marketing);
        }
      } catch (error) {
        console.error('Error fetching marketing settings:', error);
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
          marketing: settings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSaveMessage({
        type: 'success',
        text: 'Marketing settings saved successfully!',
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving marketing settings:', error);
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
          <Mail className="w-5 h-5 text-[#434E54]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#434E54]">Marketing Settings</h2>
          <p className="text-sm text-[#6B7280]">
            Configure automated marketing and retention campaigns
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Retention Reminder Advance Days */}
        <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
          <label className="flex items-center gap-2 text-sm font-medium text-[#434E54] mb-3">
            <Calendar className="w-4 h-4" />
            Retention Reminder Advance (Days)
          </label>
          <p className="text-xs text-[#6B7280] mb-3">
            How many days before the recommended grooming date to send retention reminders
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={settings.retention_reminder_advance_days}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  retention_reminder_advance_days: parseInt(e.target.value),
                })
              }
              className="range range-sm flex-1"
            />
            <input
              type="number"
              min="1"
              max="30"
              value={settings.retention_reminder_advance_days}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  retention_reminder_advance_days: parseInt(e.target.value),
                })
              }
              className="input input-sm input-bordered w-20 bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none text-center"
            />
            <span className="text-sm text-[#6B7280] min-w-[60px]">days</span>
          </div>
          <div className="mt-3 flex gap-2">
            {[3, 5, 7, 10, 14].map((days) => (
              <button
                key={days}
                onClick={() =>
                  setSettings({
                    ...settings,
                    retention_reminder_advance_days: days,
                  })
                }
                className={`btn btn-xs ${
                  settings.retention_reminder_advance_days === days
                    ? 'bg-[#434E54] text-white'
                    : 'bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Example:</strong> If a Golden Retriever needs grooming every 8 weeks and their
              last appointment was on Jan 1, with a {settings.retention_reminder_advance_days}-day
              advance, they'll receive a reminder on{' '}
              {new Date(
                Date.now() + (56 - settings.retention_reminder_advance_days) * 24 * 60 * 60 * 1000
              ).toLocaleDateString()}{' '}
              (8 weeks minus {settings.retention_reminder_advance_days} days).
            </p>
          </div>
        </div>

        {/* Future Settings Placeholder */}
        <div className="p-4 rounded-lg border border-dashed border-[#434E54]/20 bg-gray-50">
          <p className="text-sm text-[#6B7280] text-center italic">
            Additional marketing settings (campaign scheduling, segmentation, etc.) will be added in
            future phases
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
